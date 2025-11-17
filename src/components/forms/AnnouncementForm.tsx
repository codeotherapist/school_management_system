"use client";

import { useForm } from "react-hook-form";
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

const AnnouncementForm = ({ type, data, setOpen, relatedData }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementSchema>({
    resolver: zodResolver(announcementSchema),
    defaultValues: data,
  });

  const onSubmit = async (formData: AnnouncementSchema) => {
    const action =
      type === "create" ? createAnnouncement : updateAnnouncement;

    const result = await action(formData);

    if (result.success) {
      toast.success(
        type === "create"
          ? "Announcement has been created "
          : "Announcement has been updated "
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
