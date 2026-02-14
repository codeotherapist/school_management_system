"use client";
import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

type Lesson = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  class: { name: string };
  subject: { id: number; name: string };
};

type Props = {
  lessons: Lesson[];
};

export default function TeacherLessonQrClient({ lessons }: Props) {
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [qrString, setQrString] = useState<string | null>(null);
  const [info, setInfo] = useState<{
    lessonId: number;
    className: string;
    date: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const hasLessons = lessons && lessons.length > 0;

  async function fetchQr(lessonId: number) {
    const res = await fetch("/api/generate-lesson-qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to generate QR");
      return;
    }

    setQrString(data.qr);
    setInfo(data.metadata);
    setSecondsLeft(10);
  }

  function startAutoRefresh(lessonId: number) {
    // Clear old intervals
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Fetch immediately
    fetchQr(lessonId);

    // Refresh every 10 sec
    intervalRef.current = setInterval(() => {
      fetchQr(lessonId);
    }, 10000);

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 10));
    }, 1000);
  }

  async function handleGenerate() {
    if (!selectedLessonId) return;
    setLoading(true);
    try {
      startAutoRefresh(selectedLessonId);
    } finally {
      setLoading(false);
    }
  }

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
      alert("Error finalizing attendance");
    } finally {
      setFinishing(false);

      // Stop QR refresh
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  return (
    <div className="p-6 flex flex-col gap-4">
      <h1 className="text-xl font-semibold">
        Lesson QR Attendance (Teacher)
      </h1>

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
                  {lesson.name} – {lesson.class.name} ({lesson.subject.name})
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
              {loading ? "Generating..." : "Start QR"}
            </button>

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
          <QRCodeSVG value={qrString} size={256} />
          {info && (
            <p className="text-sm text-gray-600 text-center">
              Lesson ID: {info.lessonId} • Class: {info.className} • Date:{" "}
              {info.date}
              <br />
              QR refreshes in {secondsLeft}s
            </p>
          )}
        </div>
      )}
    </div>
  );
}

