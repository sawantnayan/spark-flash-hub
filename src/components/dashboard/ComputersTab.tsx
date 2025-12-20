import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Monitor, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Computer {
  id: string;
  system_id: string;
  name: string;
  processor: string | null;
  ram: string | null;
  storage: string | null;
  os_version: string | null;
  status: string;
  location: string | null;
}

export default function ComputersTab({ isAdminOrStaff, onUpdate }: { isAdminOrStaff: boolean; onUpdate: () => void }) {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [open, setOpen] = useState(false);
  const [editingComputer, setEditingComputer] = useState<Computer | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchComputers();
  }, []);

  const fetchComputers = async () => {
    const { data } = await supabase
      .from('computers')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setComputers(data);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const computerData = {
      system_id: formData.get('system_id') as string,
      name: formData.get('name') as string,
      processor: formData.get('processor') as string,
      ram: formData.get('ram') as string,
      storage: formData.get('storage') as string,
      os_version: formData.get('os_version') as string,
      status: formData.get('status') as 'available' | 'in_use' | 'maintenance' | 'retired',
      location: formData.get('location') as string,
    };

    if (editingComputer) {
      const { error } = await supabase
        .from('computers')
        .update(computerData)
        .eq('id', editingComputer.id);
      
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Computer updated successfully' });
        setOpen(false);
        setEditingComputer(null);
        fetchComputers();
        onUpdate();
      }
    } else {
      const { error } = await supabase.from('computers').insert([computerData]);
      
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Computer added successfully' });
        setOpen(false);
        fetchComputers();
        onUpdate();
      }
    }
  };

  const handleDelete = async (computerId: string) => {
    const { error } = await supabase
      .from('computers')
      .delete()
      .eq('id', computerId);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Computer deleted successfully' });
      fetchComputers();
      onUpdate();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-success/10 text-success border-success/20';
      case 'in_use': return 'bg-primary/10 text-primary border-primary/20';
      case 'maintenance': return 'bg-warning/10 text-warning border-warning/20';
      case 'retired': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-4">
      {isAdminOrStaff && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditingComputer(null); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Computer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingComputer ? 'Edit Computer' : 'Add New Computer'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="system_id">System ID *</Label>
                    <Input id="system_id" name="system_id" defaultValue={editingComputer?.system_id} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" name="name" defaultValue={editingComputer?.name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="processor">Processor</Label>
                    <Input id="processor" name="processor" defaultValue={editingComputer?.processor || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ram">RAM</Label>
                    <Input id="ram" name="ram" defaultValue={editingComputer?.ram || ''} placeholder="e.g., 16GB" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storage">Storage</Label>
                    <Input id="storage" name="storage" defaultValue={editingComputer?.storage || ''} placeholder="e.g., 512GB SSD" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="os_version">OS Version</Label>
                    <Input id="os_version" name="os_version" defaultValue={editingComputer?.os_version || ''} placeholder="e.g., Windows 11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select name="status" defaultValue={editingComputer?.status || 'available'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="in_use">In Use</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" defaultValue={editingComputer?.location || ''} placeholder="e.g., Lab A, Row 3" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setOpen(false); setEditingComputer(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingComputer ? 'Update' : 'Add'} Computer
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {computers.map((computer) => (
          <div
            key={computer.id}
            className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Monitor className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{computer.name}</h3>
                  <p className="text-sm text-muted-foreground">{computer.system_id}</p>
                </div>
              </div>
              {isAdminOrStaff && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditingComputer(computer); setOpen(true); }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Computer?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete {computer.name}. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(computer.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
            <div className="space-y-2 text-sm">
              {computer.processor && <p><span className="text-muted-foreground">CPU:</span> {computer.processor}</p>}
              {computer.ram && <p><span className="text-muted-foreground">RAM:</span> {computer.ram}</p>}
              {computer.storage && <p><span className="text-muted-foreground">Storage:</span> {computer.storage}</p>}
              {computer.os_version && <p><span className="text-muted-foreground">OS:</span> {computer.os_version}</p>}
              {computer.location && <p><span className="text-muted-foreground">Location:</span> {computer.location}</p>}
            </div>
            <div className="mt-3">
              <Badge className={getStatusColor(computer.status)} variant="outline">
                {computer.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {computers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Monitor className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>No computers found. {isAdminOrStaff && 'Add one to get started.'}</p>
        </div>
      )}
    </div>
  );
}
