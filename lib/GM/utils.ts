import { useStreamStore } from '@/stores/stream';
import { useChatStore } from '@/stores/chat';
import { useGMStore } from '@/stores/gm';

export const TickInterval = 2500;
export const WaitInterval = 7500;

export async function shouldProceed(): Promise<boolean> {
	const gm = useGMStore();
	const stream = useStreamStore();

	if (stream.currentViewers === 0) {
		// console.log('skip tick: no viewers');
		return;
	}
	if (gm.isGenerating) {
		// console.log('skip tick: GM is generating');
		return;
	}
	if (gm.isReading) {
		// console.log('skip tick: GM is reading');
		return;
	}

	// is gm waiting?
	// wait for 5s before prompting GM again
	if (gm.waitStartedAt) {
		const elapsed = Date.now() - gm.waitStartedAt;
		if (elapsed < WaitInterval) {
			// console.log('skip tick: GM is waiting');
			return;
		}
		gm.waitStartedAt = 0; // reset
	}

	return true;
}
