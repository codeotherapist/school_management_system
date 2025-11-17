"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Lesson = {
  id: number;
  name: string;
};

export default function LessonSelector({ lessons }: { lessons: Lesson[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentLessonId = searchParams.get("lessonId");

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams);
    params.set("lessonId", e.target.value);
    router.push(`?${params.toString()}`);
  };

  return (
    <select
      value={currentLessonId ?? ""}
      onChange={handleChange}
      className="border rounded-md p-2"
    >
      <option value="">Select Lesson</option>
      {lessons.map((lesson) => (
        <option key={lesson.id} value={lesson.id}>
          {lesson.name}
        </option>
      ))}
    </select>
  );
}
