import { z } from "zod";
import {
  useStateSync,
  type StateDefinition,
  type UseStateSyncOptions,
} from "../useStateSync";

// --- Schema ---
export const IOStateSchema = z.object({
  last_saved_file: z.any().nullable(),
});

// --- Type ---
export type IOState = z.infer<typeof IOStateSchema>;

// --- Definition ---
export const IOStateDefinition: StateDefinition<IOState> = {
  key: "IOState", // The ID used by the backend
  schema: IOStateSchema,
};

/**
 * Hook to sync IOState
 */
export const useIOState = (options?: UseStateSyncOptions) => {
  return useStateSync<IOState>(IOStateDefinition, options);
};
