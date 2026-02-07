import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Shield, Users as UsersIcon, GraduationCap, Save } from 'lucide-react';

interface UsersTabProps {
  isAdminOrStaff: boolean;
}

export default function UsersTab({ isAdminOrStaff }: UsersTabProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch profiles and roles separately to avoid join issues
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        user_roles: roles?.filter(r => r.user_id === profile.id) || []
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({ title: 'Error fetching users', description: error.message, variant: 'destructive' });
    }
  };

  const handleRoleChange = async (userId: string, roleId: string, newRoleValue: string) => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRoleValue as 'admin' | 'lab_staff' | 'student' })
      .eq('id', roleId);

    if (error) {
      toast({ title: 'Error updating role', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Role updated successfully' });
      setEditingRole(null);
      fetchUsers();
    }
  };

  const getRoleBadge = (role: string) => {
    const config = {
      admin: { icon: Shield, variant: 'default' as const, label: 'Admin', color: 'bg-destructive/10 text-destructive border-destructive/20' },
      lab_staff: { icon: UsersIcon, variant: 'secondary' as const, label: 'Lab Staff', color: 'bg-primary/10 text-primary border-primary/20' },
      student: { icon: GraduationCap, variant: 'outline' as const, label: 'Student', color: 'bg-muted text-muted-foreground border-border' },
    };

    const roleConfig = config[role as keyof typeof config] || config.student;
    const Icon = roleConfig.icon;

    return (
      <Badge variant="outline" className={`flex items-center gap-1 w-fit ${roleConfig.color}`}>
        <Icon className="w-3 h-3" />
        {roleConfig.label}
      </Badge>
    );
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.student_id?.toLowerCase().includes(search.toLowerCase())
  );

  const usersByRole = {
    admin: filteredUsers.filter((u) => u.user_roles?.[0]?.role === 'admin'),
    lab_staff: filteredUsers.filter((u) => u.user_roles?.[0]?.role === 'lab_staff'),
    student: filteredUsers.filter((u) => u.user_roles?.[0]?.role === 'student'),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <Input
          placeholder="Search by name, email, or student ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Total: {filteredUsers.length}</span>
          <span>Admins: {usersByRole.admin.length}</span>
          <span>Staff: {usersByRole.lab_staff.length}</span>
          <span>Students: {usersByRole.student.length}</span>
        </div>
      </div>

      <Card className="p-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              {isAdminOrStaff && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.student_id || '-'}</TableCell>
                <TableCell>{user.department || '-'}</TableCell>
                <TableCell>{user.phone || '-'}</TableCell>
                <TableCell>
                  {editingRole === user.id ? (
                    <Select
                      value={newRole}
                      onValueChange={setNewRole}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="lab_staff">Lab Staff</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    getRoleBadge(user.user_roles?.[0]?.role || 'student')
                  )}
                </TableCell>
                {isAdminOrStaff && (
                  <TableCell>
                    {editingRole === user.id ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleRoleChange(user.id, user.user_roles?.[0]?.id, newRole)}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingRole(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingRole(user.id);
                          setNewRole(user.user_roles?.[0]?.role || 'student');
                        }}
                      >
                        Change Role
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No users found matching your search.
        </div>
      )}
    </div>
  );
}