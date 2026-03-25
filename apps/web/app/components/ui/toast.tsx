import { useEffect, useState } from "react";

type ToastVariant = "success" | "error";

interface ToastMessage {
  id: number;
  title: string;
  variant: ToastVariant;
}

interface ToastEventDetail {
  title: string;
  variant: ToastVariant;
}

const TOAST_EVENT = "app:toast";

const dispatchToast = (detail: ToastEventDetail) => {
  window.dispatchEvent(new CustomEvent<ToastEventDetail>(TOAST_EVENT, { detail }));
};

export const showSuccessToast = (title: string) => {
  dispatchToast({ title, variant: "success" });
};

export const showErrorToast = (title: string) => {
  dispatchToast({ title, variant: "error" });
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<ToastEventDetail>;
      const newToast: ToastMessage = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: customEvent.detail.title,
        variant: customEvent.detail.variant,
      };

      setToasts((previous) => [...previous, newToast]);

      window.setTimeout(() => {
        setToasts((previous) => previous.filter((toast) => toast.id !== newToast.id));
      }, 4000);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  return (
    <div className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-md border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${
            toast.variant === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
              : "border-red-300 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100"
          }`}
        >
          {toast.title}
        </div>
      ))}
    </div>
  );
}
