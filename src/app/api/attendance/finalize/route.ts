import { NextResponse } from "next/server";


interface FinalizeRequestBody {
  lessonId?: number | string;
}

// POST /api/attendance/finalize
export async function POST(req: Request) {
  try {
  const { auth } = await import("@clerk/nextjs/server");
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (!userId || (role !== "teacher" && role !== "admin")) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: FinalizeRequestBody = await req.json();
    const lessonId = body?.lessonId;

    if (!lessonId) {
      return NextResponse.json(
        { ok: false, error: "lessonId required" },
        { status: 400 }
      );
    }

    const numericLessonId = Number(lessonId);
    if (Number.isNaN(numericLessonId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid lessonId" },
        { status: 400 }
      );
    }

    // ✅ Lazy import (runtime only)
    const { finalizeLessonAttendance } = await import("@/lib/actions");

    await finalizeLessonAttendance(numericLessonId, new Date());

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
