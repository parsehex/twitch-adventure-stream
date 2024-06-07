import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	resolve: {
		alias: {
			'@/components': path.resolve(__dirname, './components/'),
			'@/lib': path.resolve(__dirname, './lib/'),
			'@/stores': path.resolve(__dirname, './stores/'),
			'@/types': path.resolve(__dirname, './types/'),
		},
	},
	plugins: [vue()],
	base: '/',
});
