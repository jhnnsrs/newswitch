import fs from "node:fs";
import path from "node:path";
import prettier from "prettier";
import zod from "zod";
import type { Plugin } from "vite";

// --- CONFIG ---
const OUTPUT_DIR = path.resolve(__dirname, "../src/hooks/locks"); // Output folder
const IMPORT_PATH_TO_SYNC = "../useLockSync"; // Relative path

// --- PLUGIN OPTIONS ---
export interface GenerateStatesPluginOptions {
  /** URL to fetch the states schema from */
  schemaUrl?: string;
}

const LockSchema = zod.object({
  key: zod.string(),
  description: zod.string().optional(),
  // Add more fields as needed based on your schema
});

const LocksSchema = zod.object({
  locks: zod.record(zod.string(), LockSchema),
});

type LockDef = zod.infer<typeof LockSchema>;
type LocksSchemaType = zod.infer<typeof LocksSchema>;

const toCamel = (s: string) =>
  s.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
const toPascal = (s: string) => {
  const c = toCamel(s);
  return c.charAt(0).toUpperCase() + c.slice(1);
};

// --- CONTENT GENERATOR ---
const generateContent = (key: string, lockDef: LockDef) => {
  const hookName = `use${toPascal(key)}Lock`; // useStageState
  const typeName = `${toPascal(key)}`; // StageState (Type)
  const defName = `${toPascal(key)}Definition`;

  return `
import { useLockSync, type LockDefinition, type UseLockSyncOptions} from '${IMPORT_PATH_TO_SYNC}';


// --- Definition ---
export const ${defName}: LockDefinition<"${key}"> = {
  // ${lockDef.description ? lockDef.description : "No description provided"} (You can add a "description" field in your schema for better documentation)
  key: "${key}", // The ID used by the backend
};

/**
 * Hook to sync ${key}
 */
export const ${hookName} = (options?: UseLockSyncOptions) => {
  return useLockSync<"${key}">(${defName}, options);
};`;
};

// --- VITE PLUGIN ---
export default function generateLocksPlugin(
  options: GenerateStatesPluginOptions = {},
): Plugin {
  const { schemaUrl } = options;

  console.log("Generate Locks Plugin initialized with schemaUrl:", schemaUrl);

  return {
    name: "vite-plugin-generate-locks",
    async buildStart() {
      if (!schemaUrl) {
        console.warn(
          "⚠️ [GenStates] No schemaUrl provided, skipping state hook generation.",
        );
        return;
      }

      console.log(`🔄 [GenLocks] Fetching schema from ${schemaUrl}...`);

      let schema: LocksSchemaType | null = null;
      try {
        const response = await fetch(schemaUrl);
        if (!response.ok) {
          console.error(
            `❌ [GenLocks] Failed to fetch schema from ${schemaUrl}: ${response.status}`,
          );
          return;
        }
        schema = LocksSchema.parse(await response.json());
      } catch (error) {
        console.error(
          `❌ [GenLocks] Errosr fetching schema from ${schemaUrl}:`,
          error,
        );
        return;
      }

      const files: string[] = [];

      if (!fs.existsSync(OUTPUT_DIR))
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });

      // Iterate over the "states" object in your schema
      for (const [key, stateDef] of Object.entries(schema.locks)) {
        const code = generateContent(key, stateDef);
        const formatted = await prettier.format(code, { parser: "typescript" });

        // File name: StageState.ts
        const fname = `${toPascal(key)}.ts`;
        fs.writeFileSync(path.join(OUTPUT_DIR, fname), formatted);
        files.push(toPascal(key)); // store for index.ts
      }

      // Generate Barrel file
      const index = files.map((f) => `export * from './${f}';`).join("\n");
      fs.writeFileSync(path.join(OUTPUT_DIR, "index.ts"), index);

      console.log(
        `✅ [GenLocks] Generated ${files.length} lock hooks from ${schemaUrl}`,
      );
    },
  };
}
