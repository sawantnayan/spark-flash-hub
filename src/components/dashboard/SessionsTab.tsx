import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, LogOut } from 'lucide-react';
import { format } from 'date-fns';

interface SessionsTabProps {
  userId: string;
  isAdminOrStaff: boolean;
  onUpdate: () => void;
}

export default function SessionsTab({ userId, isAdminOrStaff, onUpdate }: SessionsTabProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [computers, setComputers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedComputer, setSelectedComputer] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
    if (isAdminOrStaff) {
      fetchComputers();
      fetchUsers();
    }
  }, [isAdminOrStaff]);

  const fetchSessions = async () => {
    const query = supabase
      .from('session_logs')
      .select(`
        *,
        computers(name, system_id),
        profiles(full_name, email)
      `)
      .order('login_time', { ascending: false });

    if (!isAdminOrStaff) {
      query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: 'Error fetching sessions', variant: 'destructive' });
    } else {
      setSessions(data || []);
    }
  };

  const fetchComputers = async () => {
    const { data } = await supabase
      .from('computers')
      .select('id, name, system_id')
      .eq('status', 'available');
    setComputers(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, email');
    setUsers(data || []);
  };

  const handleStartSession = async () => {
    if (!selectedComputer || !selectedUser) {
      toast({ title: 'Please select a computer and user', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('session_logs').insert({
      computer_id: selectedComputer,
      user_id: selectedUser,
      login_time: new Date().toISOString(),
    });

    if (error) {
      toast({ title: 'Error starting session', variant: 'destructive' });
    } else {
      toast({ title: 'Session started successfully' });
      setOpen(false);
      setSelectedComputer('');
      setSelectedUser('');
      fetchSessions();
      onUpdate();
    }
  };

  const handleEndSession = async (sessionId: string, loginTime: string) => {
    const logoutTime = new Date();
    const duration = Math.floor((logoutTime.getTime() - new Date(loginTime).getTime()) / 60000);

    const { error } = await supabase
      .from('session_logs')
      .update({
        logout_time: logoutTime.toISOString(),
        duration_minutes: duration,
      })
      .eq('id', sessionId);

    if (error) {
      toast({ title: 'Error ending session', variant: 'destructive' });
    } else {
      toast({ title: 'Session ended successfully' });
      fetchSessions();
      onUpdate();
    }
  };

  return (
    <div className="space-y-4">
      {isAdminOrStaff && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Start Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start New Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Computer</Label>
                <Select value={selectedComputer} onValueChange={setSelectedComputer}>
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
                <Label>User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleStartSession} className="w-full">
                Start Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Computer</TableHead>
              <TableHead>Login Time</TableHead>
              <TableHead>Logout Time</TableHead>
              <TableHead>Duration (min)</TableHead>
              {isAdminOrStaff && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell>{session.profiles?.full_name}</TableCell>
                <TableCell>{session.computers?.name}</TableCell>
                <TableCell>
                  {session.login_time
                    ? format(new Date(session.login_time), 'PPp')
                    : '-'}
                </TableCell>
                <TableCell>
                  {session.logout_time
                    ? format(new Date(session.logout_time), 'PPp')
                    : 'Active'}
                </TableCell>
                <TableCell>{session.duration_minutes || '-'}</TableCell>
                {isAdminOrStaff && (
                  <TableCell>
                    {!session.logout_time && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEndSession(session.id, session.login_time)}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        End
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
