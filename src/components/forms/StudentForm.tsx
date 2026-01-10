"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useState } from "react";
import { createStudent, updateStudent } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";
import { z } from "zod";

// ---------------- Props -----------------
type StudentFormProps = {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    grades?: { id: number; level: number }[];
    classes?: { id: number; name: string; capacity: number; _count: { students: number } }[];
    parents?: { id: string; name: string }[];
  };
};

// ---------------- Form -----------------
const StudentForm = ({ type, data, setOpen, relatedData }: StudentFormProps) => {
  const router = useRouter();
  const [img, setImg] = useState<any>();

  // ---------- Inline Zod Schema ----------
  const schema = z.object({
    id: z.string().optional(),
    username: z.string().min(1, { message: "Username is required!" }),
    email: z.string().email({ message: "Invalid email!" }).optional().nullable(),
    password: z.string().min(0).optional(), // allow empty string
    name: z.string().min(1, { message: "First name is required!" }),
    surname: z.string().min(1, { message: "Last name is required!" }),
    phone: z.string().min(5, { message: "Phone is required!" }),
    address: z.string().min(1, { message: "Address is required!" }),
    bloodType: z.string().optional(),
    birthday: z.string().optional(),
    sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
    parentId: z.string().optional(),
    gradeId: z.string().optional(),
    classId: z.string().optional(),
  });

  type FormValues = z.infer<typeof schema>;

  // ---------- useForm ----------
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: data?.id?.toString() || "",
      username: data?.username || "",
      email: data?.email || "",
      password: "", // always provide a string
      name: data?.name || "",
      surname: data?.surname || "",
      phone: data?.phone || "",
      address: data?.address || "",
      bloodType: data?.bloodType || "",
      birthday: data?.birthday ? new Date(data.birthday).toISOString().split("T")[0] : "",
      sex: data?.sex || "MALE",
      parentId: data?.parentId || "",
      gradeId: data?.gradeId?.toString() || "",
      classId: data?.classId?.toString() || "",
    },
  });

  const grades = relatedData?.grades || [];
  const classes = relatedData?.classes || [];
  const parents = relatedData?.parents || [];

  // ---------- Submit ----------
  const onSubmit: SubmitHandler<FormValues> = async (formData) => {
  const payload = {
    ...formData,
    password: formData.password || "", // always string
    email: formData.email || "",       // ensure string
    birthday: formData.birthday ? new Date(formData.birthday) : new Date(), // convert to Date
    id: formData.id ? formData.id.toString() : undefined, 
    gradeId: formData.gradeId ? Number(formData.gradeId) : 0, // backend expects number
    classId: formData.classId ? Number(formData.classId) : 0, // backend expects number
    bloodType: formData.bloodType || "",   // <-- fix here
      parentId: formData.parentId || "",  
    img: img?.secure_url,
  };

  const action = type === "create" ? createStudent : updateStudent;
  const result = await action({ success: false, error: false }, payload);

  if (result.success) {
    toast(`Student has been ${type === "create" ? "created" : "updated"}!`);
    setOpen(false);
    router.refresh();
  } else {
    toast.error("Something went wrong!");
  }
};

  // ---------- JSX ----------
  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new student" : "Update the student"}
      </h1>

      {/* AUTH INFO */}
      <span className="text-xs text-gray-400 font-medium">Authentication Information</span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField label="Username" name="username" register={register} error={errors.username} />
        <InputField label="Email" name="email" register={register} error={errors.email} />
        <InputField label="Password" name="password" type="password" register={register} error={errors.password} />
      </div>

      {/* PERSONAL INFO */}
      <span className="text-xs text-gray-400 font-medium">Personal Information</span>
      <CldUploadWidget
        uploadPreset="SchoolSync"
        onSuccess={(result, { widget }) => {
          setImg(result.info);
          widget.close();
        }}
      >
        {({ open }) => (
          <div className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer" onClick={() => open()}>
            <Image src="/upload.png" alt="" width={28} height={28} />
            <span>Upload a photo</span>
          </div>
        )}
      </CldUploadWidget>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField label="First Name" name="name" register={register} error={errors.name} />
        <InputField label="Last Name" name="surname" register={register} error={errors.surname} />
        <InputField label="Phone" name="phone" register={register} error={errors.phone} />
        <InputField label="Address" name="address" register={register} error={errors.address} />
        <InputField label="Blood Type" name="bloodType" register={register} error={errors.bloodType} />
        <InputField label="Birthday" name="birthday" type="date" register={register} error={errors.birthday} />

        {/* PARENT SELECT */}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Parent</label>
          <select {...register("parentId")} defaultValue={data?.parentId || ""} className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full">
            <option value="">Select Parent</option>
            {parents.map((p: { id: string; name: string }) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {errors.parentId && <p className="text-xs text-red-400">{errors.parentId.message}</p>}
        </div>

        {/* SEX */}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Sex</label>
          <select {...register("sex")} defaultValue={data?.sex || "MALE"} className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full">
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {errors.sex && <p className="text-xs text-red-400">{errors.sex.message}</p>}
        </div>

        {/* GRADE */}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Grade</label>
          <select {...register("gradeId")} defaultValue={data?.gradeId?.toString() || ""} className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full">
            {grades.map((g: { id: number; level: number }) => <option key={g.id} value={g.id}>{g.level}</option>)}
          </select>
          {errors.gradeId && <p className="text-xs text-red-400">{errors.gradeId.message}</p>}
        </div>

        {/* CLASS */}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Class</label>
          <select {...register("classId")} defaultValue={data?.classId?.toString() || ""} className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full">
            {classes.map((c: { id: number; name: string; capacity: number; _count: { students: number } }) => (
              <option key={c.id} value={c.id}>{c.name} — {c._count.students}/{c.capacity}</option>
            ))}
          </select>
          {errors.classId && <p className="text-xs text-red-400">{errors.classId.message}</p>}
        </div>
      </div>

      {/* ID (edit only) */}
      {data && <InputField label="Id" name="id" register={register} defaultValue={data.id} hidden />}

      <button type="submit" className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default StudentForm;
