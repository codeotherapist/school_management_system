"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { resultSchema, ResultSchema } from "@/lib/formValidationSchemas";
import { createResult, updateResult } from "@/lib/actions";
import { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import InputField from "../InputField";

const ResultForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    exams: { id: number; title: string }[];
    assignments: { id: number; title: string }[];
    students: { id: string; name: string; surname: string }[];
  };
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResultSchema>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      id: data?.id,
      score: data?.score || 0,
      examId: data?.examId,
      assignmentId: data?.assignmentId,
      studentId: data?.studentId,
    },
  });

  const router = useRouter();

  const onSubmit: SubmitHandler<ResultSchema> = async (formData) => {
    const action = type === "create" ? createResult : updateResult;
    const res = await action(formData);

    if (res.success) {
      toast(`Result ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error || "Something went wrong");
    }
  };

  const { exams = [], assignments = [], students = [] } = relatedData || {};

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create Result" : "Update Result"}
      </h1>
<InputField
  label="Score"
  name="score"
  type="number"
  defaultValue={data?.score}
  register={register}
  inputProps={{ min: 0, max: 100 }}
  error={errors.score}
/>


      {/* Exam select */}
      <div>
        <label className="text-xs text-gray-500">Exam</label>
        <select {...register("examId")} defaultValue={data?.examId || ""} className="w-full p-2 ring-1 ring-gray-300 rounded-md">
          <option value="">None</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.title}
            </option>
          ))}
        </select>
      </div>

      {/* Assignment select */}
      <div>
        <label className="text-xs text-gray-500">Assignment</label>
        <select {...register("assignmentId")} defaultValue={data?.assignmentId || ""} className="w-full p-2 ring-1 ring-gray-300 rounded-md">
          <option value="">None</option>
          {assignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      </div>

      {/* Student select */}
      <div>
        <label className="text-xs text-gray-500">Student</label>
        <select {...register("studentId")} defaultValue={data?.studentId || ""} className="w-full p-2 ring-1 ring-gray-300 rounded-md">
          <option value="">Select student</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.surname}
            </option>
          ))}
        </select>
        {errors.studentId && (
          <p className="text-red-400 text-xs">{errors.studentId.message}</p>
        )}
      </div>

      <button className="bg-blue-500 text-white py-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ResultForm;
