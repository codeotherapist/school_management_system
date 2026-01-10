import { NextResponse } from "next/server";
import { signLessonQr } from "@/lib/qr";
import type { LessonQrPayload } from "@/lib/qr";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {

  const { auth } = await import("@clerk/nextjs/server");
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // ✅ Only teachers allowed
    if (!userId || role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId, date } = await req.json();

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId is required" },
        { status: 400 }
      );
    }

    const numericLessonId = Number(lessonId);
    if (Number.isNaN(numericLessonId)) {
      return NextResponse.json(
        { error: "Invalid lessonId" },
        { status: 400 }
      );
    }

    // ✅ LAZY Prisma import (CRITICAL for Vercel)
    const { default: prisma } = await import("@/lib/prisma");

    // ✅ Fetch lesson with relations
    const lesson = await prisma.lesson.findUnique({
      where: { id: numericLessonId },
      include: { class: true, subject: true },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    // ✅ Normalize date (YYYY-MM-DD)
    const todayStr = date
      ? new Date(date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    // ✅ Strict literal-safe payload
    const payload: LessonQrPayload = {
      type: "lesson_attendance",
      lessonId: numericLessonId,
      date: todayStr,
      nonce: uuidv4(),
      exp: Math.floor(Date.now() / 1000) + 60 * 15, // 15 min expiry
    };

    const qrString = signLessonQr(payload);

    return NextResponse.json({
      qr: qrString,
      metadata: {
        lessonId: lesson.id,
        className: lesson.class.name,
        subjectId: lesson.subject?.id ?? null,
        date: todayStr,
        exp: payload.exp,
      },
    });
  } catch (err) {
    console.error("[generate-lesson-qr] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
