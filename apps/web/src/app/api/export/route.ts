import { NextResponse } from "next/server";

import {
  exportVerificationsAsCsv,
  exportVerificationsAsJson,
} from "@/lib/verification-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  if (format === "csv") {
    const csv = await exportVerificationsAsCsv();

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="viva-export.csv"',
      },
    });
  }

  return NextResponse.json(await exportVerificationsAsJson(), {
    headers: {
      "Content-Disposition": 'attachment; filename="viva-export.json"',
    },
  });
}
