import { useCancelAppTask } from '@/lib/rekuest/task';

export const useMikrosckopeCancelTask = () => useCancelAppTask('mikrosckope');
export const useCancelTask = useMikrosckopeCancelTask;
