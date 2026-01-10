"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { createParent, updateParent } from "@/lib/actions";
import { z } from "zod";

// ---------- PROPS TYPE ----------
type ParentFormProps = {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

// ---------- COMPONENT ----------
const ParentForm = ({ type, data, setOpen }: ParentFormProps) => {
  const router = useRouter();

  // ---------- INLINE ZOD SCHEMA ----------
  const schema = z.object({
    username: z.string().min(1, { message: "Username is required!" }),
    name: z.string().min(1, { message: "First name is required!" }),
    surname: z.string().min(1, { message: "Last name is required!" }),
    email: z.string().email({ message: "Invalid email!" }).optional().nullable(),
    phone: z.string().min(5, { message: "Phone is required!" }),
    address: z.string().min(1, { message: "Address is required!" }),
  });

  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: data
      ? {
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email,
          phone: data.phone,
          address: data.address,
        }
      : undefined,
  });

  // ---------- SUBMIT ----------
 const onSubmit = async (formData: FormValues) => {
  if (type === "update") {
    if (!data?.id) {
      toast.error("ID is required for update!");
      return;
    }

    // Convert ID to string to match action's type
    const payload = { ...formData, id: String(data.id) };

    const result = await updateParent({ success: false, error: false }, payload);

    if (result.success) {
      toast("Parent updated successfully!");
      setOpen(false);
      router.refresh();
    } else {
      toast.error("Something went wrong!");
    }
  } else {
    // For create, no ID needed
    const payload = formData;
    const result = await createParent({ success: false, error: false }, payload);

    if (result.success) {
      toast("Parent created successfully!");
      setOpen(false);
      router.refresh();
    } else {
      toast.error("Something went wrong!");
    }
  }
};

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
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

      {type === "update" && data?.id && (
        <InputField
          label="Id"
          name="id"
          register={register}
          defaultValue={data.id}
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
