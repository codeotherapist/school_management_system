"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import InputField from "../InputField";
import { createSubject, updateSubject } from "@/lib/actions";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { z } from "zod"; // ✅ Correct Zod import

// ---------- Inline Zod Schema ----------
const subjectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  teachers: z.array(z.string()).optional(),
});

type SubjectSchema = z.infer<typeof subjectSchema>;

// ---------------- Props -----------------
type SubjectFormProps = {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
};

// ---------------- Form -----------------
const SubjectForm = ({ type, data, setOpen, relatedData }: SubjectFormProps) => {
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<SubjectSchema>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      id: data?.id,
      name: data?.name || "",
      teachers: data?.teachers || [],
    },
  });

  const { teachers = [] } = relatedData ?? {};

  // ---------- Submit ----------
 // ---------- Submit ----------
const onSubmit: SubmitHandler<SubjectSchema> = async (formData) => {
  const payload = {
    ...formData,
    teachers: formData.teachers || [], // ✅ ensure it's always an array
    id: data?.id ? Number(data.id) : undefined, // optional id
  };

  const action = type === "create" ? createSubject : updateSubject;
  const result = await action({ success: false, error: false }, payload);

  if (result.success) {
    toast(`Subject has been ${type === "create" ? "created" : "updated"}!`);
    setOpen(false);
    router.refresh();
  } else {
    toast.error("Something went wrong!");
  }
};

  useEffect(() => {
    console.log("SubjectForm relatedData:", relatedData);
  }, [relatedData]);

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new subject" : "Update the subject"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Subject name"
          name="name"
          register={register}
          error={errors?.name}
        />
        {data && (
          <InputField
            label="Id"
            name="id"
            register={register}
            defaultValue={data?.id}
            hidden
          />
        )}

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Teachers</label>
          <select
            multiple
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("teachers")}
            defaultValue={data?.teachers || []}
          >
            {teachers.map((teacher: { id: string; name: string; surname: string }) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} {teacher.surname}
              </option>
            ))}
          </select>
          {errors.teachers?.message && (
            <p className="text-xs text-red-400">{errors.teachers.message.toString()}</p>
          )}
        </div>
      </div>

      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default SubjectForm;
