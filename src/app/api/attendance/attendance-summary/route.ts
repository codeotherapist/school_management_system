import { NextResponse } from "next/server";
import {
  summarizeAttendanceByDay,
  summarizeAttendanceByWeek,
} from "@/lib/attendanceSummary";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateISO = searchParams.get("date");
  const mode = searchParams.get("mode") === "daily" ? "daily" : "weekly";

  if (!dateISO) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }

  const data =
    mode === "daily"
      ? await summarizeAttendanceByDay(dateISO)
      : await summarizeAttendanceByWeek(dateISO);

  return NextResponse.json(data);
}
