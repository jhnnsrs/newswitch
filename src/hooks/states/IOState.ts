import { z } from "zod";
import {
  buildUseState,
  type StateDefinition,
  type UseStateSyncOptions,
} from "../useStateSync";

// --- Schema ---
export const IOStateSchema = z.object({
  last_saved_file: z.string().nullable(),
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
export const useIOState = buildUseState<IOState>(IOStateDefinition);
