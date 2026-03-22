import { useFormContext } from "react-hook-form";
import { Label } from "~/components/ui/label";

export function SelectForm({
  label,
  name,
  id,
  options = [],
  placeholder = "Selecione...",
  ...props
}: any) {
  const { register } = useFormContext();

  return (
    <div className="grid gap-2">
      {label && <Label htmlFor={id || name}>{label}</Label>}

      <select
        id={id || name}
        {...register(name)}
        {...props}
        className="border rounded-md px-3 py-2 bg-gray-50/50 dark:bg-gray-900/50"
      >
          <option value="">{placeholder}</option>

        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}