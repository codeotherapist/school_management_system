"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { markAttendance, getAttendance } from "@/lib/actions";
import { Student, Lesson, Attendance } from "@prisma/client";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Props = {
  students: Student[];
  lessons: Lesson[];
  canEdit: boolean;
};

export default function AttendanceClient({
  students,
  lessons,
  canEdit,
}: Props) {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  // 🔎 Helper: get current lesson + its students (by classId)
  const currentLesson =
    selectedLesson !== null
      ? lessons.find((l) => l.id === selectedLesson) || null
      : null;

  const studentsForLesson: Student[] = currentLesson
    ? students.filter((s) => s.classId === currentLesson.classId)
    : [];

  // ✅ Init attendance state WHEN lesson changes:
  //     - Only students of that lesson's class
  //     - Default = ABSENT
  useEffect(() => {
    if (!currentLesson) {
      setAttendance({});
      return;
    }

    const initial: Record<string, boolean> = {};
    studentsForLesson.forEach((s) => {
      initial[s.id] = false;
    });
    setAttendance(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLesson, students]); // re-init when lesson or students change

  // ✅ Fetch past records when lesson/date changes
  useEffect(() => {
    const fetchRecords = async () => {
      if (!selectedLesson || !currentLesson) return;

      const data = await getAttendance(selectedLesson, new Date(date));
      setRecords(data);

      // ✅ preload attendance only for students in this lesson's class
      const updated: Record<string, boolean> = {};
      studentsForLesson.forEach((s) => {
        const found = data.find((r) => r.studentId === s.id);
        updated[s.id] = found ? found.present : false;
      });
      setAttendance(updated);
    };

    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLesson, date, students]);

  const toggleAttendance = (studentId: string) => {
    if (!canEdit) return;
    setAttendance((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const handleSave = async () => {
    if (!canEdit) return;
    if (!selectedLesson || !currentLesson) {
      toast.error("Please select a lesson ", {
        position: "bottom-right",
        style: { background: "black", color: "white" },
      });
      return;
    }

    // ✅ Only save attendance for students of this lesson's class
    for (const s of studentsForLesson) {
      const present = attendance[s.id] ?? false;
      await markAttendance(s.id, selectedLesson, present, new Date(date));
    }

    toast.success("Attendance saved ", {
      position: "bottom-right",
      style: { background: "black", color: "white" },
    });
  };

  // Filter students of this lesson by search
  const filteredStudents = studentsForLesson.filter((s) =>
    `${s.name} ${s.surname}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8">
      <ToastContainer />

      <h1 className="text-2xl font-bold">Attendance</h1>

      {/* Search bar */}
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 w-1/3"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 w-1/3"
        />
        <select
          value={selectedLesson ?? ""}
          onChange={(e) =>
            setSelectedLesson(
              e.target.value ? Number(e.target.value) : (null as any)
            )
          }
          className="rounded-lg border border-gray-300 px-4 py-2 w-1/3"
        >
          <option value="">Select Lesson</option>
          {lessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>
              {lesson.name}
            </option>
          ))}
        </select>
      </div>

      {/* Mark Attendance Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Attendance Records</h2>
        <div className="grid gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between rounded-xl border p-4 shadow-sm bg-gray-50"
            >
              <span className="font-medium">
                {student.name} {student.surname}
              </span>

              {canEdit ? (
                <Button
                  className={
                    attendance[student.id]
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }
                  onClick={() => toggleAttendance(student.id)}
                >
                  {attendance[student.id] ? "Present" : "Absent"}
                </Button>
              ) : (
                <span
                  className={
                    attendance[student.id]
                      ? "text-green-600 font-medium"
                      : "text-red-600 font-medium"
                  }
                >
                  {attendance[student.id] ? "Present" : "Absent"}
                </span>
              )}
            </div>
          ))}

          {selectedLesson && filteredStudents.length === 0 && (
            <p className="text-sm text-gray-500">
              No students found for this lesson&apos;s class.
            </p>
          )}
        </div>

        {/* Save Button (only Admin/Teacher) */}
        {canEdit && (
          <div className="flex justify-center">
            <Button
              className="px-6 py-2 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100"
              onClick={handleSave}
            >
              Save Attendance
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
