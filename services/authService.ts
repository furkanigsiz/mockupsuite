import { supabase } from './supabaseClient';
import { User, Session, AuthError, Provider } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Authentication service for managing user authentication with Supabase
 */
class AuthService {
  /**
   * Sign up a new user with email and password
   */
  async signUp(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Failed to create user account');
    }

    return {
      id: data.user.id,
      email: data.user.email || email,
    };
  }

  /**
   * Sign in an existing user with email and password
   */
  async signIn(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Failed to sign in');
    }

    return {
      id: data.user.id,
      email: data.user.email || email,
    };
  }

  /**
   * Sign in with OAuth provider (Google, GitHub, etc.)
   */
  async signInWithProvider(provider: 'google' | 'github'): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    // Get current user before signing out to clear their cache
    const user = await this.getCurrentUser();
    
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    // Clear cache for the signed out user
    if (user) {
      const { cacheService } = await import('./cacheService');
      cacheService.clearUserCache(user.id);
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Update user password (after reset)
   */
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
    };
  }

  /**
   * Get the current session
   */
  async getSession(): Promise<Session | null> {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    return session;
  }

  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          callback({
            id: session.user.id,
            email: session.user.email || '',
          });
        } else {
          callback(null);
        }
      }
    );

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }
}

// Export singleton instance
export const authService = new AuthService();
