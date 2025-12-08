import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Computer, 
  Calendar, 
  AlertCircle, 
  Users, 
  LogOut,
  Plus,
  Clock,
  Bell,
  Megaphone,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalComputers: 0,
    availableComputers: 0,
    activeBookings: 0,
    pendingIssues: 0,
  });
  const [userRole, setUserRole] = useState<string>('student');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchUserRole();
    }
  }, [user]);

  const fetchUserRole = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user?.id)
      .single();
    
    if (data) {
      setUserRole(data.role);
    }
  };

  const fetchStats = async () => {
    const [computers, bookings, issues] = await Promise.all([
      supabase.from('computers').select('id, status'),
      supabase.from('bookings').select('id, status'),
      supabase.from('issues').select('id, status'),
    ]);

    setStats({
      totalComputers: computers.data?.length || 0,
      availableComputers: computers.data?.filter(c => c.status === 'available').length || 0,
      activeBookings: bookings.data?.filter(b => b.status === 'confirmed').length || 0,
      pendingIssues: issues.data?.filter(i => i.status === 'pending').length || 0,
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

  const isAdminOrStaff = userRole === 'admin' || userRole === 'lab_staff';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80">
              <Computer className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Lab Management</h1>
              <p className="text-sm text-muted-foreground capitalize">{userRole} Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" onClick={handleSignOut} size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Computers
              </CardTitle>
              <Computer className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalComputers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.availableComputers} available
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Bookings
              </CardTitle>
              <Calendar className="w-5 h-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeBookings}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently confirmed</p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Issues
              </CardTitle>
              <AlertCircle className="w-5 h-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pendingIssues}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting resolution</p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Lab Hours
              </CardTitle>
              <Clock className="w-5 h-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8-20</div>
              <p className="text-xs text-muted-foreground mt-1">Operating hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card className="shadow-card">
          <Tabs defaultValue="computers" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-6 lg:grid-cols-10">
                <TabsTrigger value="computers">
                  <Computer className="w-4 h-4 mr-2" />
                  Computers
                </TabsTrigger>
                <TabsTrigger value="bookings">
                  <Calendar className="w-4 h-4 mr-2" />
                  Bookings
                </TabsTrigger>
                <TabsTrigger value="issues">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Issues
                </TabsTrigger>
                <TabsTrigger value="sessions">
                  <Clock className="w-4 h-4 mr-2" />
                  Sessions
                </TabsTrigger>
                <TabsTrigger value="software">
                  <Plus className="w-4 h-4 mr-2" />
                  Software
                </TabsTrigger>
                <TabsTrigger value="users">
                  <Users className="w-4 h-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="notices">
                  <Megaphone className="w-4 h-4 mr-2" />
                  Notices
                </TabsTrigger>
                <TabsTrigger value="reports">
                  <FileText className="w-4 h-4 mr-2" />
                  Reports
                </TabsTrigger>
                <TabsTrigger value="import-export">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Import/Export
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="computers" className="mt-0">
                <ComputersTab isAdminOrStaff={isAdminOrStaff} onUpdate={fetchStats} />
              </TabsContent>
              <TabsContent value="bookings" className="mt-0">
                <BookingsTab userId={user?.id || ''} isAdminOrStaff={isAdminOrStaff} onUpdate={fetchStats} />
              </TabsContent>
              <TabsContent value="issues" className="mt-0">
                <IssuesTab userId={user?.id || ''} isAdminOrStaff={isAdminOrStaff} onUpdate={fetchStats} />
              </TabsContent>
              <TabsContent value="sessions" className="mt-0">
                <SessionsTab userId={user?.id || ''} isAdminOrStaff={isAdminOrStaff} onUpdate={fetchStats} />
              </TabsContent>
              <TabsContent value="software" className="mt-0">
                <SoftwareTab isAdminOrStaff={isAdminOrStaff} onUpdate={fetchStats} />
              </TabsContent>
              <TabsContent value="users" className="mt-0">
                <UsersTab isAdminOrStaff={isAdminOrStaff} />
              </TabsContent>
              <TabsContent value="notifications" className="mt-0">
                <NotificationsTab userId={user?.id || ''} isAdminOrStaff={isAdminOrStaff} />
              </TabsContent>
              <TabsContent value="notices" className="mt-0">
                <LabNoticesTab userId={user?.id || ''} isAdminOrStaff={isAdminOrStaff} />
              </TabsContent>
              <TabsContent value="reports" className="mt-0">
                <ReportsTab isAdminOrStaff={isAdminOrStaff} />
              </TabsContent>
              <TabsContent value="import-export" className="mt-0">
                <ImportExportTab isAdminOrStaff={isAdminOrStaff} userId={user?.id || ''} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}
