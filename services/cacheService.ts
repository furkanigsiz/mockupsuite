import { AuthUser } from './authService';
import { Project, BrandKit, UserSubscription } from '../types';

/**
 * Simple in-memory cache service for frequently accessed data
 */
class CacheService {
  private userProfileCache: Map<string, { data: AuthUser; timestamp: number }> = new Map();
  private projectsCache: Map<string, { data: Project[]; timestamp: number }> = new Map();
  private brandKitCache: Map<string, { data: BrandKit | null; timestamp: number }> = new Map();
  private subscriptionCache: Map<string, { data: UserSubscription | null; timestamp: number }> = new Map();
  private creditBalanceCache: Map<string, { data: number; timestamp: number }> = new Map();
  
  // Cache TTL in milliseconds (5 minutes)
  private readonly CACHE_TTL = 5 * 60 * 1000;

  /**
   * Check if cached data is still valid
   */
  private isValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  /**
   * Cache user profile data
   */
  cacheUserProfile(userId: string, user: AuthUser): void {
    this.userProfileCache.set(userId, {
      data: user,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached user profile
   */
  getUserProfile(userId: string): AuthUser | null {
    const cached = this.userProfileCache.get(userId);
    if (cached && this.isValid(cached.timestamp)) {
      return cached.data;
    }
    // Remove stale cache
    if (cached) {
      this.userProfileCache.delete(userId);
    }
    return null;
  }

  /**
   * Cache projects for a user
   */
  cacheProjects(userId: string, projects: Project[]): void {
    this.projectsCache.set(userId, {
      data: projects,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached projects
   */
  getProjects(userId: string): Project[] | null {
    const cached = this.projectsCache.get(userId);
    if (cached && this.isValid(cached.timestamp)) {
      return cached.data;
    }
    // Remove stale cache
    if (cached) {
      this.projectsCache.delete(userId);
    }
    return null;
  }

  /**
   * Cache brand kit for a user
   */
  cacheBrandKit(userId: string, brandKit: BrandKit | null): void {
    this.brandKitCache.set(userId, {
      data: brandKit,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached brand kit
   */
  getBrandKit(userId: string): BrandKit | null | undefined {
    const cached = this.brandKitCache.get(userId);
    if (cached && this.isValid(cached.timestamp)) {
      return cached.data;
    }
    // Remove stale cache
    if (cached) {
      this.brandKitCache.delete(userId);
    }
    return undefined; // undefined means not in cache, null means no brand kit exists
  }

  /**
   * Invalidate user profile cache
   */
  invalidateUserProfile(userId: string): void {
    this.userProfileCache.delete(userId);
  }

  /**
   * Invalidate projects cache
   */
  invalidateProjects(userId: string): void {
    this.projectsCache.delete(userId);
  }

  /**
   * Invalidate brand kit cache
   */
  invalidateBrandKit(userId: string): void {
    this.brandKitCache.delete(userId);
  }

  /**
   * Cache subscription for a user
   */
  cacheSubscription(userId: string, subscription: UserSubscription | null): void {
    this.subscriptionCache.set(userId, {
      data: subscription,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached subscription
   */
  getSubscription(userId: string): UserSubscription | null | undefined {
    const cached = this.subscriptionCache.get(userId);
    if (cached && this.isValid(cached.timestamp)) {
      return cached.data;
    }
    // Remove stale cache
    if (cached) {
      this.subscriptionCache.delete(userId);
    }
    return undefined; // undefined means not in cache, null means no subscription exists
  }

  /**
   * Invalidate subscription cache
   */
  invalidateSubscription(userId: string): void {
    this.subscriptionCache.delete(userId);
  }

  /**
   * Cache credit balance for a user
   */
  cacheCreditBalance(userId: string, balance: number): void {
    this.creditBalanceCache.set(userId, {
      data: balance,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached credit balance
   */
  getCreditBalance(userId: string): number | undefined {
    const cached = this.creditBalanceCache.get(userId);
    if (cached && this.isValid(cached.timestamp)) {
      return cached.data;
    }
    // Remove stale cache
    if (cached) {
      this.creditBalanceCache.delete(userId);
    }
    return undefined; // undefined means not in cache
  }

  /**
   * Invalidate credit balance cache
   */
  invalidateCredits(userId: string): void {
    this.creditBalanceCache.delete(userId);
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.userProfileCache.clear();
    this.projectsCache.clear();
    this.brandKitCache.clear();
    this.subscriptionCache.clear();
    this.creditBalanceCache.clear();
  }

  /**
   * Clear all caches for a specific user
   */
  clearUserCache(userId: string): void {
    this.invalidateUserProfile(userId);
    this.invalidateProjects(userId);
    this.invalidateBrandKit(userId);
    this.invalidateSubscription(userId);
    this.invalidateCredits(userId);
  }
}

// Export singleton instance
export const cacheService = new CacheService();
