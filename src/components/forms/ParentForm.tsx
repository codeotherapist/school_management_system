"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { createParent, updateParent } from "@/lib/actions";
import { z } from "zod";

// ---------- ZOD SCHEMA ----------
export const parentSchema = z.object({
  username: z.string().min(1, "Required"),
  name: z.string().min(1, "Required"),
  surname: z.string().min(1, "Required"),
  email: z.string().email("Invalid Email").optional().nullable(),
  phone: z.string().min(5, "Required"),
  address: z.string().min(1, "Required"),
});

export type ParentSchema = z.infer<typeof parentSchema>;

// ---------- PROPS TYPE ----------
type ParentFormProps = {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

// -------------------------------------------------

const ParentForm = ({ type, data, setOpen }: ParentFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ParentSchema>({
    resolver: zodResolver(parentSchema),
    defaultValues: {
      username: data?.username || "",
      name: data?.name || "",
      surname: data?.surname || "",
      email: data?.email || "",
      phone: data?.phone || "",
      address: data?.address || "",
    },
  });

  const router = useRouter();

  const onSubmit = handleSubmit(async (formData) => {
    const payload =
      type === "create"
        ? formData
        : { ...formData, id: data?.id };

    const action = type === "create" ? createParent : updateParent;
    const result = await action({ success: false, error: false }, payload);

    if (result.success) {
      toast(`Parent has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    } else {
      toast.error("Something went wrong!");
    }
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new Parent" : "Update Parent"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Username"
          name="username"
          register={register}
          error={errors.username}
          defaultValue={data?.username}
        />

        <InputField
          label="Email"
          name="email"
          register={register}
          error={errors.email}
          defaultValue={data?.email}
        />
      </div>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="First Name"
          name="name"
          register={register}
          defaultValue={data?.name}
          error={errors.name}
        />

        <InputField
          label="Last Name"
          name="surname"
          register={register}
          defaultValue={data?.surname}
          error={errors.surname}
        />

        <InputField
          label="Phone"
          name="phone"
          register={register}
          defaultValue={data?.phone}
          error={errors.phone}
        />

        <InputField
          label="Address"
          name="address"
          register={register}
          defaultValue={data?.address}
          error={errors.address}
        />
      </div>

      {data && (
        <InputField
          label="Id"
          name="id"
          register={register}
          defaultValue={data?.id}
          hidden
        />
      )}

      <button type="submit" className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ParentForm;
