import type { AppKey } from './types';
import { LockWebSocketSync } from './syncs/LockWebSocketSync';
import { StateWebSocketSync } from './syncs/StateWebSocketSync';
import { TaskWebSocketSync } from './syncs/TaskWebSocketSync';

export interface LiveSyncProps {
  appKey: AppKey;
  subscribeState?: boolean;
  subscribeLock?: boolean;
  subscribeTask?: boolean;
}

export function LiveSync({
  appKey,
  subscribeState = true,
  subscribeLock = true,
  subscribeTask = true,
}: LiveSyncProps) {
  if (!subscribeState && !subscribeLock && !subscribeTask) {
    return null;
  }

  return (
    <>
      {subscribeTask ? <TaskWebSocketSync appKey={appKey} /> : null}
      {subscribeState ? <StateWebSocketSync appKey={appKey} /> : null}
      {subscribeLock ? <LockWebSocketSync appKey={appKey} /> : null}
    </>
  );
}