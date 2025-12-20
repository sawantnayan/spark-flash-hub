import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  computers: { name: string; system_id: string };
  profiles: { full_name: string };
}

export default function IssuesTab({ userId, isAdminOrStaff, onUpdate }: { userId: string; isAdminOrStaff: boolean; onUpdate: () => void }) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [computers, setComputers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchIssues();
    fetchComputers();
  }, [userId]);

  const fetchIssues = async () => {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        computers(name, system_id)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching issues:', error);
      return;
    }
    
    if (data && data.length > 0) {
      // Fetch profiles separately to avoid foreign key join issues
      const reporterIds = [...new Set(data.map(i => i.reported_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', reporterIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const issuesWithProfiles = data.map(i => ({
        ...i,
        profiles: profileMap.get(i.reported_by) || { full_name: 'Unknown' }
      }));
      setIssues(issuesWithProfiles as any);
    } else {
      setIssues([]);
    }
  };

  const fetchComputers = async () => {
    const { data } = await supabase
      .from('computers')
      .select('id, name, system_id');
    if (data) setComputers(data);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const issueData = {
      reported_by: userId,
      computer_id: formData.get('computer_id') as string,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as string,
      status: 'pending' as const,
    };

    const { error } = await supabase.from('issues').insert([issueData]);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Issue reported successfully' });
      setOpen(false);
      fetchIssues();
      onUpdate();
    }
  };

  const updateIssueStatus = async (issueId: string, status: string) => {
    const updateData: any = { status };
    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = userId;
    }

    const { error } = await supabase
      .from('issues')
      .update(updateData)
      .eq('id', issueId);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Issue marked as ${status}` });
      fetchIssues();
      onUpdate();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-success/10 text-success border-success/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'in_progress': return 'bg-primary/10 text-primary border-primary/20';
      case 'closed': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'low': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Report Issue
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report New Issue</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="computer_id">Computer *</Label>
                <Select name="computer_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a computer" />
                  </SelectTrigger>
                  <SelectContent>
                    {computers.map((comp) => (
                      <SelectItem key={comp.id} value={comp.id}>
                        {comp.name} ({comp.system_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Issue Title *</Label>
                <Input id="title" name="title" placeholder="Brief description" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" name="description" placeholder="Detailed description of the issue" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select name="priority" defaultValue="medium" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Report Issue</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-warning" />
                  <h3 className="font-semibold">{issue.title}</h3>
                  <Badge className={getStatusColor(issue.status)} variant="outline">
                    {issue.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(issue.priority)} variant="outline">
                    {issue.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Computer: {issue.computers.name} ({issue.computers.system_id})</p>
                  <p>Reported by: {issue.profiles.full_name}</p>
                  <p>Date: {format(new Date(issue.created_at), 'PPP')}</p>
                </div>
              </div>
              {isAdminOrStaff && issue.status === 'pending' && (
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateIssueStatus(issue.id, 'in_progress')}
                  >
                    Start
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateIssueStatus(issue.id, 'resolved')}
                  >
                    Resolve
                  </Button>
                </div>
              )}
              {isAdminOrStaff && issue.status === 'in_progress' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateIssueStatus(issue.id, 'resolved')}
                >
                  Resolve
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {issues.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>No issues found. Report one if you encounter problems.</p>
        </div>
      )}
    </div>
  );
}
