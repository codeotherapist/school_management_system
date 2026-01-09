import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { signLessonQr, LessonQrPayload } from "@/lib/qr";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Only teachers allowed
  if (!userId || role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId, date } = await req.json();

  if (!lessonId) {
    return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
  }

  const numericLessonId = Number(lessonId);
  if (Number.isNaN(numericLessonId)) {
    return NextResponse.json({ error: "Invalid lessonId" }, { status: 400 });
  }

  // Get lesson and include class + subject
  const lesson = await prisma.lesson.findUnique({
    where: { id: numericLessonId },
    include: { class: true, subject: true },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  // Use provided date or today
  const todayStr = date
    ? new Date(date).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const payload: LessonQrPayload = {
    type: "lesson_attendance",
    lessonId: numericLessonId,
    date: todayStr,
    nonce: uuidv4(),
    exp: Math.floor(Date.now() / 1000) + 60 * 15, // 15 minutes expiry
  };

  const qrString = signLessonQr(payload);

  return NextResponse.json({
    qr: qrString,
    metadata: {
      lessonId: lesson.id,
      className: lesson.class.name,
      subjectId: lesson.subject?.id ?? null, // safe fallback
      date: todayStr,
      exp: payload.exp,
    },
  });
}
