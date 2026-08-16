import { cn } from "@/lib/cn";

export interface ModalProps {
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}

export function Modal({ title, onClose, wide, children }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          "max-h-[85vh] w-full overflow-y-auto rounded-[10px] border border-volt-border bg-volt-surface p-6",
          wide ? "max-w-xl" : "max-w-md",
        )}
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
