// lib/serverWarmup.ts
import api from "./api";

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
    if (this.isWarm && Date.now() - this.lastWarmupTime < fiveMinutes) {
      return Promise.resolve();
    }

    if (this.isWarming) {
      return this.warmupPromise || Promise.resolve();
    }

    this.isWarming = true;

    this.warmupPromise = this.performWarmup();
    await this.warmupPromise;
  }

  private async performWarmup(): Promise<void> {
    try {
      const startTime = Date.now();

      // Add 8-second timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Server warmup timeout after 8s")),
          8000,
        );
      });

      // Use the centralized api client so we don't hard-code hosts here
      const res = await Promise.race([api.get("/health"), timeoutPromise]);
      const duration = Date.now() - startTime;

      this.isWarm = true;
      this.lastWarmupTime = Date.now();

      this.isWarming = false;
    } catch (error: any) {
      this.isWarming = false;
      this.isWarm = false; // Mark as not warm if failed

      // Throw error so login can show appropriate message
      throw new Error(
        "Unable to connect to server. Please check your internet connection and try again.",
      );
    }
  }

  isServerWarm(): boolean {
    // Check if server was warmed up recently (within 5 minutes)
    const fiveMinutes = 5 * 60 * 1000;
    return this.isWarm && Date.now() - this.lastWarmupTime < fiveMinutes;
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
    });
  }
}

export default ServerWarmup.getInstance();
