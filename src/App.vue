<template>
	<header class="absolute">
		<h1 class="text-4xl font-bold select-none my-0 bg-gray-600 rounded-b px-1">
			Twitch
			<span style="color: #61dafb">Adventure</span>
			<span style="color: #111"> Game</span>
		</h1>
		<label>
			<input type="checkbox" v-model="tts" class="m-2" />
		</label>

		<input type="time" v-model="stream.startedAt" class="m-2" />

		<input type="number" v-model="stream.currentViewers" class="m-2" />

		<Button class="m-2" @click="startStream">
			{{ tickMan.running.value ? 'Stop Stream' : 'Start Stream' }}
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

	<!-- idea: gm has array of `ideas` from chat which are displayed and used for prompting -->
	<!-- <section
		class="fixed top-0 w-[350px] p-4 bg-gray-900 whitespace-pre-wrap"
		v-if="gm.currentIdeas.length"
	>
		<p class="text-sm text-gray-400">
			Current Ideas:
			<ul>
				<li v-for="idea in gm.currentIdeas" :key="idea">
					{{ idea }}
				</li>
			</ul>
		</p>
	</section> -->

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
import { Mic } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useChat } from 'ai/vue';
import { format, formatDistance, formatRelative, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { makeTTS } from '@/lib/tts';
import { completeMessages } from '@/lib/llm';
import { createGMPrompt, createStateSnapshot } from '@/lib/GM/prompts/func';
import * as gmPrompts from '@/lib/GM/prompts/str';
import {
	shouldProceed,
	TickInterval as gmTickInterval,
	getAvailableFunctions,
} from '@/lib/GM/utils';
import { useChatStore } from '@/stores/chat';
import { useGMStore } from '@/stores/gm';
import { useStreamStore } from '@/stores/stream';
import { ChatMessage } from '@/types/main';
import { TickManager, TickEvent } from '@/lib/TickManager';

// mic icon (with pulse) when Reading
// spinner when Generating

class Story {
	parts: string[] = [];
	partInputs: string[] = []; // maybe unnecessary

	writeFirstPart(input: string) {
		this.partInputs.push(input);

		// prompt to write the first part of the story
	}

	// reviseFirstPart
	//
	// writeNextPart
}

const twitchChat = useChatStore();
const gm = useGMStore();
const stream = useStreamStore();

const tickMan = new TickManager();

const tts = ref(false);

async function doSubmit() {
	twitchChat.append({
		username: 'user',
		content: input.value,
		createdAt: Date.now(),
	});

	input.value = '';
}

const input = ref('');

const durationUpdate = new TickEvent(
	60_000,
	() => {
		if (!stream.startedAtTS) return;
		// e.g. "00:03" (3 minutes)

		const elapsed = Date.now() - stream.startedAtTS;
		const minutes = Math.floor(elapsed / 60000);
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		stream.duration = `${hours.toString().padStart(2, '0')}:${mins
			.toString()
			.padStart(2, '0')}`;
	},
	true
);
tickMan.addEvent(durationUpdate);

gm.updateSysMessage(gmPrompts.InitialSysPrompt);

let resume = false;

async function startStream() {
	if (tickMan.running.value) {
		tickMan.stop();
		return;
	}

	if (resume) {
		tickMan.start();
		return;
	}

	const now = new Date();
	if (!stream.startedAt) {
		// start stream (set interval)
		const hours = now.getHours().toString().padStart(2, '0');
		const minutes = now.getMinutes().toString().padStart(2, '0');
		stream.startedAt = `${hours}:${minutes}`;
		stream.startedAtTS = now.getTime();
	} else {
		// set TS to the value of streamStartedAt (doesnt work)
		const [hours, minutes] = stream.startedAt.split(':');
		now.setHours(parseInt(hours));
		now.setMinutes(parseInt(minutes));
		stream.startedAtTS = now.getTime();
	}

	// interval = setInterval(tick, gmTickInterval);
	tickMan.start();
	gm.intro25WaitStartedAt = now.getTime();
	resume = true;
}

// what does tick do:
// - skip if we shouldnt proceed (from gm/utils)
// - update gm prompt + add state snapshot message
// - get response from llm, add to gm messages, set gm speech
// - if tts is enabled, generate tts and play it
//

async function tick() {
	if (!(await shouldProceed())) return;

	gm.isGenerating = true;

	// gm should manage currentIdeas array between writing phases
	// when does it make sense to do that?
	//
	// how about before dialogue, include "GM updated ideas list" in latest state message
	// should mention that he updated the list
	//
	// how about: have llm respond with function call every time
	//   have "message" function to talk to audience
	//   "update_ideas" function to update the ideas list
	//   "message" is required once for each turn

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
			type: 'openrouter',
			max: 256,
			temperature: 0.25,
			tools: getAvailableFunctions(),
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
	//   we could do an inner monologue with the input and the whole story to try to bridge the gap of missing context at the cost of more latency

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
const tickEv = new TickEvent(gmTickInterval, tick);
tickMan.addEvent(tickEv);
</script>

<style>
/*  */
</style>
