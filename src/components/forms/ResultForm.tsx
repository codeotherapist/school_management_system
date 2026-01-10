"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import InputField from "../InputField";
import { z } from "zod";

// ✅ Import your actions
import { createResult, updateResult } from "@/lib/actions";

// ----------------- Props -----------------
type ResultFormProps = {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    exams: { id: number; title: string }[];
    assignments: { id: number; title: string }[];
    students: { id: string; name: string; surname: string; class: { name: string } }[];
  };
};

// ----------------- Form -----------------
const ResultForm = ({ type, data, setOpen, relatedData }: ResultFormProps) => {
  const router = useRouter();

  // ---------- Inline Zod Schema ----------
  const schema = z.object({
    id: z.string().optional(),
    score: z.number({ message: "Score is required!" })
      .min(0, { message: "Score must be ≥0" })
      .max(100, { message: "Score must be ≤100" }),
    examId: z.string().optional(),
    assignmentId: z.string().optional(),
    studentId: z.string({ message: "Student is required!" }),
  });

  type FormValues = z.infer<typeof schema>;

  // ---------- useForm ----------
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: data?.id?.toString(),
      score: data?.score ?? 0,
      examId: data?.examId?.toString() ?? "",
      assignmentId: data?.assignmentId?.toString() ?? "",
      studentId: data?.studentId ?? "",
    },
  });

  // ---------- Submit ----------
  const onSubmit: SubmitHandler<FormValues> = async (formData) => {
    // Convert string IDs to numbers for backend
    const payload = {
      ...formData,
      id: formData.id ? Number(formData.id) : undefined,
      examId: formData.examId ? Number(formData.examId) : undefined,
      assignmentId: formData.assignmentId ? Number(formData.assignmentId) : undefined,
    };

    const action = type === "create" ? createResult : updateResult;
    const res = await action(payload);

    if (res.success) {
      toast(`Result ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error || "Something went wrong");
    }
  };

  const { exams = [], assignments = [], students = [] } = relatedData || {};

  // ---------- JSX ----------
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create Result" : "Update Result"}
      </h1>

      {/* Score */}
      <InputField
        label="Score"
        name="score"
        type="number"
        defaultValue={data?.score ?? 0}
        register={register}
        inputProps={{ min: 0, max: 100 }}
        error={errors.score}
      />

      {/* Exam select */}
      <div>
        <label className="text-xs text-gray-500">Exam</label>
        <select
          {...register("examId")}
          defaultValue={data?.examId?.toString() ?? ""}
          className="w-full p-2 ring-1 ring-gray-300 rounded-md"
        >
          <option value="">None</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id.toString()}>
              {exam.title}
            </option>
          ))}
        </select>
      </div>

      {/* Assignment select */}
      <div>
        <label className="text-xs text-gray-500">Assignment</label>
        <select
          {...register("assignmentId")}
          defaultValue={data?.assignmentId?.toString() ?? ""}
          className="w-full p-2 ring-1 ring-gray-300 rounded-md"
        >
          <option value="">None</option>
          {assignments.map((a) => (
            <option key={a.id} value={a.id.toString()}>
              {a.title}
            </option>
          ))}
        </select>
      </div>

      {/* Student select */}
      <div>
        <label className="text-xs text-gray-500">Student</label>
        <select
          {...register("studentId")}
          defaultValue={data?.studentId ?? ""}
          className="w-full p-2 ring-1 ring-gray-300 rounded-md"
        >
          <option value="">Select student</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.surname} — {s.class.name}
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
