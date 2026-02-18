import { NextRequest, NextResponse } from "next/server";

/**
 * Standardized API error handler wrapper.
 *
 * Usage:
 *   export const GET = withErrorHandler("market-bar", async (req) => {
 *     // ... your logic
 *     return NextResponse.json({ data });
 *   });
 */

type ApiHandler = (
  req: NextRequest,
  ctx?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function withErrorHandler(label: string, handler: ApiHandler): ApiHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        console.warn(`[${label}] ApiError ${err.status}: ${err.message}`);
        return NextResponse.json(
          { error: err.message, code: err.code },
          { status: err.status }
        );
      }

      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`[${label}] Unhandled error:`, message);

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/** Add Cache-Control header to a NextResponse */
export function withCache(
  res: NextResponse,
  maxAge: number,
  staleWhileRevalidate = 60
): NextResponse {
  res.headers.set(
    "Cache-Control",
    `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  );
  return res;
}
