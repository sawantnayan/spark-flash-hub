import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Link, AlertCircle, Trash2 } from 'lucide-react';
import { format, isBefore, addDays } from 'date-fns';

interface SoftwareTabProps {
  isAdminOrStaff: boolean;
  onUpdate: () => void;
}

export default function SoftwareTab({ isAdminOrStaff, onUpdate }: SoftwareTabProps) {
  const [software, setSoftware] = useState<any[]>([]);
  const [computers, setComputers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedSoftware, setSelectedSoftware] = useState('');
  const [selectedComputer, setSelectedComputer] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    vendor: '',
    version: '',
    license_key: '',
    license_expiry: '',
    notes: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSoftware();
    fetchComputers();
  }, []);

  const fetchSoftware = async () => {
    const { data, error } = await supabase
      .from('software')
      .select(`
        *,
        computer_software(
          id,
          computers(name, system_id)
        )
      `)
      .order('name');

    if (error) {
      toast({ title: 'Error fetching software', variant: 'destructive' });
    } else {
      setSoftware(data || []);
    }
  };

  const fetchComputers = async () => {
    const { data } = await supabase
      .from('computers')
      .select('id, name, system_id')
      .order('name');
    setComputers(data || []);
  };

  const handleAddSoftware = async () => {
    if (!formData.name) {
      toast({ title: 'Software name is required', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('software').insert(formData);

    if (error) {
      toast({ title: 'Error adding software', variant: 'destructive' });
    } else {
      toast({ title: 'Software added successfully' });
      setOpen(false);
      setFormData({
        name: '',
        vendor: '',
        version: '',
        license_key: '',
        license_expiry: '',
        notes: '',
      });
      fetchSoftware();
      onUpdate();
    }
  };

  const handleAssignSoftware = async () => {
    if (!selectedSoftware || !selectedComputer) {
      toast({ title: 'Please select software and computer', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('computer_software').insert({
      software_id: selectedSoftware,
      computer_id: selectedComputer,
    });

    if (error) {
      toast({ title: 'Error assigning software', variant: 'destructive' });
    } else {
      toast({ title: 'Software assigned successfully' });
      setAssignOpen(false);
      setSelectedSoftware('');
      setSelectedComputer('');
      fetchSoftware();
    }
  };

  const handleDeleteSoftware = async (softwareId: string) => {
    // First delete computer_software relationships
    await supabase.from('computer_software').delete().eq('software_id', softwareId);
    
    const { error } = await supabase.from('software').delete().eq('id', softwareId);
    if (error) {
      toast({ title: 'Error deleting software', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Software deleted successfully' });
      fetchSoftware();
      onUpdate();
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const soon = addDays(new Date(), 30);
    return isBefore(expiry, soon);
  };

  const isExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    return isBefore(new Date(expiryDate), new Date());
  };

  return (
    <div className="space-y-4">
      {isAdminOrStaff && (
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Software
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Software</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Software Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Microsoft Office"
                  />
                </div>
                <div>
                  <Label>Vendor</Label>
                  <Input
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    placeholder="Microsoft"
                  />
                </div>
                <div>
                  <Label>Version</Label>
                  <Input
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="2021"
                  />
                </div>
                <div>
                  <Label>License Key</Label>
                  <Input
                    value={formData.license_key}
                    onChange={(e) => setFormData({ ...formData, license_key: e.target.value })}
                    placeholder="XXXXX-XXXXX-XXXXX"
                  />
                </div>
                <div>
                  <Label>License Expiry</Label>
                  <Input
                    type="date"
                    value={formData.license_expiry}
                    onChange={(e) =>
                      setFormData({ ...formData, license_expiry: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional information"
                  />
                </div>
                <Button onClick={handleAddSoftware} className="w-full">
                  Add Software
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Link className="w-4 h-4 mr-2" />
                Assign to Computer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Software to Computer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Software</Label>
                  <Select value={selectedSoftware} onValueChange={setSelectedSoftware}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select software" />
                    </SelectTrigger>
                    <SelectContent>
                      {software.map((sw) => (
                        <SelectItem key={sw.id} value={sw.id}>
                          {sw.name} {sw.version && `v${sw.version}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Computer</Label>
                  <Select value={selectedComputer} onValueChange={setSelectedComputer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select computer" />
                    </SelectTrigger>
                    <SelectContent>
                      {computers.map((computer) => (
                        <SelectItem key={computer.id} value={computer.id}>
                          {computer.name} ({computer.system_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAssignSoftware} className="w-full">
                  Assign Software
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Software</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>License Expiry</TableHead>
              <TableHead>Assigned To</TableHead>
              {isAdminOrStaff && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {software.map((sw) => (
              <TableRow key={sw.id}>
                <TableCell className="font-medium">{sw.name}</TableCell>
                <TableCell>{sw.vendor || '-'}</TableCell>
                <TableCell>{sw.version || '-'}</TableCell>
                <TableCell>
                  {sw.license_expiry ? (
                    <div className="flex items-center gap-2">
                      {format(new Date(sw.license_expiry), 'PP')}
                      {isExpired(sw.license_expiry) && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Expired
                        </Badge>
                      )}
                      {!isExpired(sw.license_expiry) &&
                        isExpiringSoon(sw.license_expiry) && (
                          <Badge variant="outline" className="flex items-center gap-1 text-warning">
                            <AlertCircle className="w-3 h-3" />
                            Expiring Soon
                          </Badge>
                        )}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {sw.computer_software?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {sw.computer_software.map((cs: any) => (
                        <Badge key={cs.id} variant="secondary">
                          {cs.computers?.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                {isAdminOrStaff && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSoftware(sw.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
