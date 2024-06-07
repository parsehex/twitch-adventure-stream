<template>
	<header class="">
		<h1
			class="w-full text-4xl font-bold select-none my-0 bg-gray-600 rounded-b px-1"
		>
			Twitch
			<span style="color: #61dafb">Adventure</span>
			<span style="color: #111"> Game</span>
			<Button @click="nextMessage" class="rounded-lg">Next</Button>
			<Button @click="autoSend" class="rounded-lg">Auto</Button>
			<Button @click="createStory" class="rounded-lg">Create Story</Button>
			<Button @click="writeImagePrompt" class="rounded-lg">Image Prompt</Button>
			<Button @click="makeImage" class="rounded-lg">Make Image</Button>
		</h1>
	</header>
	<div class="flex">
		<!-- simple chat interface -->
		<div class="inline-flex flex-col h-screen min-w-1/4 max-w-1/4">
			<div class="flex-1 overflow-y-auto mb-4" id="chat">
				<div v-for="message in chatMessages" :key="message.id">
					<!-- <div class="flex justify-start">
						<div class="bg-gray-200 p-2 m-2 rounded-lg">
							{{ message.role }}
						</div>
					</div> -->
					<div class="flex justify-end">
						<div class="bg-gray-300 p-2 m-2 rounded-lg">
							{{ message.content }}
						</div>
					</div>
				</div>
			</div>
			<!-- <div class="flex justify-between p-2">
				<input
					v-model="input"
					@keyup.enter="handleSubmit"
					class="flex-1 p-2 rounded-lg"
					placeholder="Type your message here..."
				/>
				<Button @click="handleSubmit" class="rounded-lg">Send</Button>
			</div> -->
		</div>

		<p
			class="text-lg inline-block whitespace-pre-line max-w-2/4 px-4"
			v-if="story"
		>
			Story:
			<br />
			{{ story }}
		</p>
		<p
			class="text-lg inline-block whitespace-pre-line max-w-2/4 px-4"
			v-if="imagePrompt"
		>
			Image Prompt:
			<br />
			{{ imagePrompt }}
		</p>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useChat } from 'ai/vue';
import { complete } from '../lib/llm';
import { Button } from '../components/ui/button';

const story = ref('');
const imagePrompt = ref('');

const scrollToBottom = () => {
	const chat = document.getElementById('chat');
	if (chat) {
		chat.scrollTop = chat.scrollHeight;
	}
};

const initialMessages = [
	{
		id: '0',
		role: 'system',
		content: `The following is a simulated Twitch chat. Assistant's task is to write a typical chat message from a Twitch stream viewer at each turn.

The stream is titled "Twitch Adventure Game". Chat messages add to an evolving story that takes place over text, images and narration on the stream.

The story starts with nothing and it is up to the viewers to create the content by chatting.`,
	},
];

const {
	messages,
	input,
	handleSubmit,
	setMessages,
	reload,
	isLoading,
	append,
} = useChat({
	sendExtraMessageFields: true,
	initialMessages: initialMessages as any,
	api: 'http://192.168.0.217:3939/api/message',
	onFinish: async () => {
		scrollToBottom();
	},
	onError: (e) => {
		console.log(e);
	},
});

const chatMessages = computed(() => {
	return messages.value.filter((m) => m.role === 'assistant');
});

const prods = ['Next message:', 'Write the next message:', 'Next:'];
const nextMessage = () => {
	const prod = prods[Math.floor(Math.random() * prods.length)];
	append({
		role: 'user',
		content: prod,
	});
};

const autoSend = () => {
	const delay = Math.floor(Math.random() * 5000) + 1500;
	setTimeout(() => {
		nextMessage();
		autoSend();
	}, delay);
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createStory = async () => {
	if (chatMessages.value.length < 5) {
		return;
	}

	let chat = '';
	for (let i = 0; i < chatMessages.value.length; i++) {
		chat += chatMessages.value[i].content + '\n';
	}

	const prompt = `The following is a Twitch chat. Assistant's task is to write a story based on the chat messages.

Chat:
${chat}`;
	let res = await complete(prompt, {
		temperature: 0.5,
		max: 512,
	});

	await delay(10);
	console.log(prompt);
	console.log(res);
	if (res) {
		res = res.trim();

		// doesnt end with punctuation? truncate after last newline
		if (!res.endsWith('.') && !res.endsWith('!') && !res.endsWith('?')) {
			const lastNewline = res.lastIndexOf('\n');
			if (lastNewline !== -1) {
				res = res.substring(0, lastNewline);
				console.log('Truncated after last newline');
			}
		}

		story.value = res;
	}
};

const writeImagePrompt = async () => {
	if (!story.value) {
		return;
	}

	const prompt = `The following is a story. Assistant's task is to write a prompt for an image conveying the current state of the story.

Story:
${story.value}`;
	const res = await complete(prompt, {
		temperature: 0.5,
		max: 512,
	});

	await delay(10);
	console.log(prompt);
	console.log(res);
	if (res) {
		imagePrompt.value = res;
	}
};

async function makeImage() {
	if (!imagePrompt.value) {
		return;
	}

	const prompt = imagePrompt.value;
	const res = await fetch('http://192.168.0.217:3939/api/text-to-image', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ posPrompt: prompt }),
	});
	const data = await res.text();
	console.log(data);
}
</script>

<style>
/*  */
</style>
