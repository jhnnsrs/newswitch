import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import generateAppsPlugin from "./plugins/generate-app";
import { ViteHookManifest } from "./plugins/manifest-plugin";

type AppConfigInput = {
  key?: string;
  name?: string;
  hooksSchemaUrl?: string;
  statesSchemaUrl?: string;
  locksSchemaUrl?: string;
};

type NormalizedAppConfig = {
  key: string;
  name?: string;
  hooksSchemaUrl?: string;
  statesSchemaUrl?: string;
  locksSchemaUrl?: string;
};

function normalizeAppConfig(
  entry: string | AppConfigInput,
  defaults: Omit<NormalizedAppConfig, "key" | "name">,
): NormalizedAppConfig {
  if (typeof entry === "string") {
    return {
      key: entry.trim(),
      ...defaults,
    };
  }

  const explicitKey = entry.key?.trim();
  const legacyName = entry.name?.trim();
  const key = explicitKey || legacyName;

  if (!key) {
    throw new Error('Each app config must define a "key" or a legacy "name".');
  }

  return {
    ...defaults,
    ...entry,
    key,
    name: explicitKey ? legacyName : undefined,
  };
}

function parseApps(env: Record<string, string>): NormalizedAppConfig[] {
  const raw = env.VITE_APPS?.trim();
  const defaults = {
    hooksSchemaUrl: env.VITE_SCHEMA_IMPLEMENTATION_URL,
    statesSchemaUrl: env.VITE_SCHEMA_STATES_URL,
    locksSchemaUrl: env.VITE_SCHEMA_LOCKS_URL,
  };

  if (!raw) {
    return [
      {
        key: env.VITE_APP_KEY || env.VITE_APP_NAME || "default",
        name: env.VITE_APP_KEY ? env.VITE_APP_NAME : undefined,
        ...defaults,
      },
    ];
  }

  try {
    const parsed = JSON.parse(raw) as Array<string | AppConfigInput>;

    return parsed.map((entry) => normalizeAppConfig(entry, defaults));
  } catch {
    return raw
      .split(",")
      .map((name) => normalizeAppConfig(name, defaults));
  }
}
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), "");
  const apps = parseApps(env);
  const defaultApp = env.VITE_DEFAULT_APP || apps[0]?.key || "default";

  return {
    plugins: [
      react(),
      generateAppsPlugin({
        apps: [
          {
            key: "default",
            hooksSchemaUrl: env.VITE_SCHEMA_IMPLEMENTATION_URL,
            statesSchemaUrl: env.VITE_SCHEMA_STATES_URL,
            locksSchemaUrl: env.VITE_SCHEMA_LOCKS_URL,
          },
          {
            name: "mikrosckope",
            hooksSchemaUrl: env.VITE_SCHEMA_IMPLEMENTATION_URL,
            statesSchemaUrl: env.VITE_SCHEMA_STATES_URL,
            locksSchemaUrl: env.VITE_SCHEMA_LOCKS_URL,
          },
        ],
        baseDir: env.VITE_APPS_DIR || "apps",
        defaultApp,
        rekuestImportPath: env.VITE_REKUEST_IMPORT_PATH || "@/lib/rekuest",
      }),
      tailwindcss(),
      ViteHookManifest({
        hooksDir: `src/apps/${defaultApp}/hooks/actions`,
        outDir: "blok.json", // Optional: custom name/location
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
