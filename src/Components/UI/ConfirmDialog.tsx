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
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      subtitle={subtitle}
      onClose={onCancel}
      size="sm"
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