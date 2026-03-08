import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import { createScopedStoreHooks } from "@/lib/rekuest/createScopedStore";

export interface ReplayState {
  revisions: number[];
  setRevisions: (revisions: number[]) => void;
  clearRevisions: () => void;
}

export const createReplayStore = () =>
  createStore<ReplayState>()(
    immer((set) => ({
      revisions: [],
      setRevisions: (revisions) => {
        set((state) => {
          state.revisions = revisions;
        });
      },
      clearRevisions: () => {
        set((state) => {
          state.revisions = [];
        });
      },
    })),
  );

const {
  StoreContext: ReplayStoreContext,
  useScopedStore: useReplayStore,
  useStoreApi: useReplayStoreApi,
} = createScopedStoreHooks<ReplayState>("ReplayStore");

export { ReplayStoreContext, useReplayStore, useReplayStoreApi };
