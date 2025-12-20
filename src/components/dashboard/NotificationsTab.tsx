import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Trash2, Plus } from 'lucide-react';
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

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
}

interface NotificationsTabProps {
  userId: string;
  isAdminOrStaff: boolean;
}

export default function NotificationsTab({ userId, isAdminOrStaff }: NotificationsTabProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newNotification, setNewNotification] = useState({
    user_id: '',
    type: 'system',
    title: '',
    message: '',
  });

  useEffect(() => {
    fetchNotifications();
    if (isAdminOrStaff) {
      fetchUsers();
    }
  }, [userId, isAdminOrStaff]);

  const fetchNotifications = async () => {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Admin/staff can view all notifications, users view only their own
    if (!isAdminOrStaff) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: 'Error fetching notifications', variant: 'destructive' });
    } else {
      setNotifications(data || []);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email');

    if (!error && data) {
      setUsers(data);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      toast({ title: 'Error marking notification as read', variant: 'destructive' });
    } else {
      toast({ title: 'Notification marked as read' });
      fetchNotifications();
    }
  };

  const handleDelete = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      toast({ title: 'Error deleting notification', variant: 'destructive' });
    } else {
      toast({ title: 'Notification deleted' });
      fetchNotifications();
    }
  };

  const handleCreateNotification = async () => {
    if (!newNotification.user_id || !newNotification.title || !newNotification.message) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    // If "all" is selected, send to all users
    if (newNotification.user_id === 'all') {
      const notifications = users.map(user => ({
        user_id: user.id,
        type: newNotification.type,
        title: newNotification.title,
        message: newNotification.message,
      }));
      
      const { error } = await supabase.from('notifications').insert(notifications);
      
      if (error) {
        toast({ title: 'Error creating notifications', variant: 'destructive' });
      } else {
        toast({ title: `Notification sent to ${users.length} users` });
        setIsAddOpen(false);
        setNewNotification({ user_id: '', type: 'system', title: '', message: '' });
        fetchNotifications();
      }
    } else {
      const { error } = await supabase
        .from('notifications')
        .insert([newNotification]);

      if (error) {
        toast({ title: 'Error creating notification', variant: 'destructive' });
      } else {
        toast({ title: 'Notification created successfully' });
        setIsAddOpen(false);
        setNewNotification({ user_id: '', type: 'system', title: '', message: '' });
        fetchNotifications();
      }
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      booking: 'bg-blue-500',
      license_expiry: 'bg-amber-500',
      maintenance: 'bg-red-500',
      system: 'bg-purple-500',
      session: 'bg-green-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Notifications
        </h2>
        {isAdminOrStaff && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Send Notification
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Notification</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>User</Label>
                  <Select
                    value={newNotification.user_id}
                    onValueChange={(value) =>
                      setNewNotification({ ...newNotification, user_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="font-semibold text-primary">
                        📢 Send to All Users
                      </SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newNotification.type}
                    onValueChange={(value) =>
                      setNewNotification({ ...newNotification, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="booking">Booking</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="license_expiry">License Expiry</SelectItem>
                      <SelectItem value="session">Session</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newNotification.title}
                    onChange={(e) =>
                      setNewNotification({ ...newNotification, title: e.target.value })
                    }
                    placeholder="Notification title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={newNotification.message}
                    onChange={(e) =>
                      setNewNotification({ ...newNotification, message: e.target.value })
                    }
                    placeholder="Notification message"
                    rows={4}
                  />
                </div>
                <Button onClick={handleCreateNotification} className="w-full">
                  Send Notification
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border ${
                notification.read ? 'bg-muted/30' : 'bg-card'
              } transition-colors`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor(notification.type)}>
                      {notification.type}
                    </Badge>
                    {!notification.read && (
                      <Badge variant="outline">New</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold">{notification.title}</h3>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!notification.read && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  {isAdminOrStaff && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
