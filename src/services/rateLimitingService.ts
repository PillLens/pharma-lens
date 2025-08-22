import { supabase } from '@/integrations/supabase/client';

export interface RateLimitConfig {
  endpoint: string;
  limit: number;
  windowMinutes: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  isBlocked: boolean;
}

class RateLimitingService {
  // Default rate limits for different endpoints
  private readonly DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
    'extract-medication': { endpoint: 'extract-medication', limit: 10, windowMinutes: 1 },
    'check-drug-interactions': { endpoint: 'check-drug-interactions', limit: 50, windowMinutes: 1 },
    'submit-feedback': { endpoint: 'submit-feedback', limit: 5, windowMinutes: 5 },
    'image-upload': { endpoint: 'image-upload', limit: 20, windowMinutes: 1 },
    'ocr-processing': { endpoint: 'ocr-processing', limit: 15, windowMinutes: 1 }
  };

  // Check if request is within rate limits
  async checkRateLimit(
    identifier: string, 
    endpoint: string, 
    customConfig?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    try {
      const config = { ...this.DEFAULT_LIMITS[endpoint], ...customConfig };
      if (!config) {
        // No rate limit configured for this endpoint
        return {
          allowed: true,
          remaining: Infinity,
          resetTime: new Date(Date.now() + 60000),
          isBlocked: false
        };
      }

      // Use the database function to check rate limit
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: identifier,
        p_endpoint: endpoint,
        p_limit: config.limit,
        p_window_minutes: config.windowMinutes
      });

      if (error) {
        console.error('Rate limit check failed:', error);
        // Fail open - allow request if rate limit check fails
        return {
          allowed: true,
          remaining: 0,
          resetTime: new Date(Date.now() + config.windowMinutes * 60000),
          isBlocked: false
        };
      }

      const allowed = data as boolean;
      
      if (!allowed) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(Date.now() + config.windowMinutes * 60000),
          isBlocked: true
        };
      }

      return {
        allowed: true,
        remaining: Math.max(0, config.limit - 1),
        resetTime: new Date(Date.now() + config.windowMinutes * 60000),
        isBlocked: false
      };

    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open in case of errors
      return {
        allowed: true,
        remaining: 0,
        resetTime: new Date(Date.now() + 60000),
        isBlocked: false
      };
    }
  }

  // Get rate limit status without incrementing
  async getRateLimitStatus(identifier: string, endpoint: string): Promise<RateLimitResult | null> {
    try {
      const { data, error } = await supabase
        .from('api_rate_limits')
        .select('*')
        .eq('identifier', identifier)
        .eq('endpoint', endpoint)
        .gte('window_end', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      const config = this.DEFAULT_LIMITS[endpoint];
      if (!config) return null;

      return {
        allowed: !data.is_blocked,
        remaining: Math.max(0, config.limit - data.request_count),
        resetTime: new Date(data.window_end),
        isBlocked: data.is_blocked
      };
    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return null;
    }
  }

  // Reset rate limit for identifier (admin function)
  async resetRateLimit(identifier: string, endpoint: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('api_rate_limits')
        .delete()
        .eq('identifier', identifier)
        .eq('endpoint', endpoint);

      return !error;
    } catch (error) {
      console.error('Failed to reset rate limit:', error);
      return false;
    }
  }

  // Get client identifier (IP + User Agent + User ID if available)
  getClientIdentifier(): string {
    const userAgent = navigator.userAgent.slice(0, 100); // Limit length
    const userIdPart = ''; // Will be set by auth context
    return `${userIdPart}:${userAgent}`.slice(0, 255); // Database limit
  }

  // Middleware function for API calls
  async withRateLimit<T>(
    endpoint: string,
    apiCall: () => Promise<T>,
    customConfig?: Partial<RateLimitConfig>
  ): Promise<T> {
    const identifier = this.getClientIdentifier();
    const rateLimitResult = await this.checkRateLimit(identifier, endpoint, customConfig);

    if (!rateLimitResult.allowed) {
      const error = new Error('Rate limit exceeded');
      (error as any).rateLimitInfo = rateLimitResult;
      throw error;
    }

    return await apiCall();
  }

  // Clean up expired rate limit records (should be called periodically)
  async cleanupExpiredRecords(): Promise<void> {
    try {
      await supabase.rpc('cleanup_expired_rate_limits');
    } catch (error) {
      console.error('Failed to cleanup expired rate limits:', error);
    }
  }
}

export const rateLimitingService = new RateLimitingService();

// Setup cleanup interval (runs every 5 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    rateLimitingService.cleanupExpiredRecords();
  }, 5 * 60 * 1000);
}