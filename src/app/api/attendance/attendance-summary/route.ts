import { NextResponse } from "next/server";
import {
  summarizeAttendanceByDate,
  summarizeAttendanceByWeek,
} from "@/lib/attendance";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateISO = searchParams.get("date");
  const mode = searchParams.get("mode") === "daily" ? "daily" : "weekly";

  if (!dateISO) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }

  const data =
    mode === "daily"
      ? await summarizeAttendanceByDate(dateISO)
      : await summarizeAttendanceByWeek(dateISO);

  return NextResponse.json(data);
}
