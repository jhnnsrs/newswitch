// src/hooks/useAction.ts
import { useState, useCallback } from 'react';
import { z, ZodType } from 'zod';

// --- The "Interface" Definition ---
// This is the shape of the object the generator will pass to you
export interface ActionDefinition<TArgs, TReturn> {
  name: string;        // e.g. "move_stage"
  description?: string;
  argsSchema: ZodType<TArgs>;
  returnSchema?: ZodType<TReturn>;
}

export const useAction = <TArgs, TReturn>(
  definition: ActionDefinition<TArgs, TReturn>
) => {
  const [data, setData] = useState<TReturn | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [validationError, setValidationError] = useState<z.ZodError | null>(null);

  const execute = useCallback(async (args: TArgs) => {
    setLoading(true); setError(null); setValidationError(null);

    // 1. Validation (Handled by the definition you passed)
    const parsed = definition.argsSchema.safeParse(args);
    if (!parsed.success) {
      setValidationError(parsed.error);
      setLoading(false);
      return;
    }

    try {
      // 2. THE EXECUTION LAYER
      // You decide how 'name' maps to an API call.
      // Example: REST POST to /api/{name}
      const response = await fetch(`/api/${definition.name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) throw new Error(response.statusText);
      const result = await response.json();
      
      // Optional: Validate return data using definition.returnSchema
      setData(result);
      return result;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [definition]);

  return { execute, data, loading, error, validationError };
};