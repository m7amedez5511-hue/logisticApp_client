

import type { ReactNode } from "react";

/**
 * Minimal shape every row must satisfy so ReusableTable can key rows.
 * Extend this in your model-specific type (e.g. `interface User extends
 * BaseEntity { ... }`) — nothing here overrides your existing model types.
 */
export interface BaseEntity {
  id: string;
}

/**
 * Describes a single column in ReusableTable.
 *
 * `render` receives the row item (and its index) and returns whatever
 * should appear in that cell — a plain string, a <Badge/>, a <span> with
 * custom styling, etc. This mirrors how every existing table in this
 * project (UserTable, BranchTable, RoleTable, TripTable, OrderTable...)
 * already renders its cells inline.
 */
export interface TableColumn<T> {
  /** Stable key for the column (used as the React key, not displayed) */
  key: string;
  /** Column header label — pass whatever language your page needs
   *  (the original app's headers are Arabic, e.g. "الاسم" / "الحالة") */
  header: string;
  /** Cell renderer for a given row. `isExpanded` is only meaningful when
   *  the table is used with `renderExpanded` (e.g. to rotate a chevron
   *  icon) — existing 2-arg render functions keep working unchanged. */
  render: (item: T, index: number, isExpanded: boolean) => ReactNode;
  /** CSS grid track size, e.g. "2fr", "1.5fr", "120px". Defaults to "1fr" */
  width?: string;
  /** Text alignment for the column body (header stays start-aligned,
   *  matching the existing tables) */
  align?: "left" | "right" | "center";
}

/**
 * Props accepted by <ReusableTable/>. `T` must at minimum have an `id`
 * (see BaseEntity) so keyExtractor has a sane default.
 */
export interface CrudTableProps<T extends BaseEntity> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  /** Defaults to `item => item.id` — override for composite keys */
  keyExtractor?: (item: T) => string;
  /** Optional row click — e.g. open a detail panel (same pattern as
   *  DriversPage / OrderComponent's row `onClick`) */
  onRowClick?: (item: T) => void;

  /** Used only to vary the empty-state message ("no results for X") */
  search?: string;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;

  /** Pagination — omit `pages`/`onPageChange` to hide the pagination bar */
  page?: number;
  pages?: number;
  onPageChange?: (page: number) => void;

  /** Renders the trailing "actions" cell for each row (typically an
   *  <ActionButtons/>). Omit to render a table with no actions column. */
  renderActions?: (item: T, index: number) => ReactNode;
  actionsHeader?: string;
  actionsWidth?: string;

  /**
   * Renders an expandable panel below a row (used by ClientTable's
   * click-to-expand detail panel). When provided, clicking a row toggles
   * that row's panel open/closed instead of firing `onRowClick`, and the
   * row gets the brand-accent highlight treatment (matches
   * ClientTable.tsx's original ClientDetailPanel behavior exactly).
   */
  renderExpanded?: (item: T, index: number) => ReactNode;
}

/**
 * Props for <ActionButtons/>. Every handler is optional so a model that
 * only supports View + Delete (no edit, e.g. archived records) can simply
 * omit `onEdit`.
 */
export interface ActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Accessible label context, e.g. the row's display name — produces
   *  aria-labels like "View John Doe" instead of just "View" */
  itemLabel?: string;
  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
}

/** Props for <ModelCard/> — the card chrome wrapping a ReusableTable */
export interface ModelCardProps {
  title?: string;
  count?: number;
  countLabel?: string;
  /** Slot for a search box / add button / filter, right-aligned like the
   *  existing Header.tsx pattern */
  action?: ReactNode;
  children: ReactNode;
}