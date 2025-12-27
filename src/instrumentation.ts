import { startCronScheduler } from './lib/cron-scheduler';

export function register() {
    if (process.env.NEXT_RUNTIME !== 'nodejs') {
        return;
    }

    startCronScheduler();
}
