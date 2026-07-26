"use client";



import { IconBtn } from "./IconBtn";
import type { ActionButtonsProps } from "@/src/types/models";


const ViewIcon = <i className="ti ti-eye" style={{ fontSize: 14 }} aria-hidden="true" />;

const EditIcon = <i className="ti ti-edit" style={{ fontSize: 14 }} aria-hidden="true" />;

const DeleteIcon = <i className="ti ti-trash" style={{ fontSize: 14 }} aria-hidden="true" />;

export function ActionButtons({
  onView,
  onEdit,
  onDelete,
  itemLabel = "",
  viewLabel = "View",
  editLabel = "Edit",
  deleteLabel = "Delete",
}: ActionButtonsProps) {
  const suffix = itemLabel ? ` ${itemLabel}` : "";

  return (
    <>
      {onView && (
        <IconBtn title={`${viewLabel}${suffix}`} color="#059669" bg="#ECFDF5" borderColor="#A7F3D0" onClick={onView}>
          {ViewIcon}
        </IconBtn>
      )}
      {onEdit && (
        <IconBtn title={`${editLabel}${suffix}`} color="#1D4ED8" bg="#EFF6FF" borderColor="#BFDBFE" onClick={onEdit}>
          {EditIcon}
        </IconBtn>
      )}
      {onDelete && (
        <IconBtn title={`${deleteLabel}${suffix}`} color="#DC2626" bg="#FEF2F2" borderColor="#FECACA" onClick={onDelete}>
          {DeleteIcon}
        </IconBtn>
      )}
    </>
  );
}