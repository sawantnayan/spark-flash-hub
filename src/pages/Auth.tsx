import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Computer, Shield, Users, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeToggle } from '@/components/ThemeToggle';

type RoleType = 'admin' | 'lab_staff' | 'student' | null;

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles(role)
      `)
      .order('full_name');
    setUsers(data || []);
  };

  const usersByRole = {
    admin: users.filter((u) => u.user_roles?.[0]?.role === 'admin'),
    lab_staff: users.filter((u) => u.user_roles?.[0]?.role === 'lab_staff'),
    student: users.filter((u) => u.user_roles?.[0]?.role === 'student'),
  };

  const handleQuickLogin = (userEmail: string) => {
    setSignInEmail(userEmail);
    setSignInPassword('');
    toast({ title: 'Email filled', description: 'Enter password to login' });
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Please check your email to confirm your account.',
      });
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password: signInPassword,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const filteredUsers = selectedRole 
    ? users.filter((u) => u.user_roles?.[0]?.role === selectedRole)
    : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-primary/5 p-4 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl">
        {/* Login Form */}
        <Card className="shadow-card">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80">
              <Computer className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Computer Lab Management</CardTitle>
          <CardDescription>Sign in to manage your lab resources</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-fullname">Full Name</Label>
                  <Input
                    id="signup-fullname"
                    name="fullName"
                    type="text"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          </CardContent>
        </Card>

        {/* Role Selection & User Lists */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Select Your Role</CardTitle>
            <CardDescription>Choose a role to see available users</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Role Selection Buttons */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Button
                variant={selectedRole === 'admin' ? 'default' : 'outline'}
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => setSelectedRole('admin')}
              >
                <Shield className="w-8 h-8" />
                <span className="font-semibold">Admin</span>
                <Badge variant="secondary" className="text-xs">{usersByRole.admin.length}</Badge>
              </Button>
              <Button
                variant={selectedRole === 'lab_staff' ? 'default' : 'outline'}
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => setSelectedRole('lab_staff')}
              >
                <Users className="w-8 h-8" />
                <span className="font-semibold">Staff</span>
                <Badge variant="secondary" className="text-xs">{usersByRole.lab_staff.length}</Badge>
              </Button>
              <Button
                variant={selectedRole === 'student' ? 'default' : 'outline'}
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => setSelectedRole('student')}
              >
                <GraduationCap className="w-8 h-8" />
                <span className="font-semibold">Student</span>
                <Badge variant="secondary" className="text-xs">{usersByRole.student.length}</Badge>
              </Button>
            </div>

            {/* User List for Selected Role */}
            {selectedRole && (
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg mb-3 capitalize flex items-center gap-2">
                    {selectedRole === 'admin' && <Shield className="w-5 h-5 text-primary" />}
                    {selectedRole === 'lab_staff' && <Users className="w-5 h-5 text-accent" />}
                    {selectedRole === 'student' && <GraduationCap className="w-5 h-5 text-success" />}
                    {selectedRole.replace('_', ' ')}s
                  </h3>
                  {filteredUsers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No users found for this role</p>
                  ) : (
                    filteredUsers.map((user) => (
                      <Button
                        key={user.id}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleQuickLogin(user.email)}
                      >
                        <div className="text-left">
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {user.email}
                            {user.student_id && ` • ${user.student_id}`}
                          </div>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}

            {!selectedRole && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Select a role above to view users</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
