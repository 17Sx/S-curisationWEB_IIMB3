import { NextRequest, NextResponse } from "next/server";

interface RequestLog {
  timestamp: string;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX_REQUESTS = 100;
const requestLogs: RequestLog[] = [];
const MAX_LOGS = 1000;

function logRequest(log: RequestLog) {
  requestLogs.push(log);
  if (requestLogs.length > MAX_LOGS) {
    requestLogs.shift();
  }
  console.log(`[${log.timestamp}] ${log.method} ${log.path} - IP: ${log.ip}`);
}

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limitData = rateLimitMap.get(identifier);

  if (!limitData || now > limitData.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (limitData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  limitData.count++;
  return true;
}

function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

setInterval(cleanupRateLimitMap, RATE_LIMIT_WINDOW);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  if (pathname.startsWith("/api/")) {
    logRequest({
      timestamp: new Date().toISOString(),
      method,
      path: pathname,
      ip,
      userAgent,
    });
  }

  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/webhooks/")) {
    const rateLimitKey = `ip:${ip}`;
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        {
          error: "Trop de requêtes. Limite de 100 requêtes par minute dépassée",
        },
        { status: 429 }
      );
    }
  }

  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
