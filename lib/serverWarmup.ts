// lib/serverWarmup.ts
import api from './api';

class ServerWarmup {
  private static instance: ServerWarmup;
  private isWarming = false;
  private isWarm = false;
  private warmupPromise: Promise<void> | null = null;

  static getInstance(): ServerWarmup {
    if (!ServerWarmup.instance) {
      ServerWarmup.instance = new ServerWarmup();
    }
    return ServerWarmup.instance;
  }

  async warmupServer(): Promise<void> {
    if (this.isWarm || this.isWarming) {
      return this.warmupPromise || Promise.resolve();
    }

    this.isWarming = true;
    console.log('🔥 Warming up server...');

    this.warmupPromise = this.performWarmup();
    await this.warmupPromise;
  }

  private async performWarmup(): Promise<void> {
    try {
      // Make a simple health check request to wake up the server
      const startTime = Date.now();
      
      // Try multiple approaches to wake up the server
      const warmupUrls = [
        'https://instantlly-cards-backend.onrender.com/api/health',
        'https://instantlly-cards-backend.onrender.com/api/auth/check-phone',
        'https://instantlly-cards-backend.onrender.com'
      ];
      
      let lastError: any;
      
      for (const url of warmupUrls) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(8000), // 8 second timeout per attempt
          });
          
          const duration = Date.now() - startTime;
          console.log(`✅ Server warmed up via ${url} in ${duration}ms`);
          
          this.isWarm = true;
          this.isWarming = false;
          return; // Success, exit early
          
        } catch (error) {
          lastError = error;
          console.log(`⚠️ Warmup attempt failed for ${url}:`, (error as any)?.message || error);
          continue; // Try next URL
        }
      }
      
      // If we get here, all attempts failed
      throw lastError || new Error('All warmup attempts failed');
      
    } catch (error) {
      console.log('⚠️ Server warmup failed completely, but continuing...', (error as any)?.message || error);
      this.isWarming = false;
      // Don't set isWarm = true since warmup failed
      // Don't throw error - continue with normal flow
    }
  }

  isServerWarm(): boolean {
    return this.isWarm;
  }

  // Pre-warm server when app starts
  async preWarmOnAppStart(): Promise<void> {
    // Don't block app startup, warm in background
    this.warmupServer().catch(() => {
      // Silently handle warmup failures
      console.log('🔄 Background server warmup completed');
    });
  }
}

export default ServerWarmup.getInstance();