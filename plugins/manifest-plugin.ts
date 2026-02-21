import { type Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

interface HookManifestOptions {
  /** Path to the folder containing your generated hooks */
  hooksDir: string;
  /** Name of the output file. Default: 'blok.json' */
  outDir?: string;
}

export function ViteHookManifest(options: HookManifestOptions): Plugin {
  const { hooksDir, outDir = 'blok.json' } = options;
  const importedHooks = new Set<string>();

  return {
    name: 'vite-plugin-hook-manifest',
    apply: 'build', // Only executes during production builds

    // This hook is called for every module Rollup decides to include in the graph
    moduleParsed(moduleInfo) {
      const normalizedHooksPath = path.resolve(hooksDir);
      
      // Check if the module being parsed is located within your hooks directory
      if (moduleInfo.id.startsWith(normalizedHooksPath)) {
        // Extract the filename (e.g., useUserQuery.ts)
        const fileName = path.basename(moduleInfo.id);
        // Remove extension to get the hook name
        const hookName = fileName.replace(/\.[jt]sx?$/, '');
        importedHooks.add(hookName);
      }
    },

    // Runs after the bundle is written to the disk
    writeBundle() {
      const manifestPath = path.resolve(process.cwd(), outDir);
      const packagePath = path.resolve(process.cwd(), 'package.json');
      let packageData: Record<string, unknown> = {};

      try {
        packageData = JSON.parse(fs.readFileSync(packagePath, 'utf-8')) as Record<string, unknown>;
      } catch {
        packageData = {};
      }

      const scripts = (packageData.scripts as Record<string, string> | undefined) ?? {};
      
      const manifest = {
        generatedAt: new Date().toISOString(),
        app: {
          name: (packageData.name as string | undefined) ?? 'unknown',
          version: (packageData.version as string | undefined) ?? '0.0.0',
          description: (packageData.description as string | undefined) ?? '',
          startPage: (packageData.homepage as string | undefined) ?? '/index.html',
          type: (packageData.type as string | undefined) ?? 'unknown',
          scripts: {
            dev: scripts.dev ?? '',
            build: scripts.build ?? '',
            preview: scripts.preview ?? '',
          },
        },
        dependencies: Array.from(importedHooks).sort()
      };

      try {
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`\n\x1b[32m✓ Hook manifest created: ${outDir} (${importedHooks.size} hooks used)\x1b[0m`);
      } catch (err) {
        console.error('\x1b[31m[vite-plugin-hook-manifest] Failed to write manifest:\x1b[0m', err);
      }
    }
  };
}