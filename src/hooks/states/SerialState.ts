import { z } from "zod";
import { buildUseState, type StateDefinition } from "../useStateSync";

// --- Sub-Schemas ---

// --- Main Schema ---
export const SerialStateSchema = z.object({
  active: z.boolean(),
});

// --- Type ---
export type SerialState = z.infer<typeof SerialStateSchema>;

// --- Definition ---
export const SerialStateDefinition: StateDefinition<
  SerialState,
  "SerialState"
> = {
  key: "SerialState", // The ID used by the backend
  schema: SerialStateSchema,
};

/**
 * Hook to sync SerialState
 */
export const useSerialState = buildUseState<SerialState>(SerialStateDefinition);
