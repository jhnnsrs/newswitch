import fs from 'node:fs';
import path from 'node:path';
import prettier from 'prettier';
import type { Plugin } from 'vite';

// --- CONFIG ---
const OUTPUT_DIR = path.resolve(__dirname, '../src/hooks/generated');
const IMPORT_PATH_TO_USE_ACTION = '../../transport/useTransportAction';

// --- PLUGIN OPTIONS ---
export interface GenerateHooksPluginOptions {
  schemaUrl?: string;
}

interface ValidatorSchema {
  function: string;
  dependencies: string;
  errorMessage: string;
}

interface SchemaArg {
  key?: string;
  kind: string;
  nullable: boolean;
  identifier?: string;
  default?: any;
  children?: SchemaArg[];
  description?: string;
  validators?: ValidatorSchema[];
}

interface GeneratorContext {
  namedTypes: Map<string, { schema: string; description?: string }>;
}

const toCamel = (s: string) => s.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
const toPascal = (s: string) => {
  const c = toCamel(s);
  return c.charAt(0).toUpperCase() + c.slice(1);
};

/**
 * Helper to format JSDoc descriptions
 */
const renderDescription = (desc?: string) => {
  if (!desc) return '';
  return `/** ${desc} */\n`;
};

/**
 * Generates the .superRefine() block for a Zod object schema
 * based on the validators present in its children/fields.
 */
const appendValidators = (baseSchemaCode: string, fields: SchemaArg[]): string => {
  // Filter for fields that actually have validators
  const fieldsWithValidators = fields.filter(
    (c) => c.validators && c.validators.length > 0 && c.key
  );

  if (fieldsWithValidators.length === 0) {
    return baseSchemaCode;
  }

  // Generate the superRefine block
  const refinements = fieldsWithValidators
    .map((field) => {
      const fieldName = field.key!;
      
      return field.validators!.map((v) => {
        // Parse dependencies: "dep1, dep2" -> ['dep1', 'dep2']
        const deps = v.dependencies
          ? v.dependencies.split(',').map((s) => s.trim()).filter(Boolean)
          : [];

        // Build the context object: { self: val['myField'], dep1: val['dep1'] }
        // We use val['key'] notation to avoid issues if keys have special chars
        const contextProps = [
          `self: val['${fieldName}']`,
          ...deps.map((d) => `${d}: val['${d}']`),
        ].join(', ');

        return `
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type ValidatorFunc = (context: any) => boolean;
          const validatorFn: ValidatorFunc = ${v.function};
          const context = { ${contextProps} };
          
          if (!validatorFn(context)) {
            ctx.addIssue({
              code: "custom",
              message: ${JSON.stringify(v.errorMessage || 'Validation failed')},
              path: ['${fieldName}']
            });
          }
        }`;
      }).join('\n');
    })
    .join('\n');

  return `${baseSchemaCode}.superRefine((val, ctx) => {
    ${refinements}
  })`;
};

const mapToZod = (arg: SchemaArg, ctx: GeneratorContext): string => {
  let base = 'z.any()';

  if (arg.kind === 'MODEL' && arg.identifier && ctx.namedTypes.has(arg.identifier)) {
    base = `${toPascal(arg.identifier)}Schema`;
  } else {
    switch (arg.kind) {
      case 'FLOAT':
      case 'INT':
        base = 'z.number()';
        break;
      case 'BOOL':
        base = 'z.boolean()';
        break;
      case 'STRING':
        base = 'z.string()';
        break;
      case 'MEMORY_STRUCTURE':
        base = 'z.record(z.string(), z.any())';
        break;
      case 'LIST':
        if (arg.children?.[0]) {
          base = `z.array(${mapToZod(arg.children[0], ctx)})`;
        } else {
          base = 'z.array(z.any())';
        }
        break;
      case 'DICT':
        if (arg.children?.[0]) {
          base = `z.record(z.string(), ${mapToZod(arg.children[0], ctx)})`;
        } else {
          base = 'z.record(z.string(), z.any())';
        }
        break;
      case 'MODEL':
        const children = arg.children || [];

        // 1. Generate fields
        const fields = children
          .map((child) => {
            const desc = renderDescription(child.description);
            return `${desc}${child.key}: ${mapToZod(child, ctx)}`;
          })
          .join(',\n');

        // 2. Create Base Object
        let schemaCode = `z.object({\n${fields}\n})`;

        // 3. Append Validators (Refactored)
        schemaCode = appendValidators(schemaCode, children);

        if (arg.identifier) {
          ctx.namedTypes.set(arg.identifier, {
            schema: schemaCode,
            description: arg.description,
          });
          base = `${toPascal(arg.identifier)}Schema`;
        } else {
          base = schemaCode;
        }
        break;
      case 'UNION':
        if (arg.children && arg.children.length > 0) {
          const types = arg.children.map((child) => mapToZod(child, ctx));
          base = `z.union([${types.join(', ')}])`;
        } else {
          base = 'z.any()';
        }
        break;
      default:
        base = 'z.any()';
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
  optimistics? :Optimistic[];
}; 


const generateOptimisticState = (optimistic: Optimistic) => {
  return `
  export const Optimistic${toCamel(optimistic.state)} = {
    key: "${optimistic.state}",
    selector: (state: never) => ${optimistic.path.split('.').reduce((acc, part) => part && part != "" ? `${acc}.${part}` : acc, 'state')},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accessor: (state: any, args: any) => ${optimistic.accessor}
  };`;
}


const generateContent = (key: string, impl: Implementation) => {
  const ctx: GeneratorContext = { namedTypes: new Map() };

  const hookName = `use${toPascal(key)}`;
  const defName = `${toPascal(key)}Definition`;

  // --- ARGS SCHEMA GENERATION ---
  const argsList: SchemaArg[] = impl.definition.args || [];
  
  const argsFields = argsList
    .map((a) => `${renderDescription(a.description)}${a.key}: ${mapToZod(a, ctx)}`)
    .join(',\n');

  // Create base object for Args
  let argsSchemaCode = `z.object({\n${argsFields}\n})`;
  
  // Apply validators to the root Args object
  argsSchemaCode = appendValidators(argsSchemaCode, argsList);

  const argsSchemaName = `${toPascal(key)}ArgsSchema`;
  const argsDef = `export const ${argsSchemaName} = ${argsSchemaCode};`;

  // --- RETURN SCHEMA GENERATION ---
  const returnArg = impl.definition.returns?.[0];
  const returnSchemaName = `${toPascal(key)}ReturnSchema`;
  const returnDefString = returnArg ? mapToZod(returnArg, ctx) : 'z.void()';
  const returnDef = `export const ${returnSchemaName} = ${returnDefString};`;

  // --- NAMED TYPES ---
  const namedTypesCode = Array.from(ctx.namedTypes.entries())
    .map(([id, data]) => {
      const name = toPascal(id);
      return `
${renderDescription(data.description)}export const ${name}Schema = ${data.schema};
${renderDescription(data.description)}export type ${name} = z.infer<typeof ${name}Schema>;`;
    })
    .join('\n');

  return `
import { z } from 'zod';
import { useTransportAction, type ActionDefinition } from '${IMPORT_PATH_TO_USE_ACTION}';

// --- Shared Models ---
${namedTypesCode}

// --- Schemas ---
${argsDef}
${returnDef}

// --- Types ---
export type ${toPascal(key)}Args = z.infer<typeof ${argsSchemaName}>;
export type ${toPascal(key)}Return = z.infer<typeof ${returnSchemaName}>;

// --- Definition ---
export const ${defName}: ActionDefinition<${toPascal(key)}Args, ${toPascal(key)}Return> = {
  name: "${key}",
  description: "${impl.description || ''}",
  argsSchema: ${argsSchemaName},
  returnSchema: ${returnSchemaName},
  lockKeys: ${JSON.stringify((impl.locks || []).sort())},
};

/**
 * ${impl.description}
 */
export const ${hookName} = () => {
  return useTransportAction(${defName});
};

${(impl.optimistics || []).length > 0 ? `/** Optimistic state hooks for ${key} */` : ''}
${(impl.optimistics || []).map(generateOptimisticState).join('\n')}




`;

};

export default function generateHooksPlugin(options: GenerateHooksPluginOptions = {}): Plugin {
  const { schemaUrl } = options;

  return {
    name: 'vite-plugin-generate-hooks',
    async buildStart() {
      if (!schemaUrl) return;

      try {
        const response = await fetch(schemaUrl);
        if (!response.ok) return;
        const schema = await response.json();

        if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });

        const files: string[] = [];
        for (const [key, impl] of Object.entries(schema.implementations)) {
          const code = generateContent(key, impl);
          const formatted = await prettier.format(code, {
            parser: 'typescript',
            singleQuote: true,
            trailingComma: 'all',
          });
          const fname = `${toCamel(key)}.ts`;
          fs.writeFileSync(path.join(OUTPUT_DIR, fname), formatted);
          files.push(toCamel(key));
        }

        const index = files.map((f) => `export * from './${f}';`).join('\n');
        fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), index);
        console.log(`✅ [GenHooks] Generated definitions for ${files.length} actions.`);
      } catch (error) {
        console.error(`❌ [GenHooks] Error:`, error);
      }
    },
  };
}