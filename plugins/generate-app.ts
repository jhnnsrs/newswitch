import fs from "node:fs";
import path from "node:path";
import prettier from "prettier";
import type { Plugin } from "vite";
import generateHooksPlugin from "./generate-hooks";
import generateLocksPlugin from "./generate-locks";
import generateStatesPlugin from "./generate-states";

const SRC_DIR = path.resolve(__dirname, "../src");
const DEFAULT_APPS_DIR = path.resolve(SRC_DIR, "apps");

const toPascal = (value: string) =>
  value
    .replace(/(^\w|[-_\s](\w))/g, (_, first: string, next?: string) =>
      (next ?? first).toUpperCase(),
    )
    .replaceAll("-", "")
    .replaceAll("_", "")
    .replaceAll(" ", "");

const normalizeOptionalString = (value?: string) => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
};

export interface GenerateAppPluginOptions {
  key?: string;
  name?: string;
  hooksSchemaUrl?: string;
  statesSchemaUrl?: string;
  locksSchemaUrl?: string;
  hooksWhitelist?: string[];
  hooksBlacklist?: string[];
  statesWhitelist?: string[];
  statesBlacklist?: string[];
  locksWhitelist?: string[];
  locksBlacklist?: string[];
}

export interface GenerateAppsPluginOptions {
  apps: GenerateAppPluginOptions[];
  baseDir?: string;
  rekuestImportPath?: string;
}

interface NormalizedGenerateAppPluginOptions extends GenerateAppPluginOptions {
  key: string;
  name?: string;
  symbolPrefix?: string;
}

const DEFAULT_APP_KEY = "default";
const DEFAULT_REKUEST_IMPORT_PATH = '@/lib/rekuest';

const buildTaskHookContent = (
  appKey: string,
  symbolPrefix: string | undefined,
  hookName: 'Cancel' | 'Pause' | 'Resume' | 'Step',
  rekuestImportPath: string,
) => {
  const qualifiedHookName = `use${symbolPrefix ?? ''}${hookName}Task`;
  const baseHookName = `use${hookName}AppTask`;

  const aliasExport = symbolPrefix
    ? `\nexport const use${hookName}Task = ${qualifiedHookName};\n`
    : '';

  return `
import { ${baseHookName} } from '${rekuestImportPath}/task';

export const ${qualifiedHookName} = () => ${baseHookName}('${appKey}');${aliasExport}`;
};

const buildTaskStoreHookContent = (
  appKey: string,
  symbolPrefix: string | undefined,
  rekuestImportPath: string,
) => {
  const qualifiedHookName = `use${symbolPrefix ?? ''}TaskStore`;

  const aliasExport = symbolPrefix
    ? `\nexport const useTaskStore = ${qualifiedHookName};\n`
    : '';

  return `
import { useTaskStore as useBaseTaskStore, type TaskStore } from '${rekuestImportPath}/task';

export const ${qualifiedHookName} = <TSelected>(
  selector: (state: TaskStore) => TSelected,
): TSelected => useBaseTaskStore('${appKey}', selector);${aliasExport}`;
};

const buildStateStoreHookContent = (
  appKey: string,
  symbolPrefix: string | undefined,
  rekuestImportPath: string,
) => {
  const qualifiedHookName = `use${symbolPrefix ?? ''}StateStore`;

  const aliasExport = symbolPrefix
    ? `\nexport const useStateStore = ${qualifiedHookName};\n`
    : '';

  return `
import { useGlobalStateStore as useBaseStateStore, type GlobalStateStore } from '${rekuestImportPath}/state';

export const ${qualifiedHookName} = <TSelected>(
  selector: (state: GlobalStateStore) => TSelected,
): TSelected => useBaseStateStore('${appKey}', selector);${aliasExport}`;
};

const buildLockStoreHookContent = (
  appKey: string,
  symbolPrefix: string | undefined,
  rekuestImportPath: string,
) => {
  const qualifiedHookName = `use${symbolPrefix ?? ''}LockStore`;

  const aliasExport = symbolPrefix
    ? `\nexport const useLockStore = ${qualifiedHookName};\n`
    : '';

  return `
import { useLockStore as useBaseLockStore, type LockStore } from '${rekuestImportPath}/locks';

export const ${qualifiedHookName} = <TSelected>(
  selector: (state: LockStore) => TSelected,
): TSelected => useBaseLockStore('${appKey}', selector);${aliasExport}`;
};

const ensureCleanDir = (dirPath: string) => {
  fs.rmSync(dirPath, { force: true, recursive: true });
  fs.mkdirSync(dirPath, { recursive: true });
};

const formatAndWrite = async (filePath: string, content: string) => {
  const formatted = await prettier.format(content, {
    parser: "typescript",
    singleQuote: true,
    trailingComma: "all",
  });

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, formatted);
};

const invokeBuildStart = async (
  hook: Plugin["buildStart"],
  context: unknown,
) => {
  if (!hook) {
    return;
  }

  if (typeof hook === "function") {
    await hook.call(context as never, {} as never);
    return;
  }

  if ("handler" in hook) {
    await hook.handler.call(context as never, {} as never);
  }
};

const normalizeApps = (
  apps: GenerateAppPluginOptions[],
): NormalizedGenerateAppPluginOptions[] => {
  const normalizedApps = apps.map((app, index) => {
    const explicitKey = normalizeOptionalString(app.key);
    const legacyName = normalizeOptionalString(app.name);
    const key = explicitKey ?? legacyName;

    if (!key) {
      throw new Error(
        `App at index ${index} must define a "key" or a legacy "name".`,
      );
    }

    const normalizedName = explicitKey ? legacyName : undefined;
    const symbolPrefix =
      key === DEFAULT_APP_KEY ? undefined : normalizeOptionalString(toPascal(key));

    return {
      ...app,
      key,
      name: normalizedName,
      symbolPrefix,
    };
  });

  const seenKeys = new Map<string, string>();
  const seenNames = new Map<string, string>();
  const seenPrefixes = new Map<string, string>();

  for (const app of normalizedApps) {
    if (seenKeys.has(app.key)) {
      throw new Error(
        `Duplicate app key "${app.key}" found for apps "${seenKeys.get(app.key)}" and "${app.key}".`,
      );
    }
    seenKeys.set(app.key, app.key);

    if (app.name) {
      if (seenNames.has(app.name)) {
        throw new Error(
          `Duplicate app name "${app.name}" found for app keys "${seenNames.get(app.name)}" and "${app.key}".`,
        );
      }
      seenNames.set(app.name, app.key);
    }

    if (app.symbolPrefix) {
      if (seenPrefixes.has(app.symbolPrefix)) {
        throw new Error(
          `Duplicate app prefix "${app.symbolPrefix}" generated from app keys for app keys "${seenPrefixes.get(app.symbolPrefix)}" and "${app.key}".`,
        );
      }
      seenPrefixes.set(app.symbolPrefix, app.key);
    }
  }

  return normalizedApps;
};


export default function generateAppsPlugin(
  options: GenerateAppsPluginOptions,
): Plugin {
  const normalizedApps = normalizeApps(options.apps);
  const appsDir = options.baseDir ? path.resolve(options.baseDir) : DEFAULT_APPS_DIR;
  const rekuestImportPath =
    options.rekuestImportPath ?? DEFAULT_REKUEST_IMPORT_PATH;


  return {
    name: "vite-plugin-generate-apps",
    async buildStart() {
      ensureCleanDir(appsDir);

      for (const app of normalizedApps) {
        const appRootDir = path.resolve(appsDir, app.key);
        const appHooksDir = path.resolve(appRootDir, "hooks");
        const appActionsDir = path.resolve(appHooksDir, "actions");
        const appStatesDir = path.resolve(appHooksDir, "states");
        const appLocksDir = path.resolve(appHooksDir, "locks");

        ensureCleanDir(appHooksDir);

        const hooksPlugin = generateHooksPlugin({
          schemaUrl: app.hooksSchemaUrl,
          whitelist: app.hooksWhitelist,
          blacklist: app.hooksBlacklist,
          outputDir: appActionsDir,
          importPathToUseAction: `${rekuestImportPath}/task`,
          indexImportPathToUseAction: `${rekuestImportPath}/task`,
          appKey: app.key,
          symbolPrefix: app.symbolPrefix,
        });
        const statesPlugin = generateStatesPlugin({
          schemaUrl: app.statesSchemaUrl,
          whitelist: app.statesWhitelist,
          blacklist: app.statesBlacklist,
          outputDir: appStatesDir,
          importPathToSync: `${rekuestImportPath}/state`,
          appKey: app.key,
          symbolPrefix: app.symbolPrefix,
        });
        const locksPlugin = generateLocksPlugin({
          schemaUrl: app.locksSchemaUrl,
          whitelist: app.locksWhitelist,
          blacklist: app.locksBlacklist,
          outputDir: appLocksDir,
          importPathToSync: `${rekuestImportPath}/locks`,
          appKey: app.key,
          symbolPrefix: app.symbolPrefix,
        });

        await invokeBuildStart(hooksPlugin.buildStart, this);
        await invokeBuildStart(statesPlugin.buildStart, this);
        await invokeBuildStart(locksPlugin.buildStart, this);


        await formatAndWrite(
          path.resolve(appHooksDir, 'useCancelTask.ts'),
          buildTaskHookContent(
            app.key,
            app.symbolPrefix,
            'Cancel',
            rekuestImportPath,
          ),
        );

        await formatAndWrite(
          path.resolve(appHooksDir, 'usePauseTask.ts'),
          buildTaskHookContent(
            app.key,
            app.symbolPrefix,
            'Pause',
            rekuestImportPath,
          ),
        );

        await formatAndWrite(
          path.resolve(appHooksDir, 'useResumeTask.ts'),
          buildTaskHookContent(
            app.key,
            app.symbolPrefix,
            'Resume',
            rekuestImportPath,
          ),
        );

        await formatAndWrite(
          path.resolve(appHooksDir, 'useStepTask.ts'),
          buildTaskHookContent(
            app.key,
            app.symbolPrefix,
            'Step',
            rekuestImportPath,
          ),
        );

        await formatAndWrite(
          path.resolve(appHooksDir, 'useTaskStore.ts'),
          buildTaskStoreHookContent(
            app.key,
            app.symbolPrefix,
            rekuestImportPath,
          ),
        );

        await formatAndWrite(
          path.resolve(appHooksDir, 'useStateStore.ts'),
          buildStateStoreHookContent(
            app.key,
            app.symbolPrefix,
            rekuestImportPath,
          ),
        );

        await formatAndWrite(
          path.resolve(appHooksDir, 'useLockStore.ts'),
          buildLockStoreHookContent(
            app.key,
            app.symbolPrefix,
            rekuestImportPath,
          ),
        );

        await formatAndWrite(
          path.resolve(appRootDir, "app.ts"),
          `
import {
  globalActionDefinition,
  type GlobalActionDefinition,
} from './hooks/actions';
import {
  globalLockDefinition,
  type GlobalLockDefinition,
} from './hooks/locks';
import {
  globalStateDefinition,
  type GlobalStateDefinition,
} from './hooks/states';

export interface AppDefinition<TAppKey extends string = string> {
  key: TAppKey;
  actions: GlobalActionDefinition;
  locks: GlobalLockDefinition;
  states: GlobalStateDefinition;
}

export const appDefinition = {
  key: '${app.key}',
  actions: globalActionDefinition,
  locks: globalLockDefinition,
  states: globalStateDefinition,
} satisfies AppDefinition<'${app.key}'>;
`,
        );
    }

      const appImports = normalizedApps
        .map(
          (app) =>
            `import { appDefinition as ${toPascal(app.key)}AppDefinition } from './${app.key}/app';`,
        )
        .join("\n");

      const appEntries = normalizedApps
        .map((app) => `  ${JSON.stringify(app.key)}: ${toPascal(app.key)}AppDefinition,`)
        .join("\n");

      await formatAndWrite(
        path.resolve(appsDir, "index.ts"),
        `
${appImports}

export const appsDefinition = {
${appEntries}
} as const;

export type AppsDefinition = typeof appsDefinition;
export type AppKey = keyof AppsDefinition;
export type AppDefinition = AppsDefinition[AppKey];
`,
      );

      
    },
  };
}
