// lib/serverWarmup.ts
import api from './api';

class ServerWarmup {
  private static instance: ServerWarmup;
  private isWarming = false;
  private isWarm = false;
  private warmupPromise: Promise<void> | null = null;
  private lastWarmupTime = 0;

  static getInstance(): ServerWarmup {
    if (!ServerWarmup.instance) {
      ServerWarmup.instance = new ServerWarmup();
    }
    return ServerWarmup.instance;
  }

  async warmupServer(): Promise<void> {
    // If server was warmed up in the last 5 minutes, consider it still warm
    const fiveMinutes = 5 * 60 * 1000;
    if (this.isWarm && (Date.now() - this.lastWarmupTime) < fiveMinutes) {
      console.log('✅ Server is already warm (last warmup was recent)');
      return Promise.resolve();
    }

    if (this.isWarming) {
      return this.warmupPromise || Promise.resolve();
    }

    this.isWarming = true;
    console.log('🔥 Warming up Render server (free tier may take 60-90 seconds)...');

    this.warmupPromise = this.performWarmup();
    await this.warmupPromise;
  }

  private async performWarmup(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Render free tier can take 50-90 seconds to wake up
      // Try the health endpoint with a long timeout
      const warmupUrl = 'https://instantlly-cards-backend-6ki0.onrender.com/api/health';
      
      console.log(`🌐 Pinging ${warmupUrl} (timeout: 90 seconds)...`);
      
      // Create AbortController for manual timeout (more compatible than AbortSignal.timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ Warmup timeout after 90 seconds');
        controller.abort();
      }, 90000); // 90 second timeout for Render cold start
      
      try {
        const response = await fetch(warmupUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        
        if (response.ok || response.status < 500) {
          console.log(`✅ Server warmed up successfully in ${duration}ms (${(duration/1000).toFixed(1)}s)`);
          this.isWarm = true;
          this.lastWarmupTime = Date.now();
        } else {
          throw new Error(`Server returned status ${response.status}`);
        }
        
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('Server warmup timed out after 90 seconds. Please try again.');
        }
        throw fetchError;
      }
      
      this.isWarming = false;
      
    } catch (error: any) {
      console.log('⚠️ Server warmup failed:', error?.message || error);
      this.isWarming = false;
      this.isWarm = false; // Mark as not warm if failed
      
      // Throw error so login can show appropriate message
      throw new Error(
        'Server is starting up (Render free tier). This may take 60-90 seconds. ' +
        'Please wait a moment and try again.'
      );
    }
  }

  isServerWarm(): boolean {
    // Check if server was warmed up recently (within 5 minutes)
    const fiveMinutes = 5 * 60 * 1000;
    return this.isWarm && (Date.now() - this.lastWarmupTime) < fiveMinutes;
  }

  // Reset warmup state (useful for testing or manual refresh)
  resetWarmupState(): void {
    this.isWarm = false;
    this.isWarming = false;
    this.lastWarmupTime = 0;
    this.warmupPromise = null;
  }

  // Pre-warm server when app starts
  async preWarmOnAppStart(): Promise<void> {
    // Don't block app startup, warm in background
    this.warmupServer().catch(() => {
      // Silently handle warmup failures
      console.log('🔄 Background server warmup completed (may have failed, will retry on login)');
    });
  }
}

export default ServerWarmup.getInstance();