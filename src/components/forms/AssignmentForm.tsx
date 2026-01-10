"use client";

import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { assignmentSchema } from "@/lib/formValidationSchemas";
import { createAssignment, updateAssignment } from "@/lib/actions";
import { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

// 🔹 helper to format Date into datetime-local input format
const formatDateTimeLocal = (date?: string | Date | unknown) => {
  if (!date) return "";
  const d = new Date(date as string | Date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

type Props = {
  type: "create" | "update";
  data?: z.input<typeof assignmentSchema> & { id?: number };
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: { lessons: { id: number; name: string }[] };
};

export default function AssignmentForm({ type, data, setOpen, relatedData }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof assignmentSchema>>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: data
      ? {
          id: data.id as number | undefined,
          title: data.title,
          startDate: formatDateTimeLocal(data.startDate),
          dueDate: formatDateTimeLocal(data.dueDate),
          lessonId: data.lessonId ?? "",
        }
      : undefined,
  });

  const onSubmit = async (formData: z.input<typeof assignmentSchema>) => {
    try {
      // Coerce types for API
      const payload = {
        ...formData,
        startDate: new Date(formData.startDate as string),
        dueDate: new Date(formData.dueDate as string),
        lessonId: Number(formData.lessonId),
        id: formData.id ? Number(formData.id) : undefined,
      };

      if (type === "create") {
        await createAssignment(payload);
        toast.success("Assignment created successfully!");
      } else {
        if (!payload.id) throw new Error("Assignment ID missing");
        // Pass only one argument, payload includes the id
        await updateAssignment(payload);
        toast.success("Assignment updated successfully!");
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    }
  };

  const lessons = relatedData?.lessons || [];

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 p-4 rounded-xl shadow-md bg-white"
    >
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create Assignment" : "Update Assignment"}
      </h1>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          type="text"
          {...register("title")}
          className="w-full border rounded-md p-2"
        />
        {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-sm font-medium">Start Date</label>
        <input
          type="datetime-local"
          {...register("startDate")}
          className="w-full border rounded-md p-2"
        />
        {errors.startDate && <p className="text-red-500 text-sm">{errors.startDate.message}</p>}
      </div>

      {/* Due Date */}
      <div>
        <label className="block text-sm font-medium">Due Date</label>
        <input
          type="datetime-local"
          {...register("dueDate")}
          className="w-full border rounded-md p-2"
        />
        {errors.dueDate && <p className="text-red-500 text-sm">{errors.dueDate.message}</p>}
      </div>

      {/* Lesson Select */}
      <div>
        <label className="block text-sm font-medium">Lesson</label>
     <select
  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
  {...register("lessonId")}
  defaultValue={data?.lessonId as number | ""} // cast to number or fallback ""
>
  <option value="">Select a lesson</option>
  {lessons.map((lesson) => (
    <option key={lesson.id} value={lesson.id}>
      {lesson.name}
    </option>
  ))}
</select>

        {errors.lessonId && <p className="text-red-500 text-sm">{errors.lessonId.message}</p>}
      </div>

      {/* Hidden ID */}
      {data?.id && <input type="hidden" {...register("id")} value={data.id} />}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
      >
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
}
