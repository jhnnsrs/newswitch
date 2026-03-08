import { usePauseAppTask } from '@/lib/rekuest/task';

export const useMikrosckopePauseTask = () => usePauseAppTask('mikrosckope');
export const usePauseTask = useMikrosckopePauseTask;
