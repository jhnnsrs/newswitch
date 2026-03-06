import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  createSelectionStore,
  SelectionStoreContext,
} from "./imageStore";
import {
  createKubeStateStore,
  KubeStateStoreContext,
} from "./kubeStateStore";
import { createKubeStore, KubeStoreContext } from "./kubeStore";
import { createModeStore, ModeStoreContext } from "./modeStore";
import { createScansStore, ScansStoreContext } from "./scansStore";
import {
  createGlobalStateStore,
  GlobalStateStoreContext,
} from "./stateStore";
import { createTimeStore, TimeStoreContext } from "./timeStore";
import {
  createTransportStore,
  TransportStoreContext,
} from "./transportStore";
import { createViewStore, ViewStoreContext } from "./viewStore";
import { createViewerStore, ViewerStoreContext } from "./viewerStore";

export interface AppStoreBundle {
  globalStateStore: ReturnType<typeof createGlobalStateStore>;
  transportStore: ReturnType<typeof createTransportStore>;
  modeStore: ReturnType<typeof createModeStore>;
  viewStore: ReturnType<typeof createViewStore>;
  viewerStore: ReturnType<typeof createViewerStore>;
  scansStore: ReturnType<typeof createScansStore>;
  kubeStore: ReturnType<typeof createKubeStore>;
  kubeStateStore: ReturnType<typeof createKubeStateStore>;
  selectionStore: ReturnType<typeof createSelectionStore>;
  timeStore: ReturnType<typeof createTimeStore>;
}

function createAppStoreBundle(): AppStoreBundle {
  return {
    globalStateStore: createGlobalStateStore(),
    transportStore: createTransportStore(),
    modeStore: createModeStore(),
    viewStore: createViewStore(),
    viewerStore: createViewerStore(),
    scansStore: createScansStore(),
    kubeStore: createKubeStore(),
    kubeStateStore: createKubeStateStore(),
    selectionStore: createSelectionStore(),
    timeStore: createTimeStore(),
  };
}

const scopedBundles = new Map<string, AppStoreBundle>();

function getScopedBundle(scope: string): AppStoreBundle {
  const existingBundle = scopedBundles.get(scope);

  if (existingBundle) {
    return existingBundle;
  }

  const nextBundle = createAppStoreBundle();
  scopedBundles.set(scope, nextBundle);
  return nextBundle;
}

interface StoreProviderProps {
  children: ReactNode;
  scope?: string;
}

export function StoreProvider({
  children,
  scope = "default",
}: StoreProviderProps) {
  const stores = useMemo(() => getScopedBundle(scope), [scope]);

  return (
    <GlobalStateStoreContext.Provider value={stores.globalStateStore}>
      <TransportStoreContext.Provider value={stores.transportStore}>
        <ModeStoreContext.Provider value={stores.modeStore}>
          <ViewStoreContext.Provider value={stores.viewStore}>
            <ViewerStoreContext.Provider value={stores.viewerStore}>
              <ScansStoreContext.Provider value={stores.scansStore}>
                <KubeStoreContext.Provider value={stores.kubeStore}>
                  <KubeStateStoreContext.Provider value={stores.kubeStateStore}>
                    <SelectionStoreContext.Provider value={stores.selectionStore}>
                      <TimeStoreContext.Provider value={stores.timeStore}>
                        {children}
                      </TimeStoreContext.Provider>
                    </SelectionStoreContext.Provider>
                  </KubeStateStoreContext.Provider>
                </KubeStoreContext.Provider>
              </ScansStoreContext.Provider>
            </ViewerStoreContext.Provider>
          </ViewStoreContext.Provider>
        </ModeStoreContext.Provider>
      </TransportStoreContext.Provider>
    </GlobalStateStoreContext.Provider>
  );
}
