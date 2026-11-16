"use client";

import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

/**
 * Toasts do Euriptus. O tema é fixo no claro porque o produto não tem modo
 * escuro; mantemos a mesma paleta do restante da interface.
 */
export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      theme="light"
      position="top-right"
      richColors
      closeButton
      toastOptions={{ duration: 5000 }}
      {...props}
    />
  );
}
