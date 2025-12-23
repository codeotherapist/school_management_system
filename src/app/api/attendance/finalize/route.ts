import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { finalizeLessonAttendance } from "@/lib/actions";

// POST /api/attendance/finalize
export async function POST(req: Request) {
  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // ✅ Only teacher or admin can finalize attendance
    if (!userId || (role !== "teacher" && role !== "admin")) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const lessonId = body?.lessonId;

    if (!lessonId) {
      return NextResponse.json(
        { ok: false, error: "lessonId required" },
        { status: 400 }
      );
    }

    await finalizeLessonAttendance(Number(lessonId), new Date());

    return NextResponse.json({
      ok: true,
      message: "Attendance finalized — absents recorded.",
    });
  } catch (err) {
    console.error("[/api/attendance/finalize] error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
