import { useEffect } from "react";
import { cn } from "@/lib/cn";

const WIDTH_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-xl",
} as const;

export interface ModalProps {
  title: string;
  onClose: () => void;
  width?: keyof typeof WIDTH_CLASSES;
  children: React.ReactNode;
}

export function Modal({ title, onClose, width = "md", children }: ModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-volt-ground/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={cn(
          "max-h-[85vh] w-full overflow-y-auto rounded-wk border border-volt-border bg-volt-surface p-6",
          WIDTH_CLASSES[width],
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-volt-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-sm text-volt-text-3 transition-colors hover:text-volt-text"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
