import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ChatMessage } from '@/types/main';

export const useChatStore = defineStore('chat', () => {
	const messages = ref([] as ChatMessage[]);

	const seenMessages = computed(() =>
		messages.value.filter((message) => message.seen)
	);
	const unseenMessages = computed(() =>
		messages.value.filter((message) => !message.seen)
	);

	function append(message: ChatMessage) {
		messages.value.push(message);
	}
	function set(newMessages: ChatMessage[]) {
		messages.value = newMessages;
	}
	function setToSeen() {
		messages.value.forEach((message) => {
			message.seen = true;
		});
	}

	return {
		messages,

		seenMessages,
		unseenMessages,

		append,
		set,
		setToSeen,
	};
});
