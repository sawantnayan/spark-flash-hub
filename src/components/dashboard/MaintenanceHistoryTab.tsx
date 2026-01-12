import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Wrench, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface MaintenanceHistoryTabProps {
  userId: string;
  isAdminOrStaff: boolean;
  onUpdate: () => void;
}

interface MaintenanceLog {
  id: string;
  computer_id: string;
  performed_by: string;
  maintenance_type: string;
  description: string;
  parts_replaced: string | null;
  cost: number | null;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  computers: { name: string; system_id: string } | null;
  profiles: { full_name: string } | null;
}

interface Computer {
  id: string;
  name: string;
  system_id: string;
}

const MAINTENANCE_TYPES = [
  'Preventive',
  'Corrective',
  'Hardware Upgrade',
  'Software Update',
  'Cleaning',
  'Repair',
  'Inspection',
  'Other',
];

export default function MaintenanceHistoryTab({ userId, isAdminOrStaff, onUpdate }: MaintenanceHistoryTabProps) {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [computers, setComputers] = useState<Computer[]>([]);
  const [open, setOpen] = useState(false);
  const [filterComputer, setFilterComputer] = useState<string>('all');
  const [formData, setFormData] = useState({
    computer_id: '',
    maintenance_type: '',
    description: '',
    parts_replaced: '',
    cost: '',
    notes: '',
    started_at: new Date().toISOString().slice(0, 16),
    completed_at: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
    fetchComputers();
  }, [filterComputer]);

  const fetchLogs = async () => {
    let query = supabase
      .from('maintenance_logs')
      .select(`
        *,
        computers(name, system_id)
      `)
      .order('started_at', { ascending: false });

    if (filterComputer !== 'all') {
      query = query.eq('computer_id', filterComputer);
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: 'Error fetching maintenance logs', variant: 'destructive' });
    } else {
      // Fetch profiles separately
      const performerIds = [...new Set((data || []).map(d => d.performed_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', performerIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
      
      const logsWithProfiles = (data || []).map(log => ({
        ...log,
        profiles: { full_name: profileMap.get(log.performed_by) || 'Unknown' }
      }));
      
      setLogs(logsWithProfiles as MaintenanceLog[]);
    }
  };

  const fetchComputers = async () => {
    const { data } = await supabase
      .from('computers')
      .select('id, name, system_id')
      .order('name');
    setComputers(data || []);
  };

  const handleSubmit = async () => {
    if (!formData.computer_id || !formData.maintenance_type || !formData.description) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('maintenance_logs').insert({
      computer_id: formData.computer_id,
      performed_by: userId,
      maintenance_type: formData.maintenance_type,
      description: formData.description,
      parts_replaced: formData.parts_replaced || null,
      cost: formData.cost ? parseFloat(formData.cost) : null,
      notes: formData.notes || null,
      started_at: formData.started_at,
      completed_at: formData.completed_at || null,
    });

    if (error) {
      toast({ title: 'Error adding maintenance log', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Maintenance log added successfully' });
      setOpen(false);
      setFormData({
        computer_id: '',
        maintenance_type: '',
        description: '',
        parts_replaced: '',
        cost: '',
        notes: '',
        started_at: new Date().toISOString().slice(0, 16),
        completed_at: '',
      });
      fetchLogs();
      onUpdate();
    }
  };

  const handleComplete = async (logId: string) => {
    const { error } = await supabase
      .from('maintenance_logs')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', logId);

    if (error) {
      toast({ title: 'Error completing maintenance', variant: 'destructive' });
    } else {
      toast({ title: 'Maintenance marked as completed' });
      fetchLogs();
    }
  };

  const getStatusBadge = (completedAt: string | null) => {
    if (completedAt) {
      return (
        <Badge className="bg-success/10 text-success border-success/20" variant="outline">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    }
    return (
      <Badge className="bg-warning/10 text-warning border-warning/20" variant="outline">
        <Clock className="w-3 h-3 mr-1" />
        In Progress
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      Preventive: 'bg-primary/10 text-primary border-primary/20',
      Corrective: 'bg-destructive/10 text-destructive border-destructive/20',
      'Hardware Upgrade': 'bg-accent/10 text-accent border-accent/20',
      'Software Update': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      Cleaning: 'bg-green-500/10 text-green-500 border-green-500/20',
      Repair: 'bg-warning/10 text-warning border-warning/20',
    };
    return colors[type] || 'bg-muted text-muted-foreground border-border';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Wrench className="w-6 h-6" />
          Maintenance History
        </h2>
        <div className="flex items-center gap-2">
          <Select value={filterComputer} onValueChange={setFilterComputer}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by computer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Computers</SelectItem>
              {computers.map((computer) => (
                <SelectItem key={computer.id} value={computer.id}>
                  {computer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdminOrStaff && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Log Maintenance
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Log Maintenance Activity</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Computer *</Label>
                    <Select
                      value={formData.computer_id}
                      onValueChange={(value) => setFormData({ ...formData, computer_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select computer" />
                      </SelectTrigger>
                      <SelectContent>
                        {computers.map((computer) => (
                          <SelectItem key={computer.id} value={computer.id}>
                            {computer.name} ({computer.system_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Maintenance Type *</Label>
                    <Select
                      value={formData.maintenance_type}
                      onValueChange={(value) => setFormData({ ...formData, maintenance_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {MAINTENANCE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description *</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the maintenance work..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Parts Replaced</Label>
                      <Input
                        value={formData.parts_replaced}
                        onChange={(e) => setFormData({ ...formData, parts_replaced: e.target.value })}
                        placeholder="e.g., RAM, SSD"
                      />
                    </div>
                    <div>
                      <Label>Cost ($)</Label>
                      <Input
                        type="number"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Started At</Label>
                      <Input
                        type="datetime-local"
                        value={formData.started_at}
                        onChange={(e) => setFormData({ ...formData, started_at: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Completed At</Label>
                      <Input
                        type="datetime-local"
                        value={formData.completed_at}
                        onChange={(e) => setFormData({ ...formData, completed_at: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes..."
                      rows={2}
                    />
                  </div>
                  <Button onClick={handleSubmit} className="w-full">
                    Log Maintenance
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Computer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Status</TableHead>
              {isAdminOrStaff && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No maintenance logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {log.computers?.name || 'Unknown'}
                    <div className="text-xs text-muted-foreground">
                      {log.computers?.system_id}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeBadge(log.maintenance_type)} variant="outline">
                      {log.maintenance_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.description}
                    {log.parts_replaced && (
                      <div className="text-xs text-muted-foreground">
                        Parts: {log.parts_replaced}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{log.profiles?.full_name || 'Unknown'}</TableCell>
                  <TableCell>
                    <div>{format(new Date(log.started_at), 'PPp')}</div>
                    {log.completed_at && (
                      <div className="text-xs text-muted-foreground">
                        Completed: {format(new Date(log.completed_at), 'PPp')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.cost ? (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {log.cost.toFixed(2)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(log.completed_at)}</TableCell>
                  {isAdminOrStaff && (
                    <TableCell>
                      {!log.completed_at && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleComplete(log.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
