import { UpstreamService, RouteConfig } from './types.js';

export class ApiGateway {
  private services = new Map<string, UpstreamService[]>();
  private routes: RouteConfig[] = [];
  private tokenBuckets = new Map<string, { tokens: number; lastRefill: number }>();

  addService(name: string, url: string): void {
    const list = this.services.get(name) || [];
    list.push({ name, url, healthy: true, activeRequests: 0 });
    this.services.set(name, list);
  }

  addRoute(route: RouteConfig): void {
    this.routes.push(route);
  }

  checkRateLimit(clientId: string, limitPerSec: number): boolean {
    const now = Date.now();
    let bucket = this.tokenBuckets.get(clientId);
    if (!bucket) {
      bucket = { tokens: limitPerSec, lastRefill: now };
      this.tokenBuckets.set(clientId, bucket);
    } else {
      const elapsed = (now - bucket.lastRefill) / 1000;
      bucket.tokens = Math.min(limitPerSec, bucket.tokens + elapsed * limitPerSec);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }
    return false;
  }

  resolveRoute(path: string): { upstreamUrl: string; route: RouteConfig } | null {
    const match = this.routes.find(r => path.startsWith(r.prefix));
    if (!match) return null;

    const list = this.services.get(match.targetService) || [];
    const healthy = list.filter(s => s.healthy);
    if (healthy.length === 0) return null;

    // Pick lowest active requests (Least Connections)
    healthy.sort((a, b) => a.activeRequests - b.activeRequests);
    return { upstreamUrl: healthy[0].url, route: match };
  }
}
