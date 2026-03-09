import {
  useLock,
  type LockDefinition,
  type UseLockOptions,
} from '@/lib/rekuest/locks';

// --- Definition ---
export const IlluminationDefinition: LockDefinition<'illumination'> = {
  // Lock schema for illumination
  appKey: 'default',
  key: 'illumination',
};

/**
 * Hook to sync illumination
 */
export const useIlluminationLock = (options?: UseLockOptions) => {
  return useLock<'illumination'>(IlluminationDefinition, options);
};
