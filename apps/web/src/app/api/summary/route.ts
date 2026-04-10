import { NextResponse } from "next/server";

import { getOperatorSummary } from "@/lib/verification-store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await getOperatorSummary());
}
