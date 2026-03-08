import fs from "node:fs";
import path from "node:path";
import prettier from "prettier";
import type { Plugin } from "vite";

// --- CONFIG ---
const OUTPUT_DIR = path.resolve(__dirname, "../src/hooks/generated");
const IMPORT_PATH_TO_USE_ACTION = "../../transport/useTransportAction";

// --- PLUGIN OPTIONS ---
export interface GenerateHooksPluginOptions {
  schemaUrl?: string;
  whitelist?: string[];
  blacklist?: string[];
  outputDir?: string;
  importPathToUseAction?: string;
  indexImportPathToUseAction?: string;
  appKey?: string;
  symbolPrefix?: string;
  hookNamePrefix?: string;
}

interface HooksSchema {
  implementations: Record<string, Implementation>;
}

interface ValidatorSchema {
  function: string;
  dependencies: string;
  errorMessage: string;
}

export interface Choice {
  label: string;
  value: string | number;
  description?: string;
}

interface SchemaArg {
  key?: string;
  kind: string;
  nullable: boolean;
  identifier?: string;
  default?: unknown;
  children?: SchemaArg[];
  choices?: Choice[];
  description?: string;
  validators?: ValidatorSchema[];
}

interface GeneratorContext {
  namedTypes: Map<string, { schema: string; description?: string }>;
  symbolPrefix?: string;
}

const toCamel = (s: string) =>
  s.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
const toPascal = (s: string) => {
  const c = toCamel(s);
  return c.charAt(0).toUpperCase() + c.slice(1);
};

const withSymbolPrefix = (value: string, symbolPrefix?: string) =>
  symbolPrefix ? `${symbolPrefix}${value}` : value;

const toGeneratedName = (value: string, symbolPrefix?: string) =>
  withSymbolPrefix(toPascal(value), symbolPrefix);

const shouldGenerateHook = (
  key: string,
  whitelist?: string[],
  blacklist?: string[],
) => {
  const isAllowed = whitelist ? whitelist.includes(key) : true;
  const isBlocked = blacklist ? blacklist.includes(key) : false;

  return isAllowed && !isBlocked;
};

/**
 * Helper to format JSDoc descriptions
 */
const renderDescription = (desc?: string) => {
  if (!desc) return "";
  return `/** ${desc} */\n`;
};

/**
 * Generates the .superRefine() block for a Zod object schema
 * based on the validators present in its children/fields.
 */
const appendValidators = (
  baseSchemaCode: string,
  fields: SchemaArg[],
): string => {
  // Filter for fields that actually have validators
  const fieldsWithValidators = fields.filter(
    (c) => c.validators && c.validators.length > 0 && c.key,
  );

  if (fieldsWithValidators.length === 0) {
    return baseSchemaCode;
  }

  // Generate the superRefine block
  const refinements = fieldsWithValidators
    .map((field) => {
      const fieldName = field.key!;

      return field
        .validators!.map((v) => {
          // Parse dependencies: "dep1, dep2" -> ['dep1', 'dep2']
          const deps = v.dependencies
            ? v.dependencies
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [];

          // Build the context object: { self: val['myField'], dep1: val['dep1'] }
          // We use val['key'] notation to avoid issues if keys have special chars
          const contextProps = [
            `self: val['${fieldName}']`,
            ...deps.map((d) => `${d}: val['${d}']`),
          ].join(", ");

          return `
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type ValidatorFunc = (context: any) => boolean;
          const validatorFn: ValidatorFunc = ${v.function};
          const context = { ${contextProps} };
          
          if (!validatorFn(context)) {
            ctx.addIssue({
              code: "custom",
              message: ${JSON.stringify(v.errorMessage || "Validation failed")},
              path: ['${fieldName}']
            });
          }
        }`;
        })
        .join("\n");
    })
    .join("\n");

  return `${baseSchemaCode}.superRefine((val, ctx) => {
    ${refinements}
  })`;
};

const mapChoicesToZodEnum = (choices: Choice[]): string => {
  const values = choices.map(
    (opt) =>
      `z.literal(${JSON.stringify(opt.value)}).describe(${JSON.stringify(opt.description || opt.value)})`,
  );
  return `z.union([${values.join(", ")}])`;
};

const mapToZod = (arg: SchemaArg, ctx: GeneratorContext): string => {
  let base = "z.any()";

  if (
    arg.kind === "MODEL" &&
    arg.identifier &&
    ctx.namedTypes.has(arg.identifier)
  ) {
    base = `${toGeneratedName(arg.identifier, ctx.symbolPrefix)}Schema`;
  } else {
    switch (arg.kind) {
      case "FLOAT":
      case "INT":
        base = "z.number()";
        break;
      case "BOOL":
        base = "z.boolean()";
        break;
      case "STRING":
        base = "z.string()";
        break;
      case "MEMORY_STRUCTURE":
        base = "z.record(z.string(), z.any())";
        break;
      case "SRUCTURE":
        base = `z.string().brand('${arg.identifier}')`;
        break;
      case "LIST":
        if (arg.children?.[0]) {
          base = `z.array(${mapToZod(arg.children[0], ctx)})`;
        } else {
          base = "z.array(z.any())";
        }
        break;
      case "DICT":
        if (arg.children?.[0]) {
          base = `z.record(z.string(), ${mapToZod(arg.children[0], ctx)})`;
        } else {
          base = "z.record(z.string(), z.any())";
        }
        break;
      case "MODEL": {
        const children = arg.children || [];

        // 1. Generate fields
        const fields = children
          .map((child) => {
            const desc = renderDescription(child.description);
            return `${desc}${child.key}: ${mapToZod(child, ctx)}`;
          })
          .join(",\n");

        // 2. Create Base Object
        let schemaCode = `z.object({\n${fields}\n}).brand('${arg.identifier}')`;

        // 3. Append Validators (Refactored)
        schemaCode = appendValidators(schemaCode, children);

        if (arg.identifier) {
          ctx.namedTypes.set(arg.identifier, {
            schema: schemaCode,
            description: arg.description,
          });
          base = `${toGeneratedName(arg.identifier, ctx.symbolPrefix)}Schema`;
        } else {
          base = schemaCode;
        }
        break;
      }
      case "UNION":
        if (arg.children && arg.children.length > 0) {
          const types = arg.children.map((child) => mapToZod(child, ctx));
          base = `z.union([${types.join(", ")}])`;
        } else {
          base = "z.any()";
        }
        break;
      case "ENUM":
        if (arg.choices && arg.choices.length > 0) {
          base = mapChoicesToZodEnum(arg.choices);
        } else {
          base = "z.string()";
        }
        break;
      case "SCALAR":
        base = "z.string()";
        break;
      default:
        base = "z.any()";
    }
  }

  // Attach description
  if (arg.description) {
    base = `${base}.describe(${JSON.stringify(arg.description)})`;
  }

  // Handle Nullable/Optional
  if (arg.nullable || (arg.default !== null && arg.default !== undefined)) {
    return `${base}.optional()`;
  }

  return base;
};

type Optimistic = {
  state: string;
  path: string;
  accessor: string;
};

type Implementation = {
  definition: {
    args?: SchemaArg[];
    returns?: SchemaArg[];
  };
  description?: string;
  locks?: string[];
  optimistics?: Optimistic[];
};

const generateOptimisticState = (optimistic: Optimistic) => {
  const optimisticName = `Optimistic${toCamel(optimistic.state)}`;

  return `
  export const ${optimisticName} = {
    key: "${optimistic.state}",
    selector: (state: never) => ${optimistic.path.split(".").reduce((acc, part) => (part && part != "" ? `${acc}.${part}` : acc), "state")},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accessor: (state: any, args: any) => ${optimistic.accessor}
  };`;
};

const generateContent = (
  key: string,
  impl: Implementation,
  importPathToUseAction: string,
  appKey?: string,
  symbolPrefix?: string,
) => {
  const ctx: GeneratorContext = { namedTypes: new Map(), symbolPrefix };

  const baseName = toPascal(key);
  const generatedName = withSymbolPrefix(baseName, symbolPrefix);
  const hookName = `use${baseName}`;
  const qualifiedHookName = symbolPrefix
    ? `use${generatedName}`
    : hookName;
  const defName = `${generatedName}Definition`;

  // --- ARGS SCHEMA GENERATION ---
  const argsList: SchemaArg[] = impl.definition.args || [];
  const returnsList: SchemaArg[] = impl.definition.returns || [];

  const argsFields = argsList
    .map(
      (a) => `${renderDescription(a.description)}${a.key}: ${mapToZod(a, ctx)}`,
    )
    .join(",\n");

  // Create base object for Args
  let argsSchemaCode = `z.object({\n${argsFields}\n})`;

  // Apply validators to the root Args object
  argsSchemaCode = appendValidators(argsSchemaCode, argsList);

  const argsSchemaName = `${generatedName}ArgsSchema`;
  const argsDef = `export const ${argsSchemaName} = ${argsSchemaCode};`;

  // --- RETURN SCHEMA GENERATION ---
  const returnsFields = returnsList
    .map(
      (a) => `${renderDescription(a.description)}${a.key}: ${mapToZod(a, ctx)}`,
    )
    .join(",\n");

  const returnSchemaName = `${generatedName}ReturnSchema`;
  let returnSchemaCode = `z.object({\n${returnsFields}\n})`;
  returnSchemaCode = appendValidators(returnSchemaCode, returnsList);
  const returnDef = `export const ${returnSchemaName} = ${returnSchemaCode};`;

  // --- NAMED TYPES ---
  const namedTypesCode = Array.from(ctx.namedTypes.entries())
    .map(([id, data]) => {
      const name = toGeneratedName(id, symbolPrefix);
      const aliasName = toPascal(id);
      return `
${renderDescription(data.description)}export const ${name}Schema = ${data.schema};
${renderDescription(data.description)}export type ${name} = z.infer<typeof ${name}Schema>;
${symbolPrefix ? `export const ${aliasName}Schema = ${name}Schema;
export type ${aliasName} = ${name};` : ""}`;
    })
    .join("\n");

  const argsTypeName = `${generatedName}Args`;
  const returnTypeName = `${generatedName}Return`;
  const schemaAndTypeAliases = symbolPrefix
    ? `
export const ${baseName}ArgsSchema = ${argsSchemaName};
export const ${baseName}ReturnSchema = ${returnSchemaName};
export type ${baseName}Args = ${argsTypeName};
export type ${baseName}Return = ${returnTypeName};`
    : "";
  const definitionAlias = symbolPrefix
    ? `
export const ${baseName}Definition = ${defName};`
    : "";

  const optimisticExports = (impl.optimistics || []).map((optimistic) => {
    const optimisticName = `Optimistic${toCamel(optimistic.state)}`;
    const generatedOptimisticName = withSymbolPrefix(
      optimisticName,
      symbolPrefix,
    );
    const optimisticExport = generateOptimisticState(optimistic).replace(
      `export const ${optimisticName}`,
      `export const ${generatedOptimisticName}`,
    );

    if (!symbolPrefix) {
      return optimisticExport;
    }

    return `${optimisticExport}\n\nexport const ${optimisticName} = ${generatedOptimisticName};`;
  });

  return `
import { z } from 'zod';
import { useTransportAction, type ActionDefinition } from '${importPathToUseAction}';

// --- Shared Models ---
${namedTypesCode}

// --- Schemas ---
${argsDef}
${returnDef}

// --- Types ---
export type ${argsTypeName} = z.infer<typeof ${argsSchemaName}>;
export type ${returnTypeName} = z.infer<typeof ${returnSchemaName}>;
${schemaAndTypeAliases}

// --- Definition ---
export const ${defName}: ActionDefinition<${argsTypeName}, ${returnTypeName}> = {
  name: "${key}",
  ${appKey ? `appKey: '${appKey}',` : ""}
  description: "${impl.description || ""}",
  argsSchema: ${argsSchemaName},
  returnSchema: ${returnSchemaName},
  lockKeys: ${JSON.stringify((impl.locks || []).sort())},
};
${definitionAlias}

/**
 * ${impl.description}
 */
export const ${qualifiedHookName} = () => {
  return useTransportAction(${defName});
};
${qualifiedHookName !== hookName ? `
export const ${hookName} = ${qualifiedHookName};` : ""}

${optimisticExports.length > 0 ? `/** Optimistic state hooks for ${key} */` : ""}
${optimisticExports.join("\n")}




`;
};

export default function generateHooksPlugin(
  options: GenerateHooksPluginOptions = {},
): Plugin {
  const {
    schemaUrl,
    whitelist,
    blacklist,
    outputDir = OUTPUT_DIR,
    importPathToUseAction = IMPORT_PATH_TO_USE_ACTION,
    indexImportPathToUseAction = importPathToUseAction,
    appKey,
    hookNamePrefix,
    symbolPrefix = hookNamePrefix,
  } = options;

  return {
    name: "vite-plugin-generate-hooks",
    async buildStart() {
      if (!schemaUrl) return;

      try {
        const response = await fetch(schemaUrl);
        if (!response.ok) return;
        const schema = (await response.json()) as HooksSchema;

        if (!fs.existsSync(outputDir))
          fs.mkdirSync(outputDir, { recursive: true });
        fs.rmSync(outputDir, { recursive: true, force: true });
        fs.mkdirSync(outputDir, { recursive: true });

        const files: string[] = [];
        const generatedHooks: Array<{
          fileName: string;
          hookName: string;
          definitionName: string;
        }> = [];
        for (const [key, impl] of Object.entries(schema.implementations)) {
          if (!shouldGenerateHook(key, whitelist, blacklist)) {
            continue;
          }

          const code = generateContent(
            key,
            impl,
            importPathToUseAction,
            appKey,
            symbolPrefix,
          );
          const formatted = await prettier.format(code, {
            parser: "typescript",
            singleQuote: true,
            trailingComma: "all",
          });
          const hookFileName = toCamel(key);
          const hookName = toPascal(key);
          const definitionName = `${withSymbolPrefix(hookName, symbolPrefix)}Definition`;
          const fname = `${hookFileName}.ts`;
          fs.writeFileSync(path.join(outputDir, fname), formatted);
          files.push(hookFileName);
          generatedHooks.push({
            fileName: hookFileName,
            hookName,
            definitionName,
          });
        }

        const definitionImports = generatedHooks
          .map(
            ({ fileName, definitionName }) =>
              `import { ${definitionName} } from './${fileName}';`,
          )
          .join("\n");

        const definitionEntries = generatedHooks
          .map(({ hookName, definitionName }) => `  ${hookName}: ${definitionName},`)
          .join("\n");

        const index = `import type { ActionDefinition } from '${indexImportPathToUseAction}';
${definitionImports}

${files.map((f) => `export * from './${f}';`).join("\n")}

export const globalActionDefinition = {
${definitionEntries}
} satisfies Record<string, ActionDefinition<unknown, unknown>>;

export type GlobalActionDefinition = typeof globalActionDefinition;
// Backwards-compatible alias for the requested misspelling.
export const globalActionDefintiion = globalActionDefinition;
`;
        const formattedIndex = await prettier.format(index, {
          parser: "typescript",
          singleQuote: true,
          trailingComma: "all",
        });
        fs.writeFileSync(path.join(outputDir, "index.ts"), formattedIndex);
        console.log(
          `✅ [GenHooks] Generated definitions for ${files.length} actions.`,
        );
      } catch (error) {
        console.error(`❌ [GenHooks] Error:`, error);
      }
    },
  };
}
