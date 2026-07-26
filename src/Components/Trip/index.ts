// src/Components/Trip/index.ts
// CHANGE: removed TripDeleteModal export (Issue 1).
// CHANGE: split the old single-file Trip module into TripTable.tsx /
// TripFormModal.tsx / TripDetailModal.tsx, mirroring src/Components/User.
export { TripTable } from "./TripTable";
export { TripFormModal } from "./TripFormModal";
export { TripDetailModal } from "./TripDetailModal";