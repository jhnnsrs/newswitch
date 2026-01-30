import fs from 'node:fs';
import path from 'node:path';
import prettier from 'prettier';
import type { Plugin } from 'vite';

// --- CONFIG ---
const OUTPUT_DIR = path.resolve(__dirname, '../src/hooks/locks');   // Output folder
const IMPORT_PATH_TO_SYNC = '../useLockSync';                    // Relative path

// --- PLUGIN OPTIONS ---
export interface GenerateStatesPluginOptions {
  /** URL to fetch the states schema from */
  schemaUrl?: string;
}



const toCamel = (s: string) => s.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
const toPascal = (s: string) => { const c = toCamel(s); return c.charAt(0).toUpperCase() + c.slice(1); };

// --- CONTENT GENERATOR ---
const generateContent = (key: string, stateDef: any) => {
  const hookName = `use${toPascal(key)}Lock`; // useStageState
  const typeName = `${toPascal(key)}`;      // StageState (Type)
  const defName = `${toPascal(key)}Definition`;


  return `
import { useLockSync, type LockDefinition, type UseLockSyncOptions} from '${IMPORT_PATH_TO_SYNC}';


// --- Definition ---
export const ${defName}: LockDefinition<"${key}"> = {
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
export default function generateLocksPlugin(options: GenerateStatesPluginOptions = {}): Plugin {
  const { schemaUrl } = options;

  console.log('Generate Locks Plugin initialized with schemaUrl:', schemaUrl);
  
  return {
    name: 'vite-plugin-generate-locks',
    async buildStart() {
      if (!schemaUrl) {
        console.warn('⚠️ [GenStates] No schemaUrl provided, skipping state hook generation.');
        return;
      }

      console.log(`🔄 [GenLocks] Fetching schema from ${schemaUrl}...`);
      
      let schema;
      try {
        const response = await fetch(schemaUrl);
        if (!response.ok) {
          console.error(`❌ [GenLocks] Failed to fetch schema from ${schemaUrl}: ${response.status}`);
          return;
        }
        schema = await response.json();
      } catch (error) {
        console.error(`❌ [GenLocks] Error fetching schema from ${schemaUrl}:`, error);
        return;
      }
      
      if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

      const files: string[] = [];

      
      // Iterate over the "states" object in your schema
      for (const [key, stateDef] of Object.entries(schema.locks)) {
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
      
      console.log(`✅ [GenLocks] Generated ${files.length} lock hooks from ${schemaUrl}`);
    },
  };
}