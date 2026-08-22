import toast, { Toaster, useToasterStore } from 'react-hot-toast';
import { useEffect } from 'react';

export const ToastManager = () => {
  const { toasts } = useToasterStore();

  useEffect(() => {
    toasts
      .filter((toastItem) => toastItem.visible)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(5)
      .forEach((toastItem) => {
        toast.dismiss(toastItem.id);
      });
  }, [toasts]);

  return <Toaster position="bottom-center" toastOptions={{ duration: 3000 }} />;
};
