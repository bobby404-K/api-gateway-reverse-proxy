export interface UpstreamService {
  name: string;
  url: string;
  healthy: boolean;
  activeRequests: number;
}

export interface RouteConfig {
  prefix: string;
  targetService: string;
  rateLimitPerSec: number;
}
