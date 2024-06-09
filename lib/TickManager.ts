import { ref } from 'vue';

class TickEvent {
	constructor(
		public interval: number,
		public action: () => void,
		public immediate: boolean = false,
		public lastExecuted: number = Date.now()
	) {}

	shouldPerformAction(): boolean {
		return Date.now() - this.lastExecuted >= this.interval;
	}

	performAction(): void {
		this.action();
		this.lastExecuted = Date.now();
	}
}

(window as any).tickId = Math.random().toString(36).substring(7);
class TickManager {
	public running = ref(false);
	private events: TickEvent[] = [];
	private tickLoop: NodeJS.Timeout | null = null;
	private tickId: string | null = null;

	addEvent(event: TickEvent): void {
		this.events.push(event);
	}

	removeEvent(event: TickEvent): void {
		const index = this.events.indexOf(event);
		if (index > -1) {
			this.events.splice(index, 1);
		}
	}

	start(): void {
		if (this.tickLoop) {
			return; // Prevent multiple instances of the tick loop
		}

		this.tickId = (window as any).tickId;
		this.tickLoop = setInterval(() => {
			if (this.tickId !== (window as any).tickId) {
				// If the global tickId has changed, stop this tick loop
				this.stop();
				return;
			}

			for (const event of this.events) {
				if (event.shouldPerformAction()) {
					event.performAction();
				}
			}
		}, 1000);

		// Perform immediate actions
		for (const event of this.events) {
			if (event.immediate) {
				event.performAction();
			}
		}

		this.running.value = true;
	}

	stop(): void {
		if (this.tickLoop) {
			clearInterval(this.tickLoop);
			this.tickLoop = null;
			this.running.value = false;
		}
	}
}

export { TickManager, TickEvent };
