import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Computer, Calendar, AlertCircle, LogOut, Clock, Bell, Megaphone, GraduationCap
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/ThemeToggle';
import BookingsTab from '@/components/dashboard/BookingsTab';
import IssuesTab from '@/components/dashboard/IssuesTab';
import SessionsTab from '@/components/dashboard/SessionsTab';
import NotificationsTab from '@/components/dashboard/NotificationsTab';
import LabNoticesTab from '@/components/dashboard/LabNoticesTab';

export default function StudentDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    availableComputers: 0,
    myBookings: 0,
    myIssues: 0,
  });
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('bookings');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
    if (data) setProfile(data);
  };

  const fetchStats = async () => {
    const [computers, bookings, issues] = await Promise.all([
      supabase.from('computers').select('id, status'),
      supabase.from('bookings').select('id, status').eq('user_id', user?.id || ''),
      supabase.from('issues').select('id, status').eq('reported_by', user?.id || ''),
    ]);

    setStats({
      availableComputers: computers.data?.filter(c => c.status === 'available').length || 0,
      myBookings: bookings.data?.filter(b => b.status === 'confirmed' || b.status === 'pending').length || 0,
      myIssues: issues.data?.filter(i => i.status === 'pending' || i.status === 'in_progress').length || 0,
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
            <div className="p-2 rounded-lg bg-gradient-to-br from-success to-success/80">
              <GraduationCap className="w-6 h-6 text-success-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Student Portal</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {profile?.full_name || 'Student'}
                {profile?.student_id && ` (${profile.student_id})`}
              </p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card hover:shadow-lg transition-shadow bg-gradient-to-br from-primary/10 to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available PCs
              </CardTitle>
              <Computer className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.availableComputers}</div>
              <p className="text-xs text-muted-foreground mt-1">Ready to book</p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-lg transition-shadow bg-gradient-to-br from-accent/10 to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                My Bookings
              </CardTitle>
              <Calendar className="w-5 h-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{stats.myBookings}</div>
              <p className="text-xs text-muted-foreground mt-1">Active & pending</p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-lg transition-shadow bg-gradient-to-br from-warning/10 to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                My Issues
              </CardTitle>
              <AlertCircle className="w-5 h-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{stats.myIssues}</div>
              <p className="text-xs text-muted-foreground mt-1">Reported by you</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => setActiveTab('bookings')}
              >
                <Calendar className="w-6 h-6 text-primary" />
                <span>Book a PC</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => setActiveTab('issues')}
              >
                <AlertCircle className="w-6 h-6 text-warning" />
                <span>Report Issue</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => setActiveTab('sessions')}
              >
                <Clock className="w-6 h-6 text-accent" />
                <span>My Sessions</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => setActiveTab('notices')}
              >
                <Megaphone className="w-6 h-6 text-destructive" />
                <span>Lab Notices</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Card className="shadow-card">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="pb-2">
              <TabsList className="flex flex-wrap gap-1 h-auto justify-start">
                <TabsTrigger value="bookings" className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  My Bookings
                </TabsTrigger>
                <TabsTrigger value="issues" className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Report Issues
                </TabsTrigger>
                <TabsTrigger value="sessions" className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  My Sessions
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-1">
                  <Bell className="w-4 h-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="notices" className="flex items-center gap-1">
                  <Megaphone className="w-4 h-4" />
                  Lab Notices
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="bookings" className="mt-0">
                <BookingsTab userId={user?.id || ''} isAdminOrStaff={false} onUpdate={fetchStats} />
              </TabsContent>
              <TabsContent value="issues" className="mt-0">
                <IssuesTab userId={user?.id || ''} isAdminOrStaff={false} onUpdate={fetchStats} />
              </TabsContent>
              <TabsContent value="sessions" className="mt-0">
                <SessionsTab userId={user?.id || ''} isAdminOrStaff={false} onUpdate={fetchStats} />
              </TabsContent>
              <TabsContent value="notifications" className="mt-0">
                <NotificationsTab userId={user?.id || ''} isAdminOrStaff={false} />
              </TabsContent>
              <TabsContent value="notices" className="mt-0">
                <LabNoticesTab userId={user?.id || ''} isAdminOrStaff={false} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}