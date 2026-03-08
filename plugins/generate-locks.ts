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
  /** If provided, only these lock keys will be generated */
  whitelist?: string[];
  /** If provided, these lock keys will be skipped */
  blacklist?: string[];
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

const shouldGenerateLock = (
  key: string,
  whitelist?: string[],
  blacklist?: string[],
) => {
  const isAllowed = whitelist ? whitelist.includes(key) : true;
  const isBlocked = blacklist ? blacklist.includes(key) : false;

  return isAllowed && !isBlocked;
};

type ExportEntry = {
  kind: "value" | "type";
  name: string;
};

const getExportEntries = (code: string): ExportEntry[] => {
  const exportEntries = new Map<string, ExportEntry>();

  for (const match of code.matchAll(
    /export\s+(const|type|function)\s+(\w+)/g,
  )) {
    const [, rawKind, name] = match;
    exportEntries.set(name, {
      name,
      kind: rawKind === "type" ? "type" : "value",
    });
  }

  return Array.from(exportEntries.values());
};

// --- CONTENT GENERATOR ---
const generateContent = (key: string, lockDef: LockDef) => {
  const hookName = `use${toPascal(key)}Lock`; // useStageState
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
  const { schemaUrl, whitelist, blacklist } = options;

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
      const fileExports = new Map<string, ExportEntry[]>();
      const generatedLockNames: string[] = [];

      if (!fs.existsSync(OUTPUT_DIR))
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });

      // Iterate over the "states" object in your schema
      for (const [key, stateDef] of Object.entries(schema.locks)) {
        if (!shouldGenerateLock(key, whitelist, blacklist)) {
          continue;
        }

        const code = generateContent(key, stateDef);
        const formatted = await prettier.format(code, { parser: "typescript" });

        // File name: StageState.ts
        const lockName = toPascal(key);
        const fname = `${lockName}.ts`;
        fs.writeFileSync(path.join(OUTPUT_DIR, fname), formatted);
        files.push(lockName);
        generatedLockNames.push(lockName);
        fileExports.set(lockName, getExportEntries(formatted));
      }

      const lockDefinitionImports = generatedLockNames
        .map(
          (lockName) => `import { ${lockName}Definition } from './${lockName}';`,
        )
        .join("\n");

      const lockDefinitionEntries = generatedLockNames
        .map((lockName) => `  ${lockName}: ${lockName}Definition,`)
        .join("\n");

      const exportCounts = new Map<string, number>();
      for (const exportEntries of fileExports.values()) {
        for (const { name } of exportEntries) {
          exportCounts.set(name, (exportCounts.get(name) ?? 0) + 1);
        }
      }

      const barrelExports = Array.from(fileExports.entries())
        .map(([fileName, exportEntries]) => {
          const uniqueExportEntries = exportEntries.filter(
            ({ name }) => exportCounts.get(name) === 1,
          );

          if (uniqueExportEntries.length === 0) {
            return null;
          }

          const valueExports = uniqueExportEntries
            .filter(({ kind }) => kind === "value")
            .map(({ name }) => name);
          const typeExports = uniqueExportEntries
            .filter(({ kind }) => kind === "type")
            .map(({ name }) => name);

          const exportLines = [
            valueExports.length > 0
              ? `export { ${valueExports.join(", ")} } from './${fileName}';`
              : null,
            typeExports.length > 0
              ? `export type { ${typeExports.join(", ")} } from './${fileName}';`
              : null,
          ].filter((line): line is string => line !== null);

          return exportLines.join("\n");
        })
        .filter((line): line is string => line !== null)
        .join("\n");

      const indexCode = `
import type { LockDefinition } from '../useLockSync';
${lockDefinitionImports}

${barrelExports}

export const globalLockDefinition = {
${lockDefinitionEntries}
} satisfies Record<string, LockDefinition<string>>;

export type GlobalLockDefinition = typeof globalLockDefinition;
type InferLockKey<TDefinition> =
  TDefinition extends LockDefinition<infer TKey> ? TKey : never;

export type GlobalLockKey = InferLockKey<
  GlobalLockDefinition[keyof GlobalLockDefinition]
>;
export const globalLockKeys = Object.values(globalLockDefinition).map((definition) => definition.key) as GlobalLockKey[];

// Backwards-compatible alias for the requested misspelling.
export const globalLockDefintiion = globalLockDefinition;
`;
      const formattedIndex = await prettier.format(indexCode, {
        parser: "typescript",
      });
      fs.writeFileSync(path.join(OUTPUT_DIR, "index.ts"), formattedIndex);

      console.log(
        `✅ [GenLocks] Generated ${files.length} lock hooks from ${schemaUrl}`,
      );
    },
  };
}
