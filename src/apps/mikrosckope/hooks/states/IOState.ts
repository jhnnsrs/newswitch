import { z } from "zod";
import { buildUseState, type StateDefinition } from "../useStateSync";

// --- Sub-Schemas ---

// --- Main Schema ---
export const MikrosckopeIOStateSchema = z.object({
  last_saved_file: z.string().nullable(),
});

// --- Type ---
export type MikrosckopeIOState = z.infer<typeof MikrosckopeIOStateSchema>;

export const IOStateSchema = MikrosckopeIOStateSchema;
export type IOState = MikrosckopeIOState;

// --- Definition ---
export const MikrosckopeIOStateDefinition: StateDefinition<
  MikrosckopeIOState,
  "IOState"
> = {
  appKey: "mikrosckope",
  key: "IOState", // The ID used by the backend
  schema: MikrosckopeIOStateSchema,
};

export const IOStateDefinition = MikrosckopeIOStateDefinition;

/**
 * Hook to sync IOState
 */
export const useMikrosckopeIOState = buildUseState<MikrosckopeIOState>(
  MikrosckopeIOStateDefinition,
);

export const useIOState = useMikrosckopeIOState;
