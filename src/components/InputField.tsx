import { FieldError, UseFormRegister, RegisterOptions } from "react-hook-form";

type InputFieldProps = {
  label: string;
  type?: string;
  name: string;
  register: UseFormRegister<any>;
  registerOptions?: RegisterOptions; // ✅ allow passing valueAsDate etc
  defaultValue?: string | number;
  error?: FieldError;
  hidden?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

const InputField = ({
  label,
  type = "text",
  name,
  register,
  registerOptions,
  defaultValue,
  error,
  hidden,
  inputProps = {},
}: InputFieldProps) => {
  return (
    <div className={hidden ? "hidden" : "flex flex-col gap-2 w-full md:w-1/4"}>
      <label className="text-xs text-gray-500">{label}</label>

      <input
        type={type}
        defaultValue={defaultValue}
        {...register(name, registerOptions)} // ✅ options applied here
        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
        {...inputProps} // only real input attributes
      />

      {error?.message && (
        <p className="text-xs text-red-400">{error.message.toString()}</p>
      )}
    </div>
  );
};

export default InputField;
