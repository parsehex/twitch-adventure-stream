import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { LLMMessage } from '@/types/main';

export const useStoryStore = defineStore('story', () => {
	const isGenerating = ref(false);
	const messages = ref([
		{
			id: '0',
			role: 'system',
			content:
				'This should not be visible. If you see this, alert the developer in your response.',
		},
	] as LLMMessage[]);

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
		messages,

		sysMessage,

		append,
		set,
		updateSysMessage,
	};
});
