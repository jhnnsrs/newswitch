import fs from 'node:fs';
import path from 'node:path';
import prettier from 'prettier';
import type { Plugin } from 'vite';

// --- CONFIG ---
const OUTPUT_DIR = path.resolve(__dirname, '../src/hooks/generated');
const IMPORT_PATH_TO_USE_ACTION = '../../transport/useTransportAction'; // Relative path from generated file to useAction

// --- PLUGIN OPTIONS ---
export interface GenerateHooksPluginOptions {
  /** URL to fetch the implementation schema from */
  schemaUrl?: string;
}

// --- HELPERS (Same as before) ---
interface SchemaArg {
  key?: string;
  kind: string;
  nullable: boolean;
  default?: any;
  children?: SchemaArg[];
  description?: string;
}

const mapToZod = (arg: SchemaArg): string => {
  let base = 'z.any()';
  switch (arg.kind) {
    case 'FLOAT':
    case 'INT': base = 'z.number()'; break;
    case 'BOOL': base = 'z.boolean()'; break;
    case 'STRING': base = 'z.string()'; break;
    case 'MEMORY_STRUCTURE': base = 'z.record(z.string(), z.any())'; break;
    case 'LIST': 
      const child = arg.children?.[0];
      base = `z.array(${child ? mapToZod(child) : 'z.any()'})`; 
      break;
  }
  if (arg.nullable || (arg.default !== null && arg.default !== undefined)) {
    return `${base}.optional()`;
  }
  return base;
};

const toCamel = (s: string) => s.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
const toPascal = (s: string) => { const c = toCamel(s); return c.charAt(0).toUpperCase() + c.slice(1); };

// --- CONTENT GENERATOR ---
const generateContent = (key: string, impl: any) => {
  const hookName = `use${toPascal(key)}`;
  const defName = `${toPascal(key)}Definition`;
  const argsSchemaName = `${toPascal(key)}ArgsSchema`;
  const returnSchemaName = `${toPascal(key)}ReturnSchema`;
  
  const argsType = `${toPascal(key)}Args`;
  const returnType = `${toPascal(key)}Return`;

  // 1. Generate Input Schema
  const argsFields = impl.args.map((a: any) => `  ${a.key}: ${mapToZod(a)}`).join(',\n');
  const argsDef = `export const ${argsSchemaName} = z.object({\n${argsFields}\n});`;

  // 2. Generate Return Schema
  const returnArg = impl.returns?.[0];
  const returnDefString = returnArg ? mapToZod(returnArg) : 'z.void()';
  const returnDef = `export const ${returnSchemaName} = ${returnDefString};`;

  return `
import { z } from 'zod';
import { useTransportAction, type ActionDefinition } from '${IMPORT_PATH_TO_USE_ACTION}';

// --- Schemas ---
${argsDef}
${returnDef}

// --- Types ---
export type ${argsType} = z.infer<typeof ${argsSchemaName}>;
export type ${returnType} = z.infer<typeof ${returnSchemaName}>;

// --- Definition ---
export const ${defName}: ActionDefinition<${argsType}, ${returnType}> = {
  name: "${key}",
  description: "${impl.description || ''}",
  argsSchema: ${argsSchemaName},
  returnSchema: ${returnSchemaName},
};

/**
 * ${impl.description}
 */
export const ${hookName} = () => {
  return useTransportAction(${defName});
};`;
};

// --- VITE PLUGIN EXPORT ---
export default function generateHooksPlugin(options: GenerateHooksPluginOptions = {}): Plugin {
  const { schemaUrl } = options;
  
  return {
    name: 'vite-plugin-generate-hooks',
    async buildStart() {
      if (!schemaUrl) {
        console.warn('⚠️ [GenHooks] No schemaUrl provided, skipping hook generation.');
        return;
      }
      
      let schema: any;
      try {
        const response = await fetch(schemaUrl);
        if (!response.ok) {
          console.error(`❌ [GenHooks] Failed to fetch schema from ${schemaUrl}: ${response.status}`);
          return;
        }
        schema = await response.json();
      } catch (error) {
        console.error(`❌ [GenHooks] Error fetching schema from ${schemaUrl}:`, error);
        return;
      }
      
      if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

      const files: string[] = [];
      for (const [key, impl] of Object.entries(schema.implementations)) {
        const code = generateContent(key, impl);
        const formatted = await prettier.format(code, { parser: 'typescript' });
        const fname = `${toCamel(key)}.ts`;
        fs.writeFileSync(path.join(OUTPUT_DIR, fname), formatted);
        files.push(toCamel(key));
      }

      const index = files.map(f => `export * from './${f}';`).join('\n');
      fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), index);
      console.log(`✅ [GenHooks] Generated definitions for ${files.length} actions from ${schemaUrl}`);
    },
  };
}