import { NextResponse } from "next/server";
import { signLessonQr } from "@/lib/qr";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (!userId || role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId, date } = await req.json();

    if (!lessonId) {
      return NextResponse.json({ error: "lessonId required" }, { status: 400 });
    }

    const numericLessonId = Number(lessonId);

    const { default: prisma } = await import("@/lib/prisma");

    const lesson = await prisma.lesson.findUnique({
      where: { id: numericLessonId },
      include: { class: true, subject: true },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const todayStr = date
      ? new Date(date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const nowUnix = Math.floor(Date.now() / 1000);

    const payload = {
      type: "lesson_attendance" as const,
      lessonId: numericLessonId,
      date: todayStr,
      exp: nowUnix + 10,
      nonce: crypto.randomUUID(),
    };

    const qrString = signLessonQr(payload);

    return NextResponse.json({
      qr: qrString,
      expiresIn: 10,
      lessonName: lesson.subject?.name ?? "",
      className: lesson.class.name,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

