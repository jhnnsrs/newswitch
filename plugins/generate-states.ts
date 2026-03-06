import fs from "node:fs";
import path from "node:path";
import prettier from "prettier";
import type { Plugin } from "vite";

// --- CONFIG ---
const OUTPUT_DIR = path.resolve(__dirname, "../src/hooks/states"); // Output folder
const IMPORT_PATH_TO_SYNC = "../useStateSync"; // Relative path

// --- PLUGIN OPTIONS ---
export interface GenerateStatesPluginOptions {
  /** URL to fetch the states schema from */
  schemaUrl?: string;
  /** If provided, only these state keys will be generated */
  whitelist?: string[];
  /** If provided, these state keys will be skipped */
  blacklist?: string[];
}

interface ChoiceInput {
  key: string;
  value: any;
  description?: string;
}

// --- HELPER TYPES ---
interface Port {
  key: string;
  kind: string;
  nullable: boolean;
  default?: any;
  children?: Port[];
  choices: ChoiceInput[];
  identifier?: string;
  description?: string;
}

const toCamel = (s: string) =>
  s.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
const toPascal = (s: string) => {
  const c = toCamel(s);
  return c.charAt(0).toUpperCase() + c.slice(1);
};

const shouldGenerateState = (
  key: string,
  whitelist?: string[],
  blacklist?: string[],
) => {
  const isAllowed = whitelist ? whitelist.includes(key) : true;
  const isBlocked = blacklist ? blacklist.includes(key) : false;

  return isAllowed && !isBlocked;
};

// --- CODE SNIPPETS ---
const utilsCode = `
import { z } from 'zod';

/**
 * Creates a schema that handles the { use: index, value: data } pattern.
 */
export function createIndexedUnion<T extends [z.ZodTypeAny, ...z.ZodTypeAny[]]>(schemas: T) {
  return z
    .object({
      use: z.number().int().min(0).max(schemas.length - 1),
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
`;

// --- ZOD MAPPING ---
const mapToZod = (
  port: Port,
  subSchemas: Map<string, string>,
  fallbackName: string = "Unknown",
): string => {
  let base = "z.any()";

  // Determine a sensible name for this node if it lacks a clear identifier or valid key
  const isValidKey = port.key && port.key !== "..." && port.key !== "";
  const nodeName = port.identifier || (isValidKey ? port.key : fallbackName);

  switch (port.kind) {
    case "FLOAT":
    case "INT":
      base = "z.number()";
      break;
    case "BOOL":
      base = "z.boolean()";
      break;
    case "STRUCTURE":
      base = `z.string().brand('${port.identifier}').meta({ brand: '${port.identifier}' })`;
      break;
    case "STRING":
      if (port.choices && port.choices.length > 0) {
        const values = port.choices
          .map((choice) => JSON.stringify(choice.key))
          .join(", ");
        base = `z.enum([${values}])`;
      } else {
        base = "z.string()";
      }
      break;
    case "ENUM":
      if (port.choices && port.choices.length > 0) {
        const values = port.choices
          .map((choice) => JSON.stringify(choice.key))
          .join(", ");
        base = `z.enum([${values}]).brand('${port.identifier}').meta({ brand: '${port.identifier}' })`;
      } else {
        base = `z.string().brand('${port.identifier}').meta({ brand: '${port.identifier}' })`;
      }
      break;
    case "LIST":
      if (port.children && port.children.length > 0) {
        // Derive a singular name from the plural node name, or append "Item"
        const childFallback = nodeName.endsWith("s")
          ? nodeName.slice(0, -1)
          : `${nodeName}Item`;
        const elementType = mapToZod(
          port.children[0],
          subSchemas,
          childFallback,
        );
        base = `z.array(${elementType})`;
      } else {
        base = "z.array(z.any())";
      }
      break;
    case "DICT":
      if (port.children && port.children.length > 0) {
        const childFallback = `${nodeName}Value`;
        const valueType = mapToZod(port.children[0], subSchemas, childFallback);
        base = `z.record(z.string(), ${valueType})`;
      } else {
        base = "z.record(z.string(), z.any())";
      }
      break;
    case "MODEL": {
      const brandName = port.identifier || nodeName;
      const modelName = port.identifier
        ? `${toPascal(port.identifier)}Schema`
        : `${toPascal(nodeName)}ModelSchema`;

      if (!subSchemas.has(modelName)) {
        let fieldsCode = "";

        // Inject a runtime brand into the Zod object using a literal with a default
        const injectedBrand = `__brand: z.literal('${brandName}').default('${brandName}')`;

        if (port.children && port.children.length > 0) {
          const fields = port.children.map(
            (child) =>
              `  ${child.key}: ${mapToZod(child, subSchemas, child.key)}`,
          );
          fieldsCode = `{\n  ${injectedBrand},\n${fields.join(",\n")}\n}`;
        } else {
          fieldsCode = `{ \n  ${injectedBrand}\n}`;
        }

        const brandSuffix = port.identifier
          ? `.brand('${port.identifier}')`
          : "";

        // Save the standalone schema definition
        subSchemas.set(
          modelName,
          `export const ${modelName} = z.object(${fieldsCode})${brandSuffix};`,
        );
      }
      base = modelName;
      break;
    }
    case "UNION": {
      // Use the derived nodeName for the union as well
      const unionName = port.identifier
        ? `${toPascal(port.identifier)}UnionSchema`
        : `${toPascal(nodeName)}UnionSchema`;

      if (!subSchemas.has(unionName)) {
        if (port.children && port.children.length > 0) {
          const types = port.children.map((child, index) =>
            mapToZod(child, subSchemas, `${nodeName}Variant${index + 1}`),
          );
          // Save the indexed union definition
          subSchemas.set(
            unionName,
            `export const ${unionName} = createIndexedUnion([\n  ${types.join(",\n  ")}\n]);`,
          );
        } else {
          base = "z.any()";
          break;
        }
      }
      base = unionName;
      break;
    }
    default:
      base = "z.any()";
  }

  if (port.nullable) return `${base}.nullable()`;
  return base;
};

// --- CONTENT GENERATOR ---
const generateContent = (key: string, stateDef: any) => {
  const hookName = `use${toPascal(key)}`; // useStageState
  const schemaName = `${toPascal(key)}Schema`;
  const typeName = `${toPascal(key)}`; // StageState (Type)
  const defName = `${toPascal(key)}Definition`;

  const subSchemas = new Map<string, string>();

  // 1. Generate Zod Schema fields from 'ports' and populate subSchemas
  // Pass down the port's actual key as the top-level fallback
  const fields = stateDef.ports
    .map((p: Port) => `  ${p.key}: ${mapToZod(p, subSchemas, p.key)}`)
    .join(",\n");

  const subSchemasCode = Array.from(subSchemas.values()).join("\n\n");
  const mainSchemaCode = `export const ${schemaName} = z.object({\n${fields}\n});`;

  const includesUnion = subSchemasCode.includes("createIndexedUnion");

  return `
import { z } from 'zod';
import { buildUseState, type StateDefinition } from '${IMPORT_PATH_TO_SYNC}';
${includesUnion ? "import { createIndexedUnion } from './utils';" : ""}

// --- Sub-Schemas ---
${subSchemasCode}

// --- Main Schema ---
${mainSchemaCode}

// --- Type ---
export type ${typeName} = z.infer<typeof ${schemaName}>;

// --- Definition ---
export const ${defName}: StateDefinition<${typeName}> = {
  key: "${key}", // The ID used by the backend
  schema: ${schemaName},
};

/**
 * Hook to sync ${key}
 */
export const ${hookName} = buildUseState<${typeName}>(${defName});
`;
};

// --- VITE PLUGIN ---
export default function generateStatesPlugin(
  options: GenerateStatesPluginOptions = {},
): Plugin {
  const { schemaUrl, whitelist, blacklist } = options;

  return {
    name: "vite-plugin-generate-states",
    async buildStart() {
      if (!schemaUrl) {
        console.warn(
          "⚠️ [GenStates] No schemaUrl provided, skipping state hook generation.",
        );
        return;
      }

      let schema: any;
      try {
        const response = await fetch(schemaUrl);
        if (!response.ok) {
          console.error(
            `❌ [GenStates] Failed to fetch schema from ${schemaUrl}: ${response.status}`,
          );
          return;
        }
        schema = await response.json();
      } catch (error) {
        console.error(
          `❌ [GenStates] Error fetching schema from ${schemaUrl}:`,
          error,
        );
        return;
      }

      if (!fs.existsSync(OUTPUT_DIR))
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      // Clean previous generated outputs
      fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      const files: string[] = [];

      // Generate the utils file
      const formattedUtils = await prettier.format(utilsCode, {
        parser: "typescript",
      });
      fs.writeFileSync(path.join(OUTPUT_DIR, "utils.ts"), formattedUtils);
      files.push("utils"); // store for index.ts

      const generatedStateNames: string[] = [];

      // Iterate over the "states" object in your schema
      for (const [key, stateDef] of Object.entries(schema.states)) {
        if (!shouldGenerateState(key, whitelist, blacklist)) {
          continue;
        }

        const code = generateContent(key, stateDef);
        const formatted = await prettier.format(code, { parser: "typescript" });

        // File name: StageState.ts
        const stateName = toPascal(key);
        const fname = `${stateName}.ts`;
        fs.writeFileSync(path.join(OUTPUT_DIR, fname), formatted);
        files.push(stateName); // store for index.ts
        generatedStateNames.push(stateName);
      }

      const stateDefinitionImports = generatedStateNames
        .map(
          (stateName) =>
            `import { ${stateName}Definition } from './${stateName}';`,
        )
        .join("\n");

      const stateDefinitionEntries = generatedStateNames
        .map((stateName) => `  ${stateName}: ${stateName}Definition,`)
        .join("\n");

      // Generate Barrel file + global state definition registry
      const indexCode = `
import type { StateDefinition } from '../useStateSync';
${stateDefinitionImports}

${files.map((f) => `export * from './${f}';`).join("\n")}

export const globalStateDefinition = {
${stateDefinitionEntries}
} satisfies Record<string, StateDefinition<unknown>>;

// Backwards-compatible alias for the requested misspelling.
export const globalStateDefintiion = globalStateDefinition;
`;
      const formattedIndex = await prettier.format(indexCode, {
        parser: "typescript",
      });
      fs.writeFileSync(path.join(OUTPUT_DIR, "index.ts"), formattedIndex);

      console.log(
        `✅ [GenStates] Generated ${files.length} files (including utils) from ${schemaUrl}`,
      );
    },
  };
}
