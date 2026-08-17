"use client";

import { useEffect } from "react";
import type { UseFormSetValue, FieldValues, Path } from "react-hook-form";

// Re-applies a saved id to a select field once its option list has
// finished loading — covers the case where the edit modal mounts
// before roles/branches finish fetching from the API.
export function useEditFormSync<T extends FieldValues>(
  setValue: UseFormSetValue<T>,
  fieldName: Path<T>,
  savedId: string | undefined,
  options: { id: string }[],
) {
  useEffect(() => {
    if (savedId && options.some(o => o.id === savedId)) {
      // shouldDirty: false — this is a programmatic sync, not a user edit
      setValue(fieldName, savedId as never, { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, savedId, setValue]);
}