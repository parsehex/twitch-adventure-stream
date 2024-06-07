import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useStreamStore = defineStore('stream', () => {
	const currentViewers = ref(0);
	const startedAt = ref('');
	const startedAtTS = ref(0);
	const duration = ref('');

	return {
		currentViewers,
		startedAt,
		startedAtTS,
		duration,
	};
});
