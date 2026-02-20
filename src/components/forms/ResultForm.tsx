"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import InputField from "../InputField";
import { z } from "zod";

import { createResult, updateResult } from "@/lib/actions";

type ResultFormProps = {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    exams: { id: number; title: string }[];
    assignments: { id: number; title: string }[];
    students: {
      id: string;
      name: string;
      surname: string;
      class: { name: string };
    }[];
  };
};

const ResultForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: ResultFormProps) => {
  const router = useRouter();

  // ✅ ZOD SCHEMA (MATCHES EXAM FORM STYLE)
  const schema = z.object({
    id: z.number().optional(),

    score: z
      .number({ message: "Score is required!" })
      .min(0, { message: "Score must be ≥ 0" })
      .max(100, { message: "Score must be ≤ 100" }),

    examId: z.number().optional(),
    assignmentId: z.number().optional(),

    studentId: z.string().min(1, {
      message: "Student is required!",
    }),
  });

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: data ?? undefined,
  });

  const onSubmit: SubmitHandler<FormValues> = async (formData) => {
    const action = type === "create" ? createResult : updateResult;

    const res = await action(formData);

    if (res.success) {
      toast.success(
        `Result ${type === "create" ? "created" : "updated"} successfully!`
      );
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error || "Something went wrong");
    }
  };

  const { exams = [], assignments = [], students = [] } =
    relatedData || {};

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create Result" : "Update Result"}
      </h1>

      {/* SCORE */}
      <InputField
        label="Score"
        name="score"
        type="number"
        register={register}
        registerOptions={{ valueAsNumber: true }}  
        defaultValue={data?.score ?? ""}
        inputProps={{ min: 0, max: 100 }}
        error={errors.score}
      />

      {/* EXAM */}
      <div>
        <label className="text-xs text-gray-500">Exam</label>
        <select
          {...register("examId", { valueAsNumber: true })}
          defaultValue={data?.examId ?? ""}
          className="w-full p-2 ring-1 ring-gray-300 rounded-md"
        >
          <option value="">None</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.title}
            </option>
          ))}
        </select>
      </div>

      {/* ASSIGNMENT */}
      <div>
        <label className="text-xs text-gray-500">Assignment</label>
        <select
          {...register("assignmentId", { valueAsNumber: true })}
          defaultValue={data?.assignmentId ?? ""}
          className="w-full p-2 ring-1 ring-gray-300 rounded-md"
        >
          <option value="">None</option>
          {assignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      </div>

      {/* STUDENT */}
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
          <p className="text-red-400 text-xs">
            {errors.studentId.message}
          </p>
        )}
      </div>

      <button className="bg-blue-500 text-white py-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ResultForm;