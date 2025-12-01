import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ReportsTabProps {
  isAdminOrStaff: boolean;
}

export default function ReportsTab({ isAdminOrStaff }: ReportsTabProps) {
  const [bookingData, setBookingData] = useState<any[]>([]);
  const [issueData, setIssueData] = useState<any[]>([]);
  const [usageData, setUsageData] = useState<any[]>([]);
  const [computerStats, setComputerStats] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    // Fetch booking trends
    const { data: bookings } = await supabase
      .from('bookings')
      .select('created_at, status')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    if (bookings) {
      const grouped = bookings.reduce((acc: any, booking) => {
        const date = new Date(booking.created_at).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { date, count: 0 };
        }
        acc[date].count++;
        return acc;
      }, {});
      setBookingData(Object.values(grouped));
    }

    // Fetch issue distribution
    const { data: issues } = await supabase
      .from('issues')
      .select('status')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    if (issues) {
      const statusCounts = issues.reduce((acc: any, issue) => {
        acc[issue.status] = (acc[issue.status] || 0) + 1;
        return acc;
      }, {});
      const issueChartData = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }));
      setIssueData(issueChartData);
    }

    // Fetch session usage data
    const { data: sessions } = await supabase
      .from('session_logs')
      .select('computer_id, duration_minutes, login_time')
      .gte('login_time', dateRange.start)
      .lte('login_time', dateRange.end);

    if (sessions) {
      const computerUsage = sessions.reduce((acc: any, session) => {
        if (!acc[session.computer_id]) {
          acc[session.computer_id] = { total: 0, count: 0 };
        }
        acc[session.computer_id].total += session.duration_minutes || 0;
        acc[session.computer_id].count++;
        return acc;
      }, {});

      const usageChartData = Object.entries(computerUsage).map(([id, data]: [string, any]) => ({
        computer: `PC-${id.slice(0, 8)}`,
        hours: Math.round(data.total / 60),
        sessions: data.count,
      }));
      setUsageData(usageChartData.slice(0, 10)); // Top 10 computers
    }

    // Fetch computer status stats
    const { data: computers } = await supabase
      .from('computers')
      .select('status');

    if (computers) {
      const statusCounts = computers.reduce((acc: any, computer) => {
        acc[computer.status] = (acc[computer.status] || 0) + 1;
        return acc;
      }, {});
      const computerChartData = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }));
      setComputerStats(computerChartData);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({ title: 'Report exported successfully' });
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Reports & Analytics
        </h2>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Trends Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Booking Trends</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(bookingData, 'booking_trends')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bookingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                name="Bookings"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Issue Status Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Issue Status Distribution</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(issueData, 'issue_status')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={issueData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {issueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Computer Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Computer Status</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(computerStats, 'computer_status')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={computerStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Computer Usage Statistics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top 10 Most Used Computers</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(usageData, 'computer_usage')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="computer" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="hours" fill="hsl(var(--primary))" name="Usage Hours" />
              <Bar dataKey="sessions" fill="hsl(var(--accent))" name="Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
