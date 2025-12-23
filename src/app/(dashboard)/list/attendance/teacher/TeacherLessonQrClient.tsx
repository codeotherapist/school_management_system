"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react"; // ✅ named import

type Lesson = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  class: { name: string };
  subject: { id: number; name?: string } | null;
};

type Props = {
  lessons: Lesson[];
};

export default function TeacherLessonQrClient({ lessons }: Props) {
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [qrString, setQrString] = useState<string | null>(null);
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);

  async function handleGenerate() {
    if (!selectedLessonId) return;
    setLoading(true);
    setQrString(null);
    setInfo(null);

    try {
      const res = await fetch("/api/generate-lesson-qr", {
        // or "/api/attendance/generate-lesson-qr" if that's where your route is
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: selectedLessonId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to generate QR");
      } else {
        setQrString(data.qr);
        setInfo(data.metadata);
      }
    } catch (err) {
      console.error(err);
      alert("");
    } finally {
      setLoading(false);
    }
  }

  // 🔥 NEW: Finish QR attendance → marks all non-scanned students as ABSENT
  async function handleFinishAttendance() {
    if (!selectedLessonId) {
      alert("Please select a lesson first.");
      return;
    }

    setFinishing(true);
    try {
      const res = await fetch("/api/attendance/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: selectedLessonId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to finalize attendance");
      } else {
        alert("Attendance finalized — absents recorded.");
      }
    } catch (err) {
      console.error(err);
      alert("");
    } finally {
      setFinishing(false);
    }
  }

  const hasLessons = lessons && lessons.length > 0;

  return (
    <div className="p-6 flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Lesson QR Attendance (Teacher)</h1>

      {!hasLessons && (
        <p className="text-sm text-red-600">
          You don&apos;t have any lessons assigned yet.
        </p>
      )}

      {hasLessons && (
        <>
          <label className="flex flex-col gap-2 max-w-md">
            <span className="text-sm font-medium">Select Lesson</span>
            <select
              className="border rounded px-2 py-1"
              value={selectedLessonId ?? ""}
              onChange={(e) =>
                setSelectedLessonId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
            >
              <option value="">-- choose lesson --</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.name} – {lesson.class.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-3 mt-2">
            <button
              onClick={handleGenerate}
              disabled={!selectedLessonId || loading}
       className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 w-max"

            >
              {loading ? "Generating..." : "Generate QR"}
            </button>

            {/* 🔥 NEW: Finish Attendance button */}
            <button
              onClick={handleFinishAttendance}
              disabled={!selectedLessonId || finishing}
              className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50 w-max"
            >
              {finishing ? "Finalizing..." : "Finish Attendance"}
            </button>
          </div>
        </>
      )}

      {qrString && (
        <div className="mt-4 flex flex-col items-center gap-2">
          {/* ✅ QRCodeSVG instead of QRCode */}
          <QRCodeSVG value={qrString} size={256} />
          {info && (
            <p className="text-sm text-gray-600 text-center">
              Lesson ID: {info.lessonId} • Class: {info.className} • Date:{" "}
              {info.date}
              <br />
              QR expires in ~15 minutes.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
