import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Shield, Users as UsersIcon, GraduationCap } from 'lucide-react';

interface UsersTabProps {
  isAdminOrStaff: boolean;
}

export default function UsersTab({ isAdminOrStaff }: UsersTabProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles(role)
      `)
      .order('full_name');

    if (error) {
      toast({ title: 'Error fetching users', variant: 'destructive' });
    } else {
      setUsers(data || []);
    }
  };

  const getRoleBadge = (role: string) => {
    const config = {
      admin: { icon: Shield, variant: 'default' as const, label: 'Admin' },
      lab_staff: { icon: UsersIcon, variant: 'secondary' as const, label: 'Lab Staff' },
      student: { icon: GraduationCap, variant: 'outline' as const, label: 'Student' },
    };

    const roleConfig = config[role as keyof typeof config] || config.student;
    const Icon = roleConfig.icon;

    return (
      <Badge variant={roleConfig.variant} className="flex items-center gap-1 w-fit">
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
      <div className="flex items-center gap-4">
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

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
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
                <TableCell>{getRoleBadge(user.user_roles?.[0]?.role || 'student')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
