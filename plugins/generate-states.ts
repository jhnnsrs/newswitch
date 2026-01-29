import fs from 'node:fs';
import path from 'node:path';
import prettier from 'prettier';
import type { Plugin } from 'vite';

// --- CONFIG ---
const OUTPUT_DIR = path.resolve(__dirname, '../src/hooks/states');   // Output folder
const IMPORT_PATH_TO_SYNC = '../useStateSync';                    // Relative path

// --- PLUGIN OPTIONS ---
export interface GenerateStatesPluginOptions {
  /** URL to fetch the states schema from */
  schemaUrl?: string;
}

// --- HELPER TYPES ---
interface Port {
  key: string;
  kind: string;
  nullable: boolean;
  default?: any;
}

// --- ZOD MAPPING ---
const mapToZod = (port: Port): string => {
  let base = 'z.any()';
  switch (port.kind) {
    case 'FLOAT':
    case 'INT': base = 'z.number()'; break;
    case 'BOOL': base = 'z.boolean()'; break;
    case 'STRING': base = 'z.string()'; break;
    // Add logic for nested structures if needed (LIST, MEMORY_STRUCTURE)
  }
  
  if (port.nullable) return `${base}.nullable()`;
  return base;
};

const mapToTS = (port: Port): string => {
  switch (port.kind) {
    case 'FLOAT':
    case 'INT': return 'number';
    case 'BOOL': return 'boolean';
    case 'STRING': return 'string';
    default: return 'any';
  }
};

const toCamel = (s: string) => s.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
const toPascal = (s: string) => { const c = toCamel(s); return c.charAt(0).toUpperCase() + c.slice(1); };

// --- CONTENT GENERATOR ---
const generateContent = (key: string, stateDef: any) => {
  const hookName = `use${toPascal(key)}`; // useStageState
  const schemaName = `${toPascal(key)}Schema`;
  const typeName = `${toPascal(key)}`;      // StageState (Type)
  const defName = `${toPascal(key)}Definition`;

  // 1. Generate Zod Schema fields from 'ports'
  const fields = stateDef.ports.map((p: Port) => 
    `  ${p.key}: ${mapToZod(p)}`
  ).join(',\n');
  
  const schemaCode = `export const ${schemaName} = z.object({\n${fields}\n});`;

  return `
import { z } from 'zod';
import { useStateSync, type StateDefinition, type UseStateSyncOptions } from '${IMPORT_PATH_TO_SYNC}';

// --- Schema ---
${schemaCode}

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
export const ${hookName} = (options?: UseStateSyncOptions) => {
  return useStateSync<${typeName}>(${defName}, options);
};`;
};

// --- VITE PLUGIN ---
export default function generateStatesPlugin(options: GenerateStatesPluginOptions = {}): Plugin {
  const { schemaUrl } = options;
  
  return {
    name: 'vite-plugin-generate-states',
    async buildStart() {
      if (!schemaUrl) {
        console.warn('⚠️ [GenStates] No schemaUrl provided, skipping state hook generation.');
        return;
      }
      
      let schema: any;
      try {
        const response = await fetch(schemaUrl);
        if (!response.ok) {
          console.error(`❌ [GenStates] Failed to fetch schema from ${schemaUrl}: ${response.status}`);
          return;
        }
        schema = await response.json();
      } catch (error) {
        console.error(`❌ [GenStates] Error fetching schema from ${schemaUrl}:`, error);
        return;
      }
      
      if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

      const files: string[] = [];
      
      // Iterate over the "states" object in your schema
      for (const [key, stateDef] of Object.entries(schema.states)) {
        const code = generateContent(key, stateDef);
        const formatted = await prettier.format(code, { parser: 'typescript' });
        
        // File name: StageState.ts
        const fname = `${toPascal(key)}.ts`;
        fs.writeFileSync(path.join(OUTPUT_DIR, fname), formatted);
        files.push(toPascal(key)); // store for index.ts
      }

      // Generate Barrel file
      const index = files.map(f => `export * from './${f}';`).join('\n');
      fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), index);
      
      console.log(`✅ [GenStates] Generated ${files.length} state hooks from ${schemaUrl}`);
    },
  };
}