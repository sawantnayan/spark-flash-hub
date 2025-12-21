import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Computer, Calendar, AlertCircle, Users, LogOut, Clock, Bell, 
  Megaphone, FileText, FileSpreadsheet, Package, Shield
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';
import ComputersTab from '@/components/dashboard/ComputersTab';
import BookingsTab from '@/components/dashboard/BookingsTab';
import IssuesTab from '@/components/dashboard/IssuesTab';
import SessionsTab from '@/components/dashboard/SessionsTab';
import SoftwareTab from '@/components/dashboard/SoftwareTab';
import UsersTab from '@/components/dashboard/UsersTab';
import NotificationsTab from '@/components/dashboard/NotificationsTab';
import LabNoticesTab from '@/components/dashboard/LabNoticesTab';
import ReportsTab from '@/components/dashboard/ReportsTab';
import ImportExportTab from '@/components/dashboard/ImportExportTab';

export default function AdminDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalComputers: 0,
    availableComputers: 0,
    activeBookings: 0,
    pendingIssues: 0,
    totalUsers: 0,
    totalSoftware: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    const [computers, bookings, issues, users, software] = await Promise.all([
      supabase.from('computers').select('id, status'),
      supabase.from('bookings').select('id, status'),
      supabase.from('issues').select('id, status'),
      supabase.from('profiles').select('id'),
      supabase.from('software').select('id'),
    ]);

    setStats({
      totalComputers: computers.data?.length || 0,
      availableComputers: computers.data?.filter(c => c.status === 'available').length || 0,
      activeBookings: bookings.data?.filter(b => b.status === 'confirmed').length || 0,
      pendingIssues: issues.data?.filter(i => i.status === 'pending').length || 0,
      totalUsers: users.data?.length || 0,
      totalSoftware: software.data?.length || 0,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-destructive to-destructive/80">
              <Shield className="w-6 h-6 text-destructive-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Full System Access</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DeleteAccountDialog userEmail={user?.email} />
            <Button variant="outline" onClick={handleSignOut} size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card className="shadow-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Computers</CardTitle>
              <Computer className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalComputers}</div>
              <p className="text-xs text-muted-foreground">{stats.availableComputers} available</p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Bookings</CardTitle>
              <Calendar className="w-5 h-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBookings}</div>
              <p className="text-xs text-muted-foreground">Active now</p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Issues</CardTitle>
              <AlertCircle className="w-5 h-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingIssues}</div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Users</CardTitle>
              <Users className="w-5 h-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered</p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Software</CardTitle>
              <Package className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSoftware}</div>
              <p className="text-xs text-muted-foreground">Licensed</p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lab Hours</CardTitle>
              <Clock className="w-5 h-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8-20</div>
              <p className="text-xs text-muted-foreground">Operating</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card className="shadow-card">
          <Tabs defaultValue="computers" className="w-full">
            <CardHeader className="pb-2">
              <TabsList className="flex flex-wrap gap-1 h-auto justify-start">
                <TabsTrigger value="computers" className="flex items-center gap-1">
                  <Computer className="w-4 h-4" />
                  <span className="hidden sm:inline">Computers</span>
                </TabsTrigger>
                <TabsTrigger value="bookings" className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Bookings</span>
                </TabsTrigger>
                <TabsTrigger value="issues" className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Issues</span>
                </TabsTrigger>
                <TabsTrigger value="sessions" className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">Sessions</span>
                </TabsTrigger>
                <TabsTrigger value="software" className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">Software</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Users</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-1">
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Notifications</span>
                </TabsTrigger>
                <TabsTrigger value="notices" className="flex items-center gap-1">
                  <Megaphone className="w-4 h-4" />
                  <span className="hidden sm:inline">Notices</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Reports</span>
                </TabsTrigger>
                <TabsTrigger value="import-export" className="flex items-center gap-1">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden sm:inline">Import/Export</span>
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="computers" className="mt-0">
                <ComputersTab isAdminOrStaff={true} onUpdate={fetchStats} />
              </TabsContent>
              <TabsContent value="bookings" className="mt-0">
                <BookingsTab userId={user?.id || ''} isAdminOrStaff={true} onUpdate={fetchStats} />
              </TabsContent>
              <TabsContent value="issues" className="mt-0">
                <IssuesTab userId={user?.id || ''} isAdminOrStaff={true} onUpdate={fetchStats} />
              </TabsContent>
              <TabsContent value="sessions" className="mt-0">
                <SessionsTab userId={user?.id || ''} isAdminOrStaff={true} onUpdate={fetchStats} />
              </TabsContent>
              <TabsContent value="software" className="mt-0">
                <SoftwareTab isAdminOrStaff={true} onUpdate={fetchStats} />
              </TabsContent>
              <TabsContent value="users" className="mt-0">
                <UsersTab isAdminOrStaff={true} />
              </TabsContent>
              <TabsContent value="notifications" className="mt-0">
                <NotificationsTab userId={user?.id || ''} isAdminOrStaff={true} />
              </TabsContent>
              <TabsContent value="notices" className="mt-0">
                <LabNoticesTab userId={user?.id || ''} isAdminOrStaff={true} />
              </TabsContent>
              <TabsContent value="reports" className="mt-0">
                <ReportsTab isAdminOrStaff={true} />
              </TabsContent>
              <TabsContent value="import-export" className="mt-0">
                <ImportExportTab isAdminOrStaff={true} userId={user?.id || ''} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}