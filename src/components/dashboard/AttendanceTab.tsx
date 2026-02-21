import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Monitor } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface AttendanceTabProps {
  userId: string;
  isAdminOrStaff?: boolean;
}

interface SessionLog {
  id: string;
  user_id: string;
  computer_id: string;
  login_time: string;
  logout_time: string | null;
  duration_minutes: number | null;
  computer?: { name: string; location: string };
  userName?: string;
}

export default function AttendanceTab({ userId, isAdminOrStaff = false }: AttendanceTabProps) {
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalDays: 0, totalHours: 0, thisMonth: 0 });

  useEffect(() => {
    fetchAttendance();
  }, [userId, isAdminOrStaff]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('session_logs')
        .select('id, user_id, computer_id, login_time, logout_time, duration_minutes, computers(name, location)')
        .order('login_time', { ascending: false });

      if (!isAdminOrStaff) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      let sessionsData: SessionLog[] = (data || []).map(s => ({
        ...s,
        computer: s.computers as any,
      }));

      // For admin/staff, fetch user names
      if (isAdminOrStaff && sessionsData.length > 0) {
        const userIds = [...new Set(sessionsData.map(s => s.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
        sessionsData = sessionsData.map(s => ({ ...s, userName: profileMap.get(s.user_id) || 'Unknown' }));
      }

      setSessions(sessionsData);
      calculateStats(sessionsData);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (sessionsData: SessionLog[]) => {
    const uniqueDays = new Set(sessionsData.map(s => format(parseISO(s.login_time), 'yyyy-MM-dd')));
    const totalMinutes = sessionsData.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    const currentMonth = format(new Date(), 'yyyy-MM');
    const thisMonthSessions = sessionsData.filter(s => format(parseISO(s.login_time), 'yyyy-MM') === currentMonth).length;
    setStats({ totalDays: uniqueDays.size, totalHours: Math.round(totalMinutes / 60), thisMonth: thisMonthSessions });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) return <div className="text-center py-8">Loading attendance...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-background">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.totalDays}</p>
              <p className="text-sm text-muted-foreground">{isAdminOrStaff ? 'Unique Days' : 'Days Attended'}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-accent/10 to-background">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-accent" />
            <div>
              <p className="text-2xl font-bold">{stats.totalHours}</p>
              <p className="text-sm text-muted-foreground">Total Hours</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-background">
          <div className="flex items-center gap-3">
            <Monitor className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.thisMonth}</p>
              <p className="text-sm text-muted-foreground">Sessions This Month</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">{isAdminOrStaff ? 'All User Activity' : 'Attendance History'}</h3>
        <Table>
          <TableHeader>
            <TableRow>
              {isAdminOrStaff && <TableHead>User</TableHead>}
              <TableHead>Date</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Login Time</TableHead>
              <TableHead>Logout Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Computer</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id}>
                {isAdminOrStaff && <TableCell className="font-medium">{session.userName}</TableCell>}
                <TableCell className="font-medium">{format(parseISO(session.login_time), 'dd MMM yyyy')}</TableCell>
                <TableCell><Badge variant="outline">{format(parseISO(session.login_time), 'EEEE')}</Badge></TableCell>
                <TableCell>{format(parseISO(session.login_time), 'hh:mm a')}</TableCell>
                <TableCell>
                  {session.logout_time 
                    ? format(parseISO(session.logout_time), 'hh:mm a')
                    : <Badge variant="secondary">Active</Badge>}
                </TableCell>
                <TableCell>{formatDuration(session.duration_minutes)}</TableCell>
                <TableCell>{session.computer?.name || '-'}</TableCell>
                <TableCell>{session.computer?.location || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {sessions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No attendance records found.</div>
        )}
      </Card>
    </div>
  );
}
