export const dynamic = "force-dynamic"; // 🔹 Force dynamic rendering
import { NextResponse } from "next/server";
import {
  summarizeAttendanceByDate,
  summarizeAttendanceByWeek,
} from "@/lib/attendance";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateISO = searchParams.get("date");
    const mode = searchParams.get("mode") === "daily" ? "daily" : "weekly";

    if (!dateISO) {
      return NextResponse.json({ error: "Missing date" }, { status: 400 });
    }

    // Fetch attendance summary
    const data =
      mode === "daily"
        ? await summarizeAttendanceByDate(dateISO)
        : await summarizeAttendanceByWeek(dateISO);

    return NextResponse.json(data);
  } catch (err) {
    console.error("Attendance summary error:", err);
    return NextResponse.json(
      { error: "Failed to fetch attendance summary" },
      { status: 500 }
    );
  }
}
