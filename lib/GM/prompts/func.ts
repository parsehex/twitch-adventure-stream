import { differenceInMinutes, format, formatDistance } from 'date-fns';
import { useChatStore } from '@/stores/chat';
import { useGMStore } from '@/stores/gm';
import { useStreamStore } from '@/stores/stream';
import * as prompts from './str';

export const _2_5m = 150000;

// add notes depending on current state (relative to last state)
// - if there are more viewers, GM should acknowledge and encourage participation
// - recent messages should be acknowledged
export function createGMPrompt() {
	const gm = useGMStore();
	const stream = useStreamStore();

	const _15m = prompts.First15MinInstruct;
	const sysPrompt = prompts.InitialSysPrompt;
	let prompt = sysPrompt;
	const elapsed = Date.now() - stream.startedAtTS;
	const elapsedMinutes = Math.floor(elapsed / 60000);

	let instruct = '';
	if (elapsedMinutes < 15) {
		// prompt = prompt.replace('-INSTRUCT-', _15m);
		instruct = _15m;
	}

	// is intro25WaitStartedAt set?
	const intro25Elapsed = Date.now() - gm.intro25WaitStartedAt;
	// is >= 2.5m elapsed?
	console.log(gm.intro25WaitStartedAt, intro25Elapsed);
	if (elapsedMinutes < 15 && intro25Elapsed >= _2_5m) {
		if (elapsedMinutes <= 4) {
			instruct += '\n' + prompts._2_5mElapsedFirst;
			console.log('First 2.5m elapsed');
		} else {
			instruct += '\n' + prompts._2_5mElapsedSubsequent;
			console.log('Subsequent 2.5m elapsed');
		}
		if (elapsedMinutes < 15) {
			gm.intro25WaitStartedAt = Date.now();
		}
	} else if (elapsedMinutes < 15) {
		instruct += '\n' + prompts.IsChatting;
		console.log('Chatting');
	}
	console.log(instruct);

	prompt = prompt.replace('-INSTRUCT-', instruct);

	return prompt;
}

// - when there is no new chat activity, update latest state msg with new state
//   (rather than ballooning the message ctx)
export function createStateSnapshot() {
	const stream = useStreamStore();
	const twitchChat = useChatStore();

	let chatSnapshot = twitchChat.unseenMessages
		.map((msg) => {
			const diffInMinutes = differenceInMinutes(
				new Date(msg.createdAt),
				new Date(stream.startedAtTS)
			);
			const timeStr = format(new Date(1970, 0, 1, 0, diffInMinutes), 'HH:mm');
			return `${msg.username} (${timeStr}): ${msg.content}`;
		})
		.join('\n');
	if (!chatSnapshot) {
		chatSnapshot = '(No new messages)';
	} else {
		chatSnapshot = `Recent Messages:\n${chatSnapshot}`;
	}
	return `Viewers: ${stream.currentViewers}
Elapsed Time: ${stream.duration}

${chatSnapshot}`;

	// disjointed note: maybe when the GM does idle dialogue (i.e. no new messages) then we cycle/regenerate the latest GM message rather than extending the message chain
	//   can also reuse dialogue+tts once we generate a few (have chance to generate new one)
}
