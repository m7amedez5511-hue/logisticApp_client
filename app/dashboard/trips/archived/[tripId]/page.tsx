"use client";

import { ArchivedTripDetailModal } from "@/src/Components/Trip/archive/ArchivedtripDetailModal";


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