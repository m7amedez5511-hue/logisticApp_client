/**
 * src/Components/Client/index.ts
 *
 * Barrel exports for all Client-domain components.
 *
 * NOTE: Toast is re-exported here for backwards-compatibility, but it now
 *       delegates to src/Components/UI/Toast.  Prefer importing Toast directly
 *       from "@/src/Components/UI" in new code.
 */

export { ClientFormModal }    from "./Clientformmodal";
export { ClientTable }        from "./Clienttable";
export { AddressFormModal }   from "../Client_Adress/Addressformmodal";
export { DeleteConfirmModal } from "./Deleteconfirmmodal";

// Toast: re-exported from Client/Toast, which itself re-exports UI/Toast.
// Maintains backwards-compat for any consumer importing from "@/src/Components/Client".
export { Toast } from "./Toast";