import { z } from "zod";
import { buildUseState, type StateDefinition } from "../useStateSync";

// --- Sub-Schemas ---

// --- Main Schema ---
export const MikrosckopeSerialStateSchema = z.object({
  active: z.boolean(),
});

// --- Type ---
export type MikrosckopeSerialState = z.infer<
  typeof MikrosckopeSerialStateSchema
>;

export const SerialStateSchema = MikrosckopeSerialStateSchema;
export type SerialState = MikrosckopeSerialState;

// --- Definition ---
export const MikrosckopeSerialStateDefinition: StateDefinition<
  MikrosckopeSerialState,
  "SerialState"
> = {
  appKey: "mikrosckope",
  key: "SerialState", // The ID used by the backend
  schema: MikrosckopeSerialStateSchema,
};

export const SerialStateDefinition = MikrosckopeSerialStateDefinition;

/**
 * Hook to sync SerialState
 */
export const useMikrosckopeSerialState = buildUseState<MikrosckopeSerialState>(
  MikrosckopeSerialStateDefinition,
);

export const useSerialState = useMikrosckopeSerialState;
