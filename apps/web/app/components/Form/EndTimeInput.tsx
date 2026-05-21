import { Clock3 } from "lucide-react";
import { type Control, useController } from "react-hook-form";

export function EndTimeInput({ control }: { control: Control<any> }) {
    const { field } = useController({ control, name: 'endTime' });

    return (

        <div className="relative gap-2">
            <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
            <input
                id="endTime"
                type="time"
                className="h-11 w-full rounded-xl border border-input bg-background/80 pl-10 pr-3 text-sm text-foreground shadow-sm outline-none transition hover:border-ring/50 focus:border-ring focus:ring-2 focus:ring-ring/30"
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
            />
        </div>
    );
}