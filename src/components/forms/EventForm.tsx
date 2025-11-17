"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { eventSchema, EventSchema } from "@/lib/formValidationSchemas";
import { createEvent, updateEvent } from "@/lib/actions";
import { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import InputField from "../InputField";

const EventForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    classes: { id: number; name: string }[];
  };
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      id: data?.id,
      title: data?.title || "",
      description: data?.description || "",
      startTime: data?.startTime
        ? new Date(data.startTime).toISOString().slice(0, 16)
        : "",
      endTime: data?.endTime
        ? new Date(data.endTime).toISOString().slice(0, 16)
        : "",
      classId: data?.classId,
    },
  });

  const router = useRouter();

  const onSubmit: SubmitHandler<EventSchema> = async (formData) => {
    const action = type === "create" ? createEvent : updateEvent;
    const res = await action(formData);

    if (res.success) {
      toast(`Event ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error || "Something went wrong");
    }
  };

  const { classes = [] } = relatedData || {};

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create Event" : "Update Event"}
      </h1>

      <InputField
        label="Title"
        name="title"
        type="text"
        defaultValue={data?.title}
        register={register}
        error={errors.title}
      />

      <InputField
        label="Description"
        name="description"
        type="text"
        defaultValue={data?.description}
        register={register}
        error={errors.description}
      />

      <div>
        <label className="text-xs text-gray-500">Start Time</label>
        <input
          type="datetime-local"
          {...register("startTime")}
          defaultValue={data?.startTime}
          className="w-full p-2 ring-1 ring-gray-300 rounded-md"
        />
        {errors.startTime && (
          <p className="text-red-400 text-xs">{errors.startTime.message}</p>
        )}
      </div>

      <div>
        <label className="text-xs text-gray-500">End Time</label>
        <input
          type="datetime-local"
          {...register("endTime")}
          defaultValue={data?.endTime}
          className="w-full p-2 ring-1 ring-gray-300 rounded-md"
        />
        {errors.endTime && (
          <p className="text-red-400 text-xs">{errors.endTime.message}</p>
        )}
      </div>

      <div>
        <label className="text-xs text-gray-500">Class</label>
        <select
          {...register("classId")}
          defaultValue={data?.classId || ""}
          className="w-full p-2 ring-1 ring-gray-300 rounded-md"
        >
          <option value="">None</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <button className="bg-blue-500 text-white py-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default EventForm;
