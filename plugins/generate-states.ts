import fs from 'node:fs';
import path from 'node:path';
import prettier from 'prettier';
import type { Plugin } from 'vite';

// --- CONFIG ---
const SCHEMA_FILE = path.resolve(__dirname, '../state_schema.json'); // Adjust path
const OUTPUT_DIR = path.resolve(__dirname, '../src/hooks/states');   // Output folder
const IMPORT_PATH_TO_SYNC = '../useStateSync';                    // Relative path

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
import { useStateSync, type StateDefinition } from '${IMPORT_PATH_TO_SYNC}';

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
export const ${hookName} = () => {
  return useStateSync<${typeName}>(${defName});
};`;
};

// --- VITE PLUGIN ---
export default function generateStatesPlugin(): Plugin {
  return {
    name: 'vite-plugin-generate-states',
    async buildStart() {
      if (!fs.existsSync(SCHEMA_FILE)) return;
      const schema = JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf-8'));
      
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
      
      console.log(`✅ [GenStates] Generated ${files.length} state hooks.`);
    },
    handleHotUpdate({ file, server }) {
      if (file === SCHEMA_FILE) {
        this.buildStart?.call(this as any, {} as any);
        server.ws.send({ type: 'full-reload' });
      }
    }
  };
}