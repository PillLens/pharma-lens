import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { oneSignalService } from '@/services/oneSignalService';
import { environmentService } from '@/services/environmentService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle OneSignal user registration/cleanup
        if (environmentService.isFeatureEnabled('push-notifications')) {
          setTimeout(() => {
            if (session?.user && oneSignalService.isServiceInitialized()) {
              // Register user with OneSignal after login
              oneSignalService.registerUser(session.user.id).catch(error => {
                console.error('Failed to register user with OneSignal:', error);
              });
            } else if (!session?.user) {
              // Cleanup OneSignal on logout
              oneSignalService.cleanup().catch(error => {
                console.error('Failed to cleanup OneSignal:', error);
              });
            }
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Register existing user with OneSignal if service is ready
      if (session?.user && environmentService.isFeatureEnabled('push-notifications')) {
        setTimeout(() => {
          if (oneSignalService.isServiceInitialized()) {
            oneSignalService.registerUser(session.user.id).catch(error => {
              console.error('Failed to register existing user with OneSignal:', error);
            });
          }
        }, 1000); // Give OneSignal time to initialize
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    // Cleanup OneSignal before signing out
    if (environmentService.isFeatureEnabled('push-notifications')) {
      try {
        await oneSignalService.cleanup();
      } catch (error) {
        console.error('Failed to cleanup OneSignal on logout:', error);
      }
    }
    
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};