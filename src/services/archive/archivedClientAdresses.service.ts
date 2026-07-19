import { get } from "../api";
import type { ArchivedClientAddress, ArchivedClientAddressListResponse } from "@/src/types/client_adresses";

export const archivedClientAddressService = {
  getAll: (token: string | null) => get<ArchivedClientAddressListResponse>("addresses/archived", token),
  getAllUnwrapped: async (token: string | null): Promise<ArchivedClientAddress[]> =>
    (await archivedClientAddressService.getAll(token)).data,
};