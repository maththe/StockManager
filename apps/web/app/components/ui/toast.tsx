import { useEffect, useState } from 'react';

type ToastVariant = 'success' | 'error';

interface ToastMessage {
  id: number;
  title: string;
  variant: ToastVariant;
}

const TOAST_EVENT = 'app:toast';

const dispatchToast = (title: string, variant: ToastVariant) => {
  window.dispatchEvent(
    new CustomEvent('app:toast', { detail: { title, variant } }),
  );
};

export const showSuccessToast = (title: string) => {
  dispatchToast(title, 'success');
};

export const showErrorToast = (title: string) => {
  dispatchToast(title, 'error');
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<{
        title: string;
        variant: ToastVariant;
      }>;
      const newToast: ToastMessage = {
        id: Date.now() + Math.random(),
        title: customEvent.detail.title,
        variant: customEvent.detail.variant,
      };

      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3000);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg text-sm font-medium text-white animate-in fade-in slide-in-from-bottom-2 ${
            toast.variant === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.title}
        </div>
      ))}
    </div>
  );
}
