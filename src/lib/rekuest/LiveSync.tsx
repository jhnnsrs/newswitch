import type { AppKey } from './types';
import { useEffect } from 'react';
import { useLockContext } from './locks';
import { useStateContext } from './state';
import { useTaskContext } from './task';

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
  const stateContext = useStateContext();
  const taskContext = useTaskContext();
  const lockContext = useLockContext();

  useEffect(() => {
    if (!subscribeState) {
      return;
    }

    void stateContext.goLive(appKey);

    return () => {
      void stateContext.stopLive(appKey);
    };
  }, [appKey, stateContext, subscribeState]);

  useEffect(() => {
    if (!subscribeTask) {
      return;
    }

    void taskContext.goLive(appKey);

    return () => {
      void taskContext.stopLive(appKey);
    };
  }, [appKey, subscribeTask, taskContext]);

  useEffect(() => {
    if (!subscribeLock) {
      return;
    }

    void lockContext.goLive(appKey);

    return () => {
      void lockContext.stopLive(appKey);
    };
  }, [appKey, lockContext, subscribeLock]);

  return null;
}