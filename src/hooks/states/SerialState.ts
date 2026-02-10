import { z } from "zod";
import {
  buildUseState,
  type StateDefinition,
  type UseStateSyncOptions,
} from "../useStateSync";

// --- Schema ---
export const SerialStateSchema = z.object({
  active: z.boolean(),
});

// --- Type ---
export type SerialState = z.infer<typeof SerialStateSchema>;

// --- Definition ---
export const SerialStateDefinition: StateDefinition<SerialState> = {
  key: "SerialState", // The ID used by the backend
  schema: SerialStateSchema,
};

/**
 * Hook to sync SerialState
 */
export const useSerialState = buildUseState<SerialState>(SerialStateDefinition);
