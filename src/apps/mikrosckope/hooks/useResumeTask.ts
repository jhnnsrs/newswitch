import { useResumeAppTask } from '@/lib/rekuest/task';

export const useMikrosckopeResumeTask = () => useResumeAppTask('mikrosckope');
export const useResumeTask = useMikrosckopeResumeTask;
