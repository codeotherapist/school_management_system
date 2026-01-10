"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  announcementSchema,
  AnnouncementSchema,
} from "@/lib/formValidationSchemas";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions";
import { toast } from "react-toastify";

type Props = {
  type: "create" | "update";
  data?: Partial<AnnouncementSchema>;
  setOpen: (open: boolean) => void;
  relatedData?: any;
};

// ✅ Fix: Create a Form type that makes classId optional
type AnnouncementFormType = Omit<AnnouncementSchema, "classId"> & {
  classId?: string | number | null;
};

const AnnouncementForm = ({ type, data, setOpen }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementFormType>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: data?.title || "",
      description: data?.description || "",
      date: data?.date || "",
      classId:
        data?.classId === undefined
          ? undefined
          : typeof data.classId === "number"
          ? data.classId
          : Number(data.classId),
      id: data?.id,
    },
  });

  const onSubmit: SubmitHandler<AnnouncementFormType> = async (formData) => {
    // Normalize classId to number | null before sending
    const payload: AnnouncementSchema = {
      ...formData,
      classId:
        formData.classId === undefined || formData.classId === ""
          ? null
          : Number(formData.classId),
    };

    const action = type === "create" ? createAnnouncement : updateAnnouncement;

    const result = await action(payload);

    if (result.success) {
      toast.success(
        type === "create"
          ? "Announcement has been created!"
          : "Announcement has been updated!"
      );
      setOpen(false);
    } else {
      toast.error(result.error || "Something went wrong");
      console.error(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Title"
        {...register("title")}
        className="border p-2 rounded"
      />
      {errors.title && <p className="text-red-500">{errors.title.message}</p>}

      <textarea
        placeholder="Description"
        {...register("description")}
        className="border p-2 rounded"
      />
      {errors.description && (
        <p className="text-red-500">{errors.description.message}</p>
      )}

      <input
        type="datetime-local"
        {...register("date")}
        className="border p-2 rounded"
      />
      {errors.date && <p className="text-red-500">{errors.date.message}</p>}

      <input
        type="number"
        placeholder="Class ID (optional)"
        {...register("classId")}
        className="border p-2 rounded"
      />

      {errors.classId && <p className="text-red-500">{errors.classId.message}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {type === "create" ? "Create Announcement" : "Update Announcement"}
      </button>
    </form>
  );
};

export default AnnouncementForm;
