export const dynamic = "force-dynamic"; // 🔹 Force dynamic rendering
// app/api/attendance/summary/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Missing ?date=" },
        { status: 400 }
      );
    }

    // ✅ Lazy import (runtime only)
    const { summarizeAttendanceByDate } = await import(
      "@/lib/attendance"
    );

    const data = await summarizeAttendanceByDate(date);

    return NextResponse.json(data); // [{ name, present, absent }]
  } catch (err) {
    console.error("[attendance summary]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
