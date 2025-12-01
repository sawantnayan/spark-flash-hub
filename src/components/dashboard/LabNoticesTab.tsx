import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface LabNotice {
  id: string;
  title: string;
  content: string;
  priority: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  is_active: boolean;
}

interface LabNoticesTabProps {
  userId: string;
  isAdminOrStaff: boolean;
}

export default function LabNoticesTab({ userId, isAdminOrStaff }: LabNoticesTabProps) {
  const [notices, setNotices] = useState<LabNotice[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<LabNotice | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    expires_at: '',
    is_active: true,
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    const { data, error } = await supabase
      .from('lab_notices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error fetching notices', variant: 'destructive' });
    } else {
      setNotices(data || []);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    const noticeData = {
      ...formData,
      created_by: userId,
      expires_at: formData.expires_at || null,
    };

    if (editingNotice) {
      const { error } = await supabase
        .from('lab_notices')
        .update(noticeData)
        .eq('id', editingNotice.id);

      if (error) {
        toast({ title: 'Error updating notice', variant: 'destructive' });
      } else {
        toast({ title: 'Notice updated successfully' });
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('lab_notices')
        .insert([noticeData]);

      if (error) {
        toast({ title: 'Error creating notice', variant: 'destructive' });
      } else {
        toast({ title: 'Notice created successfully' });
        resetForm();
      }
    }
    fetchNotices();
  };

  const handleEdit = (notice: LabNotice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      priority: notice.priority,
      expires_at: notice.expires_at || '',
      is_active: notice.is_active,
    });
    setIsAddOpen(true);
  };

  const handleDelete = async (noticeId: string) => {
    const { error } = await supabase
      .from('lab_notices')
      .delete()
      .eq('id', noticeId);

    if (error) {
      toast({ title: 'Error deleting notice', variant: 'destructive' });
    } else {
      toast({ title: 'Notice deleted successfully' });
      fetchNotices();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      expires_at: '',
      is_active: true,
    });
    setEditingNotice(null);
    setIsAddOpen(false);
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-500',
      normal: 'bg-green-500',
      high: 'bg-amber-500',
      urgent: 'bg-red-500',
    };
    return colors[priority] || 'bg-gray-500';
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="w-6 h-6" />
          Lab Rules & Notices
        </h2>
        {isAdminOrStaff && (
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Notice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingNotice ? 'Edit Notice' : 'Create New Notice'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Notice title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content *</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="Notice content"
                    rows={6}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Expires At (Optional)</Label>
                    <Input
                      type="datetime-local"
                      value={formData.expires_at}
                      onChange={(e) =>
                        setFormData({ ...formData, expires_at: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label>Active</Label>
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  {editingNotice ? 'Update Notice' : 'Create Notice'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-4">
        {notices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No notices posted yet
          </div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              className={`p-6 rounded-lg border ${
                !notice.is_active || isExpired(notice.expires_at)
                  ? 'bg-muted/30 opacity-60'
                  : 'bg-card'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getPriorityColor(notice.priority)}>
                      {notice.priority}
                    </Badge>
                    {!notice.is_active && (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                    {isExpired(notice.expires_at) && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold">{notice.title}</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {notice.content}
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      Posted on {new Date(notice.created_at).toLocaleString()}
                    </p>
                    {notice.expires_at && (
                      <p>
                        Expires: {new Date(notice.expires_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                {isAdminOrStaff && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(notice)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(notice.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
