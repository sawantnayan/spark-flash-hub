import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';

export default function AnalyticsCharts() {
  const [bookingTrends, setBookingTrends] = useState<any[]>([]);
  const [issueStats, setIssueStats] = useState<any[]>([]);
  const [computerUsage, setComputerUsage] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    // Fetch booking trends
    const startDate = startOfMonth(new Date());
    const endDate = endOfMonth(new Date());
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const { data: bookings } = await supabase
      .from('bookings')
      .select('start_time, status')
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString());

    const bookingsByDay = days.map((day) => ({
      date: format(day, 'MMM dd'),
      bookings:
        bookings?.filter(
          (b) => format(new Date(b.start_time), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
        ).length || 0,
    }));
    setBookingTrends(bookingsByDay);

    // Fetch issue statistics
    const { data: issues } = await supabase.from('issues').select('status, priority');

    const issuesByStatus = [
      {
        name: 'Pending',
        value: issues?.filter((i) => i.status === 'pending').length || 0,
        color: 'hsl(var(--warning))',
      },
      {
        name: 'In Progress',
        value: issues?.filter((i) => i.status === 'in_progress').length || 0,
        color: 'hsl(var(--primary))',
      },
      {
        name: 'Resolved',
        value: issues?.filter((i) => i.status === 'resolved').length || 0,
        color: 'hsl(var(--success))',
      },
      {
        name: 'Closed',
        value: issues?.filter((i) => i.status === 'closed').length || 0,
        color: 'hsl(var(--muted))',
      },
    ];
    setIssueStats(issuesByStatus);

    // Fetch computer usage
    const { data: computers } = await supabase.from('computers').select('status');
    const { data: sessions } = await supabase
      .from('session_logs')
      .select('duration_minutes')
      .not('duration_minutes', 'is', null);

    const avgDuration =
      sessions && sessions.length > 0
        ? Math.round(
            sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) / sessions.length
          )
        : 0;

    const usageStats = [
      {
        status: 'Available',
        count: computers?.filter((c) => c.status === 'available').length || 0,
      },
      { status: 'In Use', count: computers?.filter((c) => c.status === 'in_use').length || 0 },
      {
        status: 'Maintenance',
        count: computers?.filter((c) => c.status === 'maintenance').length || 0,
      },
      { status: 'Retired', count: computers?.filter((c) => c.status === 'retired').length || 0 },
    ];
    setComputerUsage(usageStats);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Booking Trends (This Month)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bookingTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                }}
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Issue Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={issueStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {issueStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Computer Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={computerUsage}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
