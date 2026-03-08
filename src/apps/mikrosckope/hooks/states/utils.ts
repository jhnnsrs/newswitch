import { z } from "zod";

/**
 * Creates a schema that handles the { use: index, value: data } pattern.
 */
export function createIndexedUnion<T extends [z.ZodTypeAny, ...z.ZodTypeAny[]]>(
  schemas: T,
) {
  return z
    .object({
      use: z
        .number()
        .int()
        .min(0)
        .max(schemas.length - 1),
      value: z.unknown(),
    })
    .transform((val, ctx): z.infer<T[number]> => {
      const schema = schemas[val.use];
      const result = schema.safeParse(val.value);

      if (!result.success) {
        result.error.issues.forEach((issue) => ctx.addIssue(issue));
        return z.NEVER;
      }

      return result.data;
    });
}
