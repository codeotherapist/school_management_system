import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { signLessonQr, LessonQrPayload } from "@/lib/qr";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // still only allow teachers to generate QR
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

  // 🔥 allow ANY lesson (no teacherId condition now)
  const lesson = await prisma.lesson.findFirst({
    where: { id: numericLessonId },
    include: { class: true, subject: true },
  });

  if (!lesson) {
    return NextResponse.json(
      { error: "Lesson not found" },
      { status: 404 }
    );
  }

  const todayStr = date || new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const payload: LessonQrPayload = {
    type: "lesson_attendance",
    lessonId: numericLessonId,
    date: todayStr,
    nonce: uuidv4(),
    exp: Math.floor(Date.now() / 1000) + 60 * 15,
  };

  const qrString = signLessonQr(payload);

  return NextResponse.json({
    qr: qrString,
    metadata: {
      lessonId: lesson.id,
      className: lesson.class.name,
      subjectId: lesson.subjectId,
      date: todayStr,
      exp: payload.exp,
    },
  });
}
