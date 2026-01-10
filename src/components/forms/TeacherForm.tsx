"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { createTeacher, updateTeacher } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";
import { z } from "zod";

// ---------------- Props -----------------
type TeacherFormProps = {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
};

// ---------------- Inline Zod Schema -----------------
const teacherSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email").optional(),
  password: z.string().min(1, "Password is required").optional(),
  name: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Last name is required"),
  phone: z.string().min(5, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  bloodType: z.string().optional(),
  birthday: z.string().optional(),
  sex: z.enum(["MALE", "FEMALE"], "Sex is required"),
  subjects: z.array(z.string()).optional(),
});

// ---------------- Form Component -----------------
const TeacherForm = ({ type, data, setOpen, relatedData }: TeacherFormProps) => {
  const router = useRouter();
  const [img, setImg] = useState<any>();
  const { subjects: subjectsData = [] } = relatedData ?? {};

  type FormValues = z.infer<typeof teacherSchema>;

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      id: data?.id?.toString(),
      username: data?.username || "",
      email: data?.email || "",
      password: "",
      name: data?.name || "",
      surname: data?.surname || "",
      phone: data?.phone || "",
      address: data?.address || "",
      bloodType: data?.bloodType || "",
      birthday: data?.birthday ? new Date(data.birthday).toISOString().split("T")[0] : "",
      sex: data?.sex || "MALE",
      subjects: data?.subjects?.map((s: number | string) => s.toString()) || [],
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (formData) => {
  const payload = {
    username: formData.username,
    password: formData.password || "", // ensure string
    name: formData.name,
    surname: formData.surname,
    email: formData.email || "",       // ensure string
    address: formData.address,
    bloodType: formData.bloodType || "", // ensure string
    birthday: formData.birthday ? new Date(formData.birthday) : new Date(), // convert to Date
    sex: formData.sex,
    phone: formData.phone || "",       // optional but backend expects string
    subjects: formData.subjects || [], // ensure array
    id: formData.id?.toString(),       // convert id to string if exists
    img: img?.secure_url,
  };

  const action = type === "create" ? createTeacher : updateTeacher;
  const result = await action({ success: false, error: false }, payload);

  if (result.success) {
    toast(`Teacher has been ${type === "create" ? "created" : "updated"}!`);
    setOpen(false);
    router.refresh();
  } else {
    toast.error("Something went wrong!");
  }
};


  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new teacher" : "Update the teacher"}
      </h1>

      {/* AUTH INFO */}
      <span className="text-xs text-gray-400 font-medium">Authentication Information</span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField label="Username" name="username" register={register} defaultValue={data?.username} error={errors.username} />
        <InputField label="Email" name="email" type="email" register={register} defaultValue={data?.email} error={errors.email} />
        <InputField label="Password" name="password" type="password" register={register} defaultValue="" error={errors.password} />
      </div>

      {/* PERSONAL INFO */}
      <span className="text-xs text-gray-400 font-medium">Personal Information</span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField label="First Name" name="name" register={register} defaultValue={data?.name} error={errors.name} />
        <InputField label="Last Name" name="surname" register={register} defaultValue={data?.surname} error={errors.surname} />
        <InputField label="Phone" name="phone" register={register} defaultValue={data?.phone} error={errors.phone} />
        <InputField label="Address" name="address" register={register} defaultValue={data?.address} error={errors.address} />
        <InputField label="Blood Type" name="bloodType" register={register} defaultValue={data?.bloodType} error={errors.bloodType} />
        <InputField label="Birthday" name="birthday" register={register} type="date" defaultValue={data?.birthday ? new Date(data.birthday).toISOString().split("T")[0] : ""} error={errors.birthday} />
        {data && <InputField label="Id" name="id" register={register} defaultValue={data?.id} hidden />}
        
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Sex</label>
          <select {...register("sex")} defaultValue={data?.sex || "MALE"} className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full">
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {errors.sex && <p className="text-xs text-red-400">{errors.sex.message}</p>}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Subjects</label>
          <select {...register("subjects")} multiple className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" defaultValue={data?.subjects?.map((s: number | string) => s.toString()) || []}>
            {subjectsData.map((subject: { id: number; name: string }) => (
              <option key={subject.id} value={subject.id.toString()}>{subject.name}</option>
            ))}
          </select>
          {errors.subjects && <p className="text-xs text-red-400">{errors.subjects.message}</p>}
        </div>

        <CldUploadWidget uploadPreset="SchoolSync" onSuccess={(result, { widget }) => { setImg(result.info); widget.close(); }}>
          {({ open }) => (
            <div className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer" onClick={() => open()}>
              <Image src="/upload.png" alt="" width={28} height={28} />
              <span>Upload a photo</span>
            </div>
          )}
        </CldUploadWidget>
      </div>

      <button type="submit" className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default TeacherForm;
