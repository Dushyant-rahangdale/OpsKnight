import { mergeConfig, defineConfig } from 'vitest/config';
import baseConfig from './vitest.config';

export default mergeConfig(baseConfig, defineConfig({
    test: {
        include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
        exclude: [
            'tests/integration/**',
            'tests/e2e/**',
            'node_modules/**',
            'dist/**',
            '.next/**'
        ],
        environment: 'jsdom',
        setupFiles: ['./tests/setup.ts'],
    },
}));
