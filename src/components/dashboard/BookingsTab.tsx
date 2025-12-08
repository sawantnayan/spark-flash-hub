import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  purpose: string | null;
  status: string;
  computer_id: string;
  computers: { name: string; system_id: string };
  profiles: { full_name: string };
}

export default function BookingsTab({ userId, isAdminOrStaff, onUpdate }: { userId: string; isAdminOrStaff: boolean; onUpdate: () => void }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [computers, setComputers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
    fetchComputers();
  }, [userId]);

  const fetchBookings = async () => {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        computers(name, system_id),
        profiles:user_id(full_name)
      `)
      .order('start_time', { ascending: false });
    
    if (!isAdminOrStaff) {
      query = query.eq('user_id', userId);
    }

    const { data } = await query;
    if (data) setBookings(data as any);
  };

  const fetchComputers = async () => {
    const { data } = await supabase
      .from('computers')
      .select('id, name, system_id, status')
      .order('name');
    if (data) setComputers(data);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const bookingData = {
      user_id: userId,
      computer_id: formData.get('computer_id') as string,
      start_time: new Date(formData.get('start_time') as string).toISOString(),
      end_time: new Date(formData.get('end_time') as string).toISOString(),
      purpose: formData.get('purpose') as string,
      status: 'pending' as const,
    };

    const { error } = await supabase.from('bookings').insert([bookingData]);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Booking created successfully' });
      setOpen(false);
      fetchBookings();
      onUpdate();
    }
  };

  const updateBookingStatus = async (bookingId: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Booking ${status}` });
      fetchBookings();
      onUpdate();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-success/10 text-success border-success/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'completed': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Book Computer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Booking</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="computer_id">Select PC (1-30) *</Label>
                <Select name="computer_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a PC" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px] bg-popover">
                    {computers.length === 0 ? (
                      <SelectItem value="none" disabled>No computers available</SelectItem>
                    ) : (
                      computers.map((comp) => (
                        <SelectItem 
                          key={comp.id} 
                          value={comp.id}
                          disabled={comp.status !== 'available'}
                        >
                          {comp.name} - {comp.status === 'available' ? '✓ Available' : `⚠ ${comp.status}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time *</Label>
                <Input id="start_time" name="start_time" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time *</Label>
                <Input id="end_time" name="end_time" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea id="purpose" name="purpose" placeholder="Brief description of your work" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Booking</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">{booking.computers.name}</h3>
                  <Badge className={getStatusColor(booking.status)} variant="outline">
                    {booking.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {format(new Date(booking.start_time), 'PPP p')} - {format(new Date(booking.end_time), 'p')}
                  </p>
                  {booking.purpose && <p>Purpose: {booking.purpose}</p>}
                  {isAdminOrStaff && <p>Booked by: {booking.profiles.full_name}</p>}
                </div>
              </div>
              {isAdminOrStaff && booking.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {bookings.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>No bookings found. Create one to get started.</p>
        </div>
      )}
    </div>
  );
}
