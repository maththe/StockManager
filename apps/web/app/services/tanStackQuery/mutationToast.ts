import { AxiosError } from "axios";
import { showErrorToast, showSuccessToast } from "~/components/ui/toast";

type ApiErrorResponse = {
  message?: string | string[];
};

export const mutationSuccess = (message: string) => {
  showSuccessToast(message);
};

export const mutationError = (fallbackMessage: string, error: unknown) => {
  if (error instanceof AxiosError) {
    const apiMessage = (error.response?.data as ApiErrorResponse | undefined)?.message;
    if (typeof apiMessage === "string" && apiMessage.trim().length > 0) {
      showErrorToast(apiMessage);
      return;
    }

    if (Array.isArray(apiMessage) && apiMessage.length > 0) {
      showErrorToast(apiMessage.join(", "));
      return;
    }
  }

  showErrorToast(fallbackMessage);
};
