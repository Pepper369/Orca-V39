import { NextResponse } from "next/server";
import { runDailyTask } from "@/lib/dashboard-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const auth = request.headers.get("authorization");
  const alt = request.headers.get("x-cron-secret");
  return auth === `Bearer ${secret}` || alt === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDailyTask();
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Daily task failed:", error);
    return NextResponse.json({ ok: false, error: "Daily task failed" }, { status: 500 });
  }
}
