import { differenceInMinutes, format, formatDistance } from 'date-fns';
import { useChatStore } from '@/stores/chat';
import { useGMStore } from '@/stores/gm';
import { useStreamStore } from '@/stores/stream';
import * as prompts from './str';

// add notes depending on current state (relative to last state)
// - if there are more viewers, GM should acknowledge and encourage participation
// - recent messages should be acknowledged
export function createGMPrompt() {
	const gm = useGMStore();
	const stream = useStreamStore();

	const _15m = prompts.First15MinInstruct;
	const sysPrompt = gm.sysMessage.content;
	let prompt = sysPrompt;
	const elapsed = Date.now() - stream.startedAtTS;
	const elapsedMinutes = Math.floor(elapsed / 60000);

	if (elapsedMinutes < 15) {
		prompt = prompt.replace('-INSTRUCT-', _15m);
	}

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
