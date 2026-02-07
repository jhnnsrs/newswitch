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

interface SchemaArg {
  key?: string;
  kind: string;
  nullable: boolean;
  identifier?: string;
  default?: any;
  children?: SchemaArg[];
  description?: string;
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

const mapToZod = (arg: SchemaArg, ctx: GeneratorContext): string => {
  let base = 'z.any()';

  if (arg.kind === 'MODEL' && arg.identifier && ctx.namedTypes.has(arg.identifier)) {
    base = `${toPascal(arg.identifier)}Schema`;
  } else {
    switch (arg.kind) {
      case 'FLOAT':
      case 'INT': base = 'z.number()'; break;
      case 'BOOL': base = 'z.boolean()'; break;
      case 'STRING': base = 'z.string()'; break;
      case 'MEMORY_STRUCTURE': base = 'z.record(z.string(), z.any())'; break;
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
        const fields = (arg.children || [])
          .map((child) => {
            const desc = renderDescription(child.description);
            return `${desc}${child.key}: ${mapToZod(child, ctx)}`;
          })
          .join(',\n');
        const schemaCode = `z.object({\n${fields}\n})`;
        
        if (arg.identifier) {
          ctx.namedTypes.set(arg.identifier, { 
            schema: schemaCode, 
            description: arg.description 
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

  // Attach description to the Zod schema itself via .describe()
  if (arg.description) {
    base = `${base}.describe(${JSON.stringify(arg.description)})`;
  }

  if (arg.nullable || (arg.default !== null && arg.default !== undefined)) {
    return `${base}.optional()`;
  }
  return base;
};

const generateContent = (key: string, impl: any) => {
  const ctx: GeneratorContext = { namedTypes: new Map() };
  
  const hookName = `use${toPascal(key)}`;
  const defName = `${toPascal(key)}Definition`;
  
  const argsFields = impl.definition.args.map((a: any) => 
    `${renderDescription(a.description)}${a.key}: ${mapToZod(a, ctx)}`
  ).join(',\n');
  
  const argsSchemaName = `${toPascal(key)}ArgsSchema`;
  const argsDef = `export const ${argsSchemaName} = z.object({\n${argsFields}\n});`;

  const returnArg = impl.definition.returns?.[0];
  const returnSchemaName = `${toPascal(key)}ReturnSchema`;
  const returnDefString = returnArg ? mapToZod(returnArg, ctx) : 'z.void()';
  const returnDef = `export const ${returnSchemaName} = ${returnDefString};`;

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
  lockKeys: ${JSON.stringify(impl.locks || [])},
};

/**
 * ${impl.description}
 */
export const ${hookName} = () => {
  return useTransportAction(${defName});
};`;
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
            trailingComma: 'all' 
          });
          const fname = `${toCamel(key)}.ts`;
          fs.writeFileSync(path.join(OUTPUT_DIR, fname), formatted);
          files.push(toCamel(key));
        }

        const index = files.map(f => `export * from './${f}';`).join('\n');
        fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), index);
        console.log(`✅ [GenHooks] Generated definitions for ${files.length} actions.`);
      } catch (error) {
        console.error(`❌ [GenHooks] Error:`, error);
      }
    },
  };
}