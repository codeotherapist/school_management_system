// app/api/attendance/summary/route.ts
import { NextResponse } from "next/server";
import { summarizeAttendanceByDate } from "@/lib/attendance";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "Missing ?date=" }, { status: 400 });
  }

  const data = await summarizeAttendanceByDate(date);
  return NextResponse.json(data); // array of { name, present, absent }
}