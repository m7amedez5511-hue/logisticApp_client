"use client";

import { ArchivedTripDetailModal } from "@/src/Components/Trip/archive/ArchivedtripDetailModal";
// app/dashboard/trips/archived/[tripId]/page.tsx
// CHANGE: rebuilt as a thin route wrapper around the shared
// ArchivedTripDetailModal instead of its own independent fetch/loading/error/
// render logic. This route now shows the exact same full detail view as the
// in-app archive browser (driver + car + counts + cash + notes + endReason,
// not just the handful of fields this page used to render on its own), and
// stays in sync automatically with any future changes to that component.
// `onClose` navigates back to the trips list (via router.push) instead of
// closing an in-place modal, since this route has no page behind it to
// reveal.

import { useParams, useRouter } from "next/navigation";

export default function ArchivedTripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params?.tripId as string;

  return (
    <ArchivedTripDetailModal
      tripId={tripId}
      onClose={() => router.push("/dashboard/trips")}
    />
  );
}