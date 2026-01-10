import { NextResponse } from "next/server";


// Normalize date to midnight (00:00:00)
function normalizeDate(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get start/end of that calendar day
function dayRange(date: Date) {
  const start = normalizeDate(date);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function POST(req: Request) {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // ✅ Only students can scan QR
    if (!userId || role !== "student") {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { qrString } = await req.json();

    if (!qrString || typeof qrString !== "string") {
      return NextResponse.json(
        { ok: false, error: "qrString is required" },
        { status: 400 }
      );
    }

    // ✅ Lazy imports (runtime only)
    const [{ default: prisma }, { verifyLessonQr }] = await Promise.all([
      import("@/lib/prisma"),
      import("@/lib/qr"),
    ]);

    let payload;
    try {
      payload = verifyLessonQr(qrString);
    } catch (err) {
      console.error("QR verify error:", err);
      return NextResponse.json(
        { ok: false, error: "Invalid or expired QR code" },
        { status: 400 }
      );
    }

    // 🔎 Load lesson + student
    const [lesson, student] = await Promise.all([
      prisma.lesson.findUnique({
        where: { id: payload.lessonId },
        select: { id: true, classId: true },
      }),
      prisma.student.findUnique({
        where: { id: userId },
        select: { id: true, classId: true, isDeleted: true },
      }),
    ]);

    if (!lesson) {
      return NextResponse.json(
        { ok: false, error: "Lesson not found for this QR code" },
        { status: 400 }
      );
    }

    if (!student || student.isDeleted) {
      return NextResponse.json(
        { ok: false, error: "Student not found or inactive" },
        { status: 400 }
      );
    }

    // ❌ Student belongs to a different class
    if (student.classId !== lesson.classId) {
      return NextResponse.json({
        ok: false,
        wrongClass: true,
        message: "You belong to a different class. This QR is not for your class.",
      });
    }

    const today = normalizeDate(new Date());
    const { start, end } = dayRange(today);

    // Check if attendance already exists
    const existing = await prisma.attendance.findFirst({
      where: {
        studentId: userId,
        lessonId: payload.lessonId,
        date: { gte: start, lte: end },
      },
    });

    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadyRecorded: true,
        message: "Attendance already recorded for this lesson and date.",
      });
    }

    // ✅ Create attendance
    const created = await prisma.attendance.create({
      data: {
        studentId: userId,
        lessonId: payload.lessonId,
        date: today,
        present: true,
      },
    });

    return NextResponse.json({
      ok: true,
      alreadyRecorded: false,
      attendanceId: created.id,
    });
  } catch (err) {
    console.error("[/api/attendance/scan] error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
