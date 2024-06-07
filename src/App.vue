<template>
	<header class="absolute">
		<h1 class="text-4xl font-bold select-none my-0 bg-gray-600 rounded-b px-1">
			Twitch
			<span style="color: #61dafb">Adventure</span>
			<span style="color: #111"> Game</span>
		</h1>
		<label>
			<!-- TTS -->
			<input type="checkbox" v-model="tts" class="m-2" />
		</label>

		<!-- input for stream start time -->
		<input type="time" v-model="stream.startedAt" class="m-2" />

		<!-- input for current viewers -->
		<input type="number" v-model="stream.currentViewers" class="m-2" />

		<Button class="m-2" @click="startStream">
			{{ interval ? 'Stop Stream' : 'Start Stream' }}
		</Button>

		<p class="text-sm text-gray-400">Stream Duration: {{ stream.duration }}</p>
	</header>

	<main
		class="inline-flex flex-col items-center justify-center w-full max-w-lg h-screen bg-gray-800"
	>
		<div
			class="flex flex-col items-center justify-end h-full p-4 pb-0 rounded-lg"
		>
			<div
				v-for="message in twitchChat.messages"
				:key="message.username + message.content.length"
				class="flex flex-col w-full"
			>
				<div
					class="whitespace-pre-line flex flex-col items-end justify-center w-full p-2 mb-1 bg-gray-700 rounded-lg"
				>
					<p class="text-sm text-gray-400">{{ message.content }}</p>
				</div>
			</div>
		</div>

		<div
			class="flex flex-col items-center justify-center w-full max-w-2xl p-4 pt-0"
		>
			<form
				@submit.prevent="doSubmit"
				class="flex flex-row items-center justify-center w-full"
			>
				<input
					v-model="input"
					type="text"
					class="w-full p-2 my-2 bg-gray-700 rounded-lg"
					placeholder="Type a message..."
					autoFocus
				/>
				<button type="submit" class="p-2 my-2 ml-2 bg-gray-700 rounded-lg">
					Send
				</button>
			</form>
		</div>

		<audio id="audio" class="hidden"></audio>
	</main>

	<!-- section showing current GM prompt -->
	<section
		class="fixed top-0 right-0 w-[350px] p-4 bg-gray-900 whitespace-pre-wrap"
	>
		<p class="text-sm text-gray-400">
			Game Maker ({{ gm.statusStr }}):<br />
			{{ gm.speech ? gm.speech : '' }}
		</p>
	</section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useChat } from 'ai/vue';
import { format, formatDistance, formatRelative, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { makeTTS } from '@/lib/tts';
import { completeMessages } from '@/lib/llm';
import { createGMPrompt, createStateSnapshot } from '@/lib/GM/prompts/func';
import * as gmPrompts from '@/lib/GM/prompts/str';
import { shouldProceed, TickInterval as gmTickInterval } from '@/lib/GM/utils';
import { useChatStore } from '@/stores/chat';
import { useGMStore } from '@/stores/gm';
import { useStreamStore } from '@/stores/stream';
import { ChatMessage } from '@/types/main';

const twitchChat = useChatStore();
const gm = useGMStore();
const stream = useStreamStore();

const tts = ref(false);

const starterMessages = ['hey whats up', 'what are we doing?'];

// new notes
// how about we pre-generate some introductory dialogues for the GM and cycle through those when there are no viewers
// when there are viewers, the GM talks to the viewers and encourages them to say something in the chat to start or progress the story
// we'll want to have a mechanism for auto-progressing the story if there's no activity, to make for _something_ to happen
// for the first 15m:
// - have automatic "suggestions" that get added to the story
//   - partially to demonstrate how you can interact with the stream
//   - partially to get/keep the story moving
//   - can be displayed on screen, or maybe submitted by a bot in chat
// - GM is mainly talking to introduce the stream/game and about any recent activity

// this is already implied, but to be more explicit: we'll have phases of the stream
// right now there are 2 -- intro and main
// intro is the first 15m, main is the rest
// we may/probably don't need to include other sections' whole thread in the context (perhaps a summary)

// lets say that we have a running summary during the intro phase
// suggestions will update the summary in a "yes, and" fashion
// the summary is kept on screen during intro
// heres a question: does the game maker use functions to do stuff?

// as far as layout:
//   in intro we can have GM (with its pic) in the middle,
//     summary on the right, chat on the left

// once 15m is up (at a natural break), GM moves to the right and image(s) show up prominently in the middle
// then GM starts taking suggestions from chat:
// - we do polling like we do now to react to new messages in batches
// - have a cutoff of like 5m of no new messages to do a forced progression
// - when we have some kind of progression, then take whatever the input is (chat or synthetic) and generate the response for GM and have the GM generate the input for the next progression
//   - another llm (something on openrouter) is actually generating the story from the input that GM gives
// - once next part of the story is generated, we can start generating and display:
//   - accompanying image(s)
//   - tts (narration and character dialogue eventually)
//   - next GM dialogue
// - a note: i think we should use a rolling context + rolling summary for the truncated ctx (for all llm usage probably)

// idea: GM has 2+ message threads that we maintain:
// - thread interacting with the chat
// - thread crafting the story (_possibly_ a one-off)
//   - perhaps we keep track of e.g. goals for the story and include those in an inner-monologue to improve quality

async function doSubmit() {
	twitchChat.append({
		username: 'user',
		content: input.value,
		createdAt: Date.now(),
	});

	input.value = '';
}

const input = ref('');

setInterval(() => {
	if (!stream.startedAtTS) return;
	const elapsed = Date.now() - stream.startedAtTS;
	const elapsedMinutes = Math.floor(elapsed / 60000);
	stream.duration = `${elapsedMinutes} minute${elapsedMinutes > 1 ? 's' : ''}`;
}, 1000);

gm.updateSysMessage(gmPrompts.InitialSysPrompt);

let interval: NodeJS.Timeout | null = null;

async function startStream() {
	if (!stream.startedAt) {
		// start stream (set interval)
		const now = new Date();
		const hours = now.getHours().toString().padStart(2, '0');
		const minutes = now.getMinutes().toString().padStart(2, '0');
		stream.startedAt = `${hours}:${minutes}`;
		stream.startedAtTS = now.getTime();
	} else {
		// set TS to the value of streamStartedAt (doesnt work)
		const [hours, minutes] = stream.startedAt.split(':');
		const now = new Date();
		now.setHours(parseInt(hours));
		now.setMinutes(parseInt(minutes));
		stream.startedAtTS = now.getTime();
	}

	interval = setInterval(tick, gmTickInterval);
}

// what does tick do:
// - (prevent running multiple instances of tick)
// - skip if we shouldnt proceed (from gm/utils)
// - update gm prompt + add state snapshot message
// - get response from llm, add to gm messages, set gm speech
// - if tts is enabled, generate tts and play it
//

(window as any).tickId = Math.random().toString(36).substring(7);
async function tick() {
	if ((window as any).tickId !== (window as any).tickId) {
		clearInterval(interval as NodeJS.Timeout);
		return;
	}
	if (!(await shouldProceed())) return;

	gm.isGenerating = true;

	// gm prompt derives a new system prompt from
	//   the current state of everything
	// - this is where we can implement phases
	const prompt = createGMPrompt();

	const stateSnapshot = createStateSnapshot();
	twitchChat.setToSeen();

	const sysMsg = {
		id: '0',
		role: 'system',
		content: prompt,
	};
	const stateMsg = {
		id: Math.random().toString(36).substring(7),
		role: 'user',
		content: stateSnapshot,
		tts: null,
	};

	const response = await completeMessages(
		[sysMsg, ...gm.messages.slice(1), stateMsg],
		{
			// type: 'openai',
			max: 256,
			temperature: 0.25,
		}
	);

	const aiMsg = {
		id: Math.random().toString(36).substring(7),
		role: 'assistant',
		content: response,
		tts: null,
	};
	gm.updateSysMessage(prompt);
	gm.append(stateMsg);
	gm.append(aiMsg);

	// for generating the next (or first) part of the story:
	//   run a one-off llm with the current thread for context with updated
	//   system prompt instructing to write the first/next part of the story

	// ^ result is used as input to write the next part of the story
	// the story is written as a growing thread of messages
	//   for completion, rolling summary is used but we keep the full context

	console.log('new msgs', gm.messages);

	gm.speech = response;

	if (!tts.value) {
		gm.isReading = false;
		gm.isGenerating = false;
		gm.waitStartedAt = Date.now();
		return;
	}

	const audio = document.getElementById('audio') as HTMLAudioElement;
	const ttsFile = await makeTTS(response);
	if (!ttsFile) return;
	aiMsg.tts = ttsFile;
	audio.src = ttsFile;
	audio.playbackRate = 1.25;
	audio.play();
	audio.onplay = () => {
		gm.isReading = true;
		gm.isGenerating = false;

		// TODO test: stringify and log gm messages to see if tts is there
		console.log(JSON.stringify(gm.messages));
	};
	audio.onended = () => {
		gm.isReading = false;
		gm.waitStartedAt = Date.now();
	};
}
</script>

<style>
/*  */
</style>
