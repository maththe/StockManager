import { useFormContext } from "react-hook-form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function InputForm({ label, name, id, registerOptions, ...props }: any) {
  const { register } = useFormContext();

  return (
    <div className="grid gap-2">
      {label && <Label htmlFor={id || name}>{label}</Label>}
      <Input
        id={id || name}
        {...register(name, registerOptions)} 
        {...props}
      />
    </div>
  );
}