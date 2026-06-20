import { NextResponse } from "next/server";
import { getLatestDashboardData, maybeRunDueUpdate, runMarketUpdate } from "@/lib/dashboard-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const force = url.searchParams.get("force") === "1";
    const auto = url.searchParams.get("auto") === "1";
    const updateResult = force
      ? await runMarketUpdate({ force: true, trigger: "manual" })
      : auto
        ? await maybeRunDueUpdate()
        : null;
    const data = updateResult?.data ?? (await getLatestDashboardData());

    return NextResponse.json(
      {
        ...data,
        _meta: {
          updated: Boolean(updateResult?.hasNewSnapshot),
          skipped: Boolean(updateResult?.skipped),
          message: updateResult?.message ?? null,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
