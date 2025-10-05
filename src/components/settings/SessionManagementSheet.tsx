import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Smartphone, Monitor, Tablet, LogOut } from 'lucide-react';
import { sessionManagementService, UserSession } from '@/services/sessionManagementService';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SessionManagementSheetProps {
  open: boolean;
  onClose: () => void;
}

export function SessionManagementSheet({ open, onClose }: SessionManagementSheetProps) {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoutAll, setLogoutAll] = useState(false);
  const [sessionToLogout, setSessionToLogout] = useState<string | null>(null);
  const currentSessionToken = sessionManagementService.getCurrentSessionToken();

  useEffect(() => {
    if (open) {
      loadSessions();
    }
  }, [open]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await sessionManagementService.getUserSessions();
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    try {
      await sessionManagementService.logoutSession(sessionId);
      toast.success('Session terminated');
      loadSessions();
      setSessionToLogout(null);
    } catch (error) {
      console.error('Error logging out session:', error);
      toast.error('Failed to terminate session');
    }
  };

  const handleLogoutAllOthers = async () => {
    try {
      await sessionManagementService.logoutOtherSessions();
      toast.success('All other sessions terminated');
      loadSessions();
      setLogoutAll(false);
    } catch (error) {
      console.error('Error logging out all sessions:', error);
      toast.error('Failed to terminate sessions');
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const isCurrentSession = (session: UserSession) => {
    return session.session_token === currentSessionToken;
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Active Sessions</SheetTitle>
            <SheetDescription>
              Manage devices where you're currently signed in
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No active sessions</p>
            ) : (
              <>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLogoutAll(true)}
                    disabled={sessions.length <= 1}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout All Other Devices
                  </Button>
                </div>

                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-start gap-3 p-4 rounded-lg border bg-card"
                    >
                      <div className="mt-1">
                        {getDeviceIcon(session.device_info?.device)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {session.device_info?.browser || 'Unknown Browser'} on{' '}
                            {session.device_info?.os || 'Unknown OS'}
                          </p>
                          {isCurrentSession(session) && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {session.device_info?.device || 'Unknown Device'}
                        </p>
                        {session.ip_address && (
                          <p className="text-xs text-muted-foreground mt-1">
                            IP: {session.ip_address}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Last active: {format(new Date(session.last_active), 'PPp')}
                        </p>
                      </div>

                      {!isCurrentSession(session) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSessionToLogout(session.id)}
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirm logout single session */}
      <AlertDialog open={!!sessionToLogout} onOpenChange={() => setSessionToLogout(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate Session</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out from this device. You'll need to sign in again to use the app on that device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => sessionToLogout && handleLogoutSession(sessionToLogout)}>
              Terminate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm logout all sessions */}
      <AlertDialog open={logoutAll} onOpenChange={setLogoutAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate All Other Sessions</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out from all devices except this one. You'll need to sign in again on those devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutAllOthers}>
              Terminate All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
