import { NextRequest, NextResponse } from "next/server";

/**
 * Verify CRON_SECRET from Authorization header.
 * Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` for cron jobs.
 */
export function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

/** Standard 401 response for failed cron auth */
export function cronUnauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
