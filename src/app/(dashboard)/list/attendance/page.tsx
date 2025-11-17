import { getStudents, getLessons } from "@/lib/actions";
import AttendanceClient from "@/components/AttendanceClient";
import { auth } from "@clerk/nextjs/server";

export default async function AttendancePage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const students = await getStudents();
  const lessons = await getLessons();

  return (
    <AttendanceClient
      students={students}
      lessons={lessons}
      canEdit={role === "admin" || role === "teacher"}
    />
  );
}
