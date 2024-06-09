import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { LLMMessage } from '@/types/main';

export const useGMStore = defineStore('gm', () => {
	const isGenerating = ref(false);
	const isReading = ref(false);
	const waitStartedAt = ref(0);
	const speech = ref('');
	const intro25WaitStartedAt = ref(0);
	const messages = ref([
		{
			id: '0',
			role: 'system',
			content:
				'This should not be visible. If you see this, alert the developer in your response.',
		},
	] as LLMMessage[]);

	const currentIdeas = ref([] as string[]);

	const statusStr = computed(() => {
		if (isGenerating.value) return 'Generating...';
		if (isReading.value) return 'Reading...';
		if (waitStartedAt.value) return 'Waiting...';
		return 'Idle';
	});
	const sysMessage = computed(() => messages.value[0]);

	function append(message: LLMMessage) {
		messages.value.push(message);
	}
	function set(newMessages: LLMMessage[]) {
		messages.value = newMessages;
	}
	function updateSysMessage(newPrompt: string) {
		messages.value[0].content = newPrompt;
	}

	return {
		isGenerating,
		isReading,
		waitStartedAt,
		speech,
		intro25WaitStartedAt,
		messages,
		currentIdeas,

		statusStr,
		sysMessage,

		append,
		set,
		updateSysMessage,
	};
});
