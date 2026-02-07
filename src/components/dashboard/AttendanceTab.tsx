import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Monitor } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface AttendanceTabProps {
  userId: string;
}

interface SessionLog {
  id: string;
  computer_id: string;
  login_time: string;
  logout_time: string | null;
  duration_minutes: number | null;
  computer?: {
    name: string;
    location: string;
  };
}

export default function AttendanceTab({ userId }: AttendanceTabProps) {
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDays: 0,
    totalHours: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    if (userId) {
      fetchAttendance();
    }
  }, [userId]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('session_logs')
        .select(`
          id,
          computer_id,
          login_time,
          logout_time,
          duration_minutes,
          computers(name, location)
        `)
        .eq('user_id', userId)
        .order('login_time', { ascending: false });

      if (error) throw error;

      const sessionsWithComputer = (data || []).map(s => ({
        ...s,
        computer: s.computers as any
      }));

      setSessions(sessionsWithComputer);
      calculateStats(sessionsWithComputer);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (sessionsData: SessionLog[]) => {
    // Get unique days
    const uniqueDays = new Set(
      sessionsData.map(s => format(parseISO(s.login_time), 'yyyy-MM-dd'))
    );

    // Total hours
    const totalMinutes = sessionsData.reduce(
      (acc, s) => acc + (s.duration_minutes || 0),
      0
    );

    // This month sessions
    const currentMonth = format(new Date(), 'yyyy-MM');
    const thisMonthSessions = sessionsData.filter(
      s => format(parseISO(s.login_time), 'yyyy-MM') === currentMonth
    ).length;

    setStats({
      totalDays: uniqueDays.size,
      totalHours: Math.round(totalMinutes / 60),
      thisMonth: thisMonthSessions,
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading attendance...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-background">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.totalDays}</p>
              <p className="text-sm text-muted-foreground">Days Attended</p>
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

        <Card className="p-4 bg-gradient-to-br from-success/10 to-background">
          <div className="flex items-center gap-3">
            <Monitor className="w-8 h-8 text-success" />
            <div>
              <p className="text-2xl font-bold">{stats.thisMonth}</p>
              <p className="text-sm text-muted-foreground">Sessions This Month</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card className="p-4 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">Attendance History</h3>
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableCell className="font-medium">
                  {format(parseISO(session.login_time), 'dd MMM yyyy')}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {format(parseISO(session.login_time), 'EEEE')}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(parseISO(session.login_time), 'hh:mm a')}
                </TableCell>
                <TableCell>
                  {session.logout_time 
                    ? format(parseISO(session.logout_time), 'hh:mm a')
                    : <Badge variant="secondary">Active</Badge>
                  }
                </TableCell>
                <TableCell>{formatDuration(session.duration_minutes)}</TableCell>
                <TableCell>{session.computer?.name || '-'}</TableCell>
                <TableCell>{session.computer?.location || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {sessions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No attendance records found.
          </div>
        )}
      </Card>
    </div>
  );
}
