import { get } from "../api";
import type { ArchivedClientAddressListResponse } from "@/src/types/client_adresses";

export const archivedClientAddressService = {
  /**
   * Fetching every archived (soft-deleted) address across all clients.
   * NOTE: this endpoint returns a flat array with no pagination meta,
   * unlike users/archived and client/archived — so no page/limit params here.
   */
  getAll: (token: string | null) =>
    get<ArchivedClientAddressListResponse>("addresses/archived", token),

  // NOTE: no GET /addresses/archived/{id} was specified — the list endpoint
  // already returns the full address shape, so the detail modal renders
  // directly from the list item instead of firing a second request.
};