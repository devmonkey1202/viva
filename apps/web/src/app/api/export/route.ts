import { NextResponse } from "next/server";

import {
  exportVerificationsAsCsv,
  exportVerificationsAsJson,
} from "@/lib/verification-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");
  const verificationId = searchParams.get("verificationId") ?? undefined;

  if (format === "csv") {
    const csv = await exportVerificationsAsCsv(verificationId);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": verificationId
          ? `attachment; filename="viva-${verificationId}.csv"`
          : 'attachment; filename="viva-export.csv"',
      },
    });
  }

  return NextResponse.json(await exportVerificationsAsJson(verificationId), {
    headers: {
      "Content-Disposition": verificationId
        ? `attachment; filename="viva-${verificationId}.json"`
        : 'attachment; filename="viva-export.json"',
    },
  });
}
