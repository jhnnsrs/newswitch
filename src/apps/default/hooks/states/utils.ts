import { z } from "zod";

/**
 * Creates a schema that handles the { use: index, value: data } pattern.
 */
export function createIndexedUnion<T extends [z.ZodTypeAny, ...z.ZodTypeAny[]]>(
  schemas: T,
) {
  return z.union(schemas);
}
