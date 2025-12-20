import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ImportExportTabProps {
  isAdminOrStaff: boolean;
  userId: string;
}

export default function ImportExportTab({ isAdminOrStaff, userId }: ImportExportTabProps) {
  const [importType, setImportType] = useState('computers');
  const [exportType, setExportType] = useState('computers');

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n').map((row) => row.split(','));
        const headers = rows[0].map((h) => h.trim());
        const data = rows.slice(1).filter((row) => row.length > 1);

        const records = data.map((row) => {
          const record: any = {};
          headers.forEach((header, index) => {
            record[header] = row[index]?.trim();
          });
          return record;
        });

        if (importType === 'computers') {
          const { error } = await supabase.from('computers').insert(records);
          if (error) throw error;
        } else if (importType === 'software') {
          const { error } = await supabase.from('software').insert(records);
          if (error) throw error;
        }

        toast({ title: `${importType} imported successfully` });
      } catch (error: any) {
        toast({
          title: 'Import failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleExport = async () => {
    try {
      let data: any[] = [];
      let filename = '';

      switch (exportType) {
        case 'computers':
          const { data: computers } = await supabase.from('computers').select('*');
          data = computers || [];
          filename = 'computers';
          break;
        case 'software':
          const { data: software } = await supabase.from('software').select('*');
          data = software || [];
          filename = 'software';
          break;
        case 'bookings':
          const { data: bookingsRaw } = await supabase
            .from('bookings')
            .select('*, computers(name, system_id)');
          if (bookingsRaw && bookingsRaw.length > 0) {
            const userIds = [...new Set(bookingsRaw.map(b => b.user_id))];
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .in('id', userIds);
            const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
            data = bookingsRaw.map(b => ({
              ...b,
              profiles: profileMap.get(b.user_id) || { full_name: 'Unknown', email: '' }
            }));
          }
          filename = 'bookings';
          break;
        case 'issues':
          const { data: issuesRaw } = await supabase
            .from('issues')
            .select('*, computers(name, system_id)');
          if (issuesRaw && issuesRaw.length > 0) {
            const reporterIds = [...new Set(issuesRaw.map(i => i.reported_by))];
            const { data: issueProfiles } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .in('id', reporterIds);
            const issueProfileMap = new Map(issueProfiles?.map(p => [p.id, p]) || []);
            data = issuesRaw.map(i => ({
              ...i,
              profiles: issueProfileMap.get(i.reported_by) || { full_name: 'Unknown', email: '' }
            }));
          }
          filename = 'issues';
          break;
        case 'sessions':
          const { data: sessionsRaw } = await supabase
            .from('session_logs')
            .select('*, computers(name, system_id)');
          if (sessionsRaw && sessionsRaw.length > 0) {
            const sessionUserIds = [...new Set(sessionsRaw.map(s => s.user_id))];
            const { data: sessionProfiles } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .in('id', sessionUserIds);
            const sessionProfileMap = new Map(sessionProfiles?.map(p => [p.id, p]) || []);
            data = sessionsRaw.map(s => ({
              ...s,
              profiles: sessionProfileMap.get(s.user_id) || { full_name: 'Unknown', email: '' }
            }));
          }
          filename = 'session_logs';
          break;
      }

      if (data.length === 0) {
        toast({ title: 'No data to export', variant: 'destructive' });
        return;
      }

      // Flatten nested objects for CSV export
      const flattenedData = data.map((item) => {
        const flattened: any = {};
        Object.entries(item).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([nestedKey, nestedValue]) => {
              flattened[`${key}_${nestedKey}`] = nestedValue;
            });
          } else {
            flattened[key] = value;
          }
        });
        return flattened;
      });

      const headers = Object.keys(flattenedData[0]).join(',');
      const rows = flattenedData.map((row) =>
        Object.values(row)
          .map((val) => `"${val}"`)
          .join(',')
      );
      const csv = [headers, ...rows].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({ title: 'Data exported successfully' });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const exportAllReports = async () => {
    const types = ['computers', 'software', 'bookings', 'issues', 'sessions'];
    for (const type of types) {
      setExportType(type);
      await new Promise((resolve) => setTimeout(resolve, 500));
      await handleExport();
    }
    toast({ title: 'All reports exported successfully' });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <FileSpreadsheet className="w-6 h-6" />
        Import / Export Data
      </h2>

      {isAdminOrStaff && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Data Type</Label>
              <Select value={importType} onValueChange={setImportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="computers">Computers</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Upload CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                CSV file should have headers matching database columns
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-semibold mb-2">Sample CSV Format for Computers:</p>
              <code className="text-xs">
                name,system_id,processor,ram,storage,os_version,location,status
              </code>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Data Type</Label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="computers">Computers</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="bookings">Bookings</SelectItem>
                <SelectItem value="issues">Issues</SelectItem>
                <SelectItem value="sessions">Session Logs</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExport} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Export Selected
            </Button>
            {isAdminOrStaff && (
              <Button onClick={exportAllReports} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export All Reports
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Exports will be downloaded as CSV files that can be opened in Excel or any
            spreadsheet application
          </p>
        </CardContent>
      </Card>

      {/* Export Templates */}
      <Card>
        <CardHeader>
          <CardTitle>CSV Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p className="font-semibold">Computers Template:</p>
            <code className="text-xs block p-2 bg-muted rounded">
              name,system_id,processor,ram,storage,os_version,location,status
              <br />
              Example: Lab PC 1,SYS001,Intel i5,8GB,256GB,Windows 11,Lab A,available
            </code>
          </div>
          <div className="text-sm space-y-2">
            <p className="font-semibold">Software Template:</p>
            <code className="text-xs block p-2 bg-muted rounded">
              name,vendor,version,license_key,license_expiry,notes
              <br />
              Example: Microsoft Office,Microsoft,2021,XXXXX-XXXXX,2025-12-31,Enterprise
              License
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
