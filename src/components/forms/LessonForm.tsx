"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LessonSchema, lessonSchema } from "@/lib/formValidationSchemas";
import { createLesson, updateLesson } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

type Props = {
  type: "create" | "update";
  data?: LessonSchema & { id: number }; // ensure id is available on update
  setOpen: (open: boolean) => void;
  relatedData: {
    subjects: { id: number; name: string }[];
    classes: { id: number; name: string }[];
    teachers: { id: number; name: string; surname: string }[];
  };
};

export default function LessonForm({ type, data, setOpen, relatedData }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LessonSchema>({
    resolver: zodResolver(lessonSchema),
    defaultValues: data || {},
  });

  const onSubmit = async (formData: LessonSchema) => {
    try {
      if (type === "create") {
        await createLesson(formData);
        toast.success("Lesson created successfully!");
      } else {
        if (!data?.id) throw new Error("Lesson ID missing for update");
        await updateLesson(data.id, formData); // ✅ FIXED
        toast.success("Lesson updated successfully!");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 p-4 rounded-xl shadow-md bg-white"
    >
      {/* Lesson Name */}
      <div>
        <label className="block font-medium">Lesson Name</label>
        <input
          type="text"
          {...register("name")}
          className="w-full border rounded-md p-2"
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name.message}</p>
        )}
      </div>

      {/* Day */}
      <div>
        <label className="block font-medium">Day</label>
        <select {...register("day")} className="w-full border rounded-md p-2">
          <option value="">Select a day</option>
          <option value="MONDAY">Monday</option>
          <option value="TUESDAY">Tuesday</option>
          <option value="WEDNESDAY">Wednesday</option>
          <option value="THURSDAY">Thursday</option>
          <option value="FRIDAY">Friday</option>
        </select>
        {errors.day && (
          <p className="text-red-500 text-sm">{errors.day.message}</p>
        )}
      </div>

    {/* Start Time */}
<div>
  <label className="block font-medium">Start Time</label>
  <input
    type="datetime-local"
    {...register("startTime")}
    max="2099-12-31T16:00"   // ✅ BLOCK AFTER 4 PM
    className="w-full border rounded-md p-2"
  />
  {errors.startTime && (
    <p className="text-red-500 text-sm">{errors.startTime.message}</p>
  )}
</div>

{/* End Time */}
<div>
  <label className="block font-medium">End Time</label>
  <input
    type="datetime-local"
    {...register("endTime")}
    max="2099-12-31T16:00"   // ✅ BLOCK AFTER 4 PM
    className="w-full border rounded-md p-2"
  />
  {errors.endTime && (
    <p className="text-red-500 text-sm">{errors.endTime.message}</p>
  )}
</div>


      {/* Subject */}
      <div>
        <label className="block font-medium">Subject</label>
        <select
          {...register("subjectId")}
          className="w-full border rounded-md p-2"
        >
          <option value="">Select subject</option>
          {relatedData.subjects?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.subjectId && (
          <p className="text-red-500 text-sm">{errors.subjectId.message}</p>
        )}
      </div>

      {/* Class */}
      <div>
        <label className="block font-medium">Class</label>
        <select
          {...register("classId")}
          className="w-full border rounded-md p-2"
        >
          <option value="">Select class</option>
          {relatedData.classes?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.classId && (
          <p className="text-red-500 text-sm">{errors.classId.message}</p>
        )}
      </div>

      {/* Teacher */}
      <div>
        <label className="block font-medium">Teacher</label>
        <select
          {...register("teacherId")}
          className="w-full border rounded-md p-2"
        >
          <option value="">Select teacher</option>
          {relatedData.teachers?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} {t.surname}
            </option>
          ))}
        </select>
        {errors.teacherId && (
          <p className="text-red-500 text-sm">{errors.teacherId.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
      >
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
}
