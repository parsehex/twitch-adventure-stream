// from chatgpt

import { createMachine, interpret, assign } from 'xstate';

// Define the context type
interface GameMasterContext {
	viewers: number;
	timeSinceLastMessage: number;
	prompt: string;
}

// Define the events
type GameMasterEvent =
	| { type: 'NEW_VIEWER'; count: number }
	| { type: 'MESSAGE_RECEIVED'; time: number }
	| { type: 'GENERATE_PROMPT' };

// Define the state machine
const gameMasterMachine = createMachine<GameMasterContext, GameMasterEvent>({
	id: 'gameMaster',
	initial: 'waiting',
	context: {
		viewers: 0,
		timeSinceLastMessage: 0,
		prompt: '',
	},
	states: {
		waiting: {
			on: {
				NEW_VIEWER: {
					actions: assign({
						viewers: (context, event) => event.count,
					}),
				},
				MESSAGE_RECEIVED: {
					actions: assign({
						timeSinceLastMessage: (context, event) => event.time,
					}),
				},
				GENERATE_PROMPT: 'generatingPrompt',
			},
		},
		generatingPrompt: {
			invoke: {
				id: 'generatePrompt',
				src: (context) => generatePrompt(context),
				onDone: {
					target: 'waiting',
					actions: assign({ prompt: (context, event) => event.data }),
				},
				onError: {
					target: 'waiting',
					actions: (context, event) => console.error(event.data),
				},
			},
		},
	},
});

// Function to generate a prompt based on the context
async function generatePrompt(context: GameMasterContext): Promise<string> {
	const { viewers, timeSinceLastMessage } = context;
	let prompt = 'Welcome to the game!';
	if (viewers > 10) {
		prompt += ` We have ${viewers} viewers!`;
	}
	if (timeSinceLastMessage > 300) {
		prompt += ` It's been a while since we heard from you. Any questions?`;
	}
	// Simulate an async operation, like calling an AI service
	return new Promise((resolve) => setTimeout(() => resolve(prompt), 1000));
}

// Create an interpreter instance
const gameMasterService = interpret(gameMasterMachine).start();

// Function to simulate events
function simulateEvents() {
	setTimeout(
		() => gameMasterService.send({ type: 'NEW_VIEWER', count: 15 }),
		1000
	); // New viewers
	setTimeout(
		() => gameMasterService.send({ type: 'MESSAGE_RECEIVED', time: 400 }),
		2000
	); // Message received
	setTimeout(() => gameMasterService.send({ type: 'GENERATE_PROMPT' }), 3000); // Generate prompt
}

// Start simulating events
simulateEvents();

// Listen for state transitions
gameMasterService.onTransition((state) => {
	if (state.changed) {
		console.log('Current State:', state.value);
		console.log('Context:', state.context);
	}
});
