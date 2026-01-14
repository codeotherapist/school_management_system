"use client";

import { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { classSchema, ClassSchema } from "@/lib/formValidationSchemas";
import { createClass, updateClass } from "@/lib/actions";
import { toast } from "react-toastify";

type Props = {
  type: "create" | "update";
  data?: Partial<ClassSchema>;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
  relatedData?: {
    teachers?: { id: string; name: string; surname: string }[];
    grades?: { id: number; level: number }[];
  };
};

export default function ClassForm({ type, data, setOpen, onSuccess, relatedData }: Props) {
  const { teachers = [], grades = [] } = relatedData ?? {};

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClassSchema>({
    resolver: zodResolver(classSchema) as any,
    defaultValues: {
      id: data?.id,
      name: data?.name || "",
      capacity: data?.capacity ?? 1,
      gradeId: data?.gradeId ?? 0,
      supervisorId: data?.supervisorId || "",
    },
  });

  useEffect(() => {
    reset({
      id: data?.id,
      name: data?.name || "",
      capacity: data?.capacity ?? 1,
      gradeId: data?.gradeId ?? 0,
      supervisorId: data?.supervisorId || "",
    });
  }, [data, reset]);

  const onSubmit: SubmitHandler<ClassSchema> = async (formData) => {
    try {
      const currentState = { success: false, error: false };
      let result;

      if (type === "create") {
        result = await createClass(currentState, formData);
      } else {
        result = await updateClass(currentState, formData);
      }

      if (result.success) {
        toast.success(`${type === "create" ? "Created" : "Updated"} class successfully!`);
        onSuccess?.();
        setOpen(false);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block font-medium">Class Name</label>
        <input
          id="name"
          type="text"
          {...register("name")}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="capacity" className="block font-medium">Capacity</label>
        <input
          id="capacity"
          type="number"
          min={1}
          {...register("capacity", { valueAsNumber: true })}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
        />
        {errors.capacity && <p className="text-red-500 text-sm">{errors.capacity.message}</p>}
      </div>

      <div>
        <label htmlFor="gradeId" className="block font-medium">Grade</label>
        <select
          id="gradeId"
          {...register("gradeId", { valueAsNumber: true })}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
        >
          <option value={0}>Select grade</option>
          {grades.map((grade) => (
            <option key={grade.id} value={grade.id}>
              {grade.level}
            </option>
          ))}
        </select>
        {errors.gradeId && <p className="text-red-500 text-sm">{errors.gradeId.message}</p>}
      </div>

      <div>
        <label htmlFor="supervisorId" className="block font-medium">Supervisor</label>
        <select
          id="supervisorId"
          {...register("supervisorId")}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
        >
          <option value="">Select supervisor</option>
          {teachers.map((teacher) => (
            <option
              key={teacher.id}
              value={teacher.id}
              selected={data?.supervisorId === teacher.id}
            >
              {teacher.name} {teacher.surname}
            </option>
          ))}
        </select>
        {errors.supervisorId && (
          <p className="text-red-500 text-sm">{errors.supervisorId.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {type === "create" ? "Create Class" : "Update Class"}
      </button>
    </form>
  );
}
