import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, Key, Wrench, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, addDays, isBefore, differenceInDays, differenceInHours } from 'date-fns';

interface RemindersTabProps {
  userId: string;
  isAdminOrStaff: boolean;
}

interface BookingReminder {
  id: string;
  computer_name: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: string;
  hoursUntil: number;
}

interface LicenseReminder {
  id: string;
  name: string;
  vendor: string;
  license_expiry: string;
  daysUntil: number;
}

interface MaintenanceReminder {
  id: string;
  computer_name: string;
  computer_id: string;
  last_maintenance: string | null;
  daysSinceLastMaintenance: number | null;
  status: string;
}

export default function RemindersTab({ userId, isAdminOrStaff }: RemindersTabProps) {
  const [bookingReminders, setBookingReminders] = useState<BookingReminder[]>([]);
  const [licenseReminders, setLicenseReminders] = useState<LicenseReminder[]>([]);
  const [maintenanceReminders, setMaintenanceReminders] = useState<MaintenanceReminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, [userId, isAdminOrStaff]);

  const fetchReminders = async () => {
    setLoading(true);
    await Promise.all([
      fetchBookingReminders(),
      fetchLicenseReminders(),
      fetchMaintenanceReminders(),
    ]);
    setLoading(false);
  };

  const fetchBookingReminders = async () => {
    const now = new Date();
    const next24Hours = addDays(now, 1);

    let query = supabase
      .from('bookings')
      .select(`
        id,
        start_time,
        end_time,
        purpose,
        status,
        computers(name)
      `)
      .gte('start_time', now.toISOString())
      .lte('start_time', next24Hours.toISOString())
      .in('status', ['pending', 'confirmed']);

    if (!isAdminOrStaff) {
      query = query.eq('user_id', userId);
    }

    const { data } = await query;

    if (data) {
      const reminders = data.map((booking: any) => ({
        id: booking.id,
        computer_name: booking.computers?.name || 'Unknown',
        start_time: booking.start_time,
        end_time: booking.end_time,
        purpose: booking.purpose,
        status: booking.status,
        hoursUntil: differenceInHours(new Date(booking.start_time), now),
      }));
      setBookingReminders(reminders);
    }
  };

  const fetchLicenseReminders = async () => {
    if (!isAdminOrStaff) {
      setLicenseReminders([]);
      return;
    }

    const now = new Date();
    const next30Days = addDays(now, 30);

    const { data } = await supabase
      .from('software')
      .select('id, name, vendor, license_expiry')
      .not('license_expiry', 'is', null)
      .lte('license_expiry', next30Days.toISOString())
      .order('license_expiry', { ascending: true });

    if (data) {
      const reminders = data.map((sw) => ({
        id: sw.id,
        name: sw.name,
        vendor: sw.vendor || '',
        license_expiry: sw.license_expiry!,
        daysUntil: differenceInDays(new Date(sw.license_expiry!), now),
      }));
      setLicenseReminders(reminders);
    }
  };

  const fetchMaintenanceReminders = async () => {
    if (!isAdminOrStaff) {
      setMaintenanceReminders([]);
      return;
    }

    // Get computers with their last maintenance date
    const { data: computers } = await supabase
      .from('computers')
      .select('id, name, status')
      .order('name');

    if (!computers) return;

    const now = new Date();
    const reminders: MaintenanceReminder[] = [];

    for (const computer of computers) {
      const { data: lastMaintenance } = await supabase
        .from('maintenance_logs')
        .select('completed_at')
        .eq('computer_id', computer.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const daysSince = lastMaintenance?.completed_at
        ? differenceInDays(now, new Date(lastMaintenance.completed_at))
        : null;

      // Show reminder if no maintenance ever or last maintenance was > 30 days ago
      if (!lastMaintenance || (daysSince !== null && daysSince > 30)) {
        reminders.push({
          id: computer.id,
          computer_name: computer.name,
          computer_id: computer.id,
          last_maintenance: lastMaintenance?.completed_at || null,
          daysSinceLastMaintenance: daysSince,
          status: computer.status,
        });
      }
    }

    setMaintenanceReminders(reminders);
  };

  const getPriorityColor = (hours: number) => {
    if (hours <= 1) return 'bg-destructive text-destructive-foreground';
    if (hours <= 6) return 'bg-warning text-warning-foreground';
    return 'bg-primary text-primary-foreground';
  };

  const getLicenseStatusColor = (days: number) => {
    if (days <= 0) return 'bg-destructive text-destructive-foreground';
    if (days <= 7) return 'bg-warning text-warning-foreground';
    return 'bg-accent text-accent-foreground';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading reminders...</div>
      </div>
    );
  }

  const totalReminders = bookingReminders.length + licenseReminders.length + maintenanceReminders.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Reminders
        </h2>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {totalReminders} Active
        </Badge>
      </div>

      {totalReminders === 0 ? (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No reminders at this time</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* Booking Reminders */}
          {bookingReminders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Bookings (Next 24 Hours)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bookingReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{reminder.computer_name}</span>
                        <Badge variant="outline" className="capitalize">
                          {reminder.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(reminder.start_time), 'PPp')} - {format(new Date(reminder.end_time), 'p')}
                      </p>
                      {reminder.purpose && (
                        <p className="text-sm">{reminder.purpose}</p>
                      )}
                    </div>
                    <Badge className={getPriorityColor(reminder.hoursUntil)}>
                      <Clock className="w-3 h-3 mr-1" />
                      {reminder.hoursUntil <= 0 ? 'Now' : `In ${reminder.hoursUntil}h`}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* License Expiry Reminders */}
          {isAdminOrStaff && licenseReminders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-warning" />
                  License Expiry Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {licenseReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{reminder.name}</span>
                        {reminder.vendor && (
                          <span className="text-sm text-muted-foreground">by {reminder.vendor}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Expires: {format(new Date(reminder.license_expiry), 'PPP')}
                      </p>
                    </div>
                    <Badge className={getLicenseStatusColor(reminder.daysUntil)}>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {reminder.daysUntil <= 0 ? 'Expired' : `${reminder.daysUntil} days left`}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Maintenance Reminders */}
          {isAdminOrStaff && maintenanceReminders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-accent" />
                  Maintenance Due
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {maintenanceReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{reminder.computer_name}</span>
                        <Badge variant="outline" className="capitalize">
                          {reminder.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {reminder.last_maintenance
                          ? `Last maintained: ${format(new Date(reminder.last_maintenance), 'PPP')}`
                          : 'No maintenance record found'}
                      </p>
                    </div>
                    <Badge className="bg-accent text-accent-foreground">
                      <Wrench className="w-3 h-3 mr-1" />
                      {reminder.daysSinceLastMaintenance !== null
                        ? `${reminder.daysSinceLastMaintenance} days ago`
                        : 'Never maintained'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Button variant="outline" onClick={fetchReminders} className="w-full">
        Refresh Reminders
      </Button>
    </div>
  );
}
