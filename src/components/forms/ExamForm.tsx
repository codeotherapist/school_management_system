"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import InputField from "../InputField";
import { createExam, updateExam } from "@/lib/actions";
import { Dispatch, SetStateAction, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

type LessonOption = {
  id: number;
  name: string;
  class: { name: string };
  teacher: { name: string; surname: string };
};

interface ExamFormProps {
  type: "create" | "update";
  data?: Partial<{
    id: number;
    title: string;
    startTime: Date;
    endTime: Date;
    lessonId: number;
  }>;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: { lessons: LessonOption[] };
}

// -------------------- Inline Schema --------------------
const examSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }),
  startTime: z.date({ message: "Start time is required!" }),
  endTime: z.date({ message: "End time is required!" }),
  lessonId: z.number({ message: "Lesson is required!" }),
});

type ExamSchema = z.infer<typeof examSchema>;

const ExamForm = ({ type, data, setOpen, relatedData }: ExamFormProps) => {
  const router = useRouter();
  const [state, setState] = useState({ success: false, error: false });

  const lessons = relatedData?.lessons ?? [];

  // -------------------- useForm --------------------
  const { register, handleSubmit, formState: { errors } } = useForm<ExamSchema>({
    resolver: zodResolver(examSchema),
    defaultValues: data
      ? {
          ...data,
          startTime: data.startTime ? new Date(data.startTime) : undefined,
          endTime: data.endTime ? new Date(data.endTime) : undefined,
        }
      : undefined,
  });

  // -------------------- Submit --------------------
  const onSubmit = async (formData: ExamSchema) => {
    if (type === "update" && !formData.id) {
      toast.error("ID is required for update");
      return;
    }

    const result = type === "create"
      ? await createExam(formData)
      : await updateExam(formData as Required<ExamSchema>);

    if (result.success) {
      toast.success(`Exam ${type} successful!`);
      setOpen(false);
      router.refresh();
    } else {
      toast.error("Something went wrong!");
    }
  };

  // -------------------- JSX --------------------
  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new exam" : "Update exam"}
      </h1>

      <div className="flex flex-wrap gap-4">
        <InputField
          label="Title"
          name="title"
          register={register("title")}
          defaultValue={data?.title ?? ""}
          error={errors.title}
        />

        <InputField
          label="Start Time"
          type="datetime-local"
          name="startTime"
          register={register("startTime", { valueAsDate: true })}
          defaultValue={data?.startTime ? new Date(data.startTime).toISOString().slice(0,16) : ""}
          error={errors.startTime}
        />

        <InputField
          label="End Time"
          type="datetime-local"
          name="endTime"
          register={register("endTime", { valueAsDate: true })}
          defaultValue={data?.endTime ? new Date(data.endTime).toISOString().slice(0,16) : ""}
          error={errors.endTime}
        />

        {data?.id && (
          <InputField
            label="ID"
            name="id"
            register={register("id")}
            defaultValue={data.id}
            hidden
          />
        )}

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Lesson</label>
          <select
            {...register("lessonId", { valueAsNumber: true })}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            defaultValue={data?.lessonId ?? lessons[0]?.id}
          >
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.name} — {lesson.class.name} — {lesson.teacher.name}{" "}
                {lesson.teacher.surname}
              </option>
            ))}
          </select>
          {errors.lessonId && (
            <p className="text-xs text-red-400">{errors.lessonId.message}</p>
          )}
        </div>
      </div>

      {state.error && <span className="text-red-500">Something went wrong!</span>}

      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ExamForm;
