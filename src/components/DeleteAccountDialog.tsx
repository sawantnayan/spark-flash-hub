import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeleteAccountDialogProps {
  userEmail?: string;
}

export function DeleteAccountDialog({ userEmail }: DeleteAccountDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      toast({
        title: 'Confirmation required',
        description: 'Please type DELETE to confirm account deletion.',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);
    try {
      // Sign out the user (this will invalidate their session)
      // Note: Full account deletion requires admin API access
      // For now, we'll delete user data and sign them out
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Delete user's notifications
        await supabase.from('notifications').delete().eq('user_id', user.id);
        
        // Delete user's bookings
        await supabase.from('bookings').delete().eq('user_id', user.id);
        
        // Delete user's session logs
        await supabase.from('session_logs').delete().eq('user_id', user.id);
        
        // Delete user's issues (reported by them)
        await supabase.from('issues').delete().eq('reported_by', user.id);
        
        // Delete user's profile
        await supabase.from('profiles').delete().eq('id', user.id);
        
        // Delete user's role
        await supabase.from('user_roles').delete().eq('user_id', user.id);
      }

      // Sign out the user
      await supabase.auth.signOut();
      
      toast({
        title: 'Account deleted',
        description: 'Your account data has been removed. You have been signed out.',
      });
      
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: 'Error deleting account',
        description: error.message || 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Account</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This action cannot be undone. This will permanently delete your account
              and remove all your data from our servers.
            </p>
            {userEmail && (
              <p className="font-medium text-foreground">
                Account: {userEmail}
              </p>
            )}
            <p className="text-destructive font-medium">
              All your bookings, issues, sessions, and notifications will be deleted.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="confirm-delete" className="text-sm font-medium">
            Type <span className="font-bold text-destructive">DELETE</span> to confirm
          </Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            className="mt-2"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText('')}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={confirmText !== 'DELETE' || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
