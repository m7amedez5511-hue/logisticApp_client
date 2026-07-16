// src/Components/UI/ConfirmDialog.tsx
// CHANGE: added optional `role` prop (default "alertdialog" — matches the 9
// legacy modals being replaced), forwarded into Modal.
import { Button } from "./Button";
import { Modal } from "./ModalProps";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  /** Subtitle shown in modal header */
  subtitle?: string;
  /** ARIA role — defaults to "alertdialog" to match the destructive-action
   *  semantics of the delete-confirmation modals this component replaces. */
  role?: "dialog" | "alertdialog";
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "تأكيد",
  cancelLabel  = "إلغاء",
  onConfirm,
  onCancel,
  loading = false,
  subtitle,
  role = "alertdialog",
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      subtitle={subtitle}
      onClose={onCancel}
      size="sm"
      role={role}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
        {description}
      </p>
    </Modal>
  );
}