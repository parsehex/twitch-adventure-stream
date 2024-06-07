type T = 'llamacpp' | 'openai' | 'openrouter';
type D = 'completion' | 'message';

interface CompletionOptions {
	type?: T;
	max?: number;
	temperature?: number;
}

function makeUrl(type: T = 'llamacpp', dest: D = 'completion') {
	return `http://192.168.0.217:3939/api/${type}/${dest}`;
}

/** Run a one-off prompt (defaults to `llamacpp`) */
export async function complete(
	prompt: string,
	{ type, max = 128, temperature = 0.05 }: CompletionOptions = {}
): Promise<string> {
	const messagesToComplete = [
		{
			role: 'system',
			content:
				"Assistant's task is to answer the following immediately and without further prose.",
		},
		{
			role: 'user',
			content: prompt,
		},
		{
			role: 'assistant',
			content: 'Response: ',
		},
	];
	const payload = {
		messages: messagesToComplete,
		max_tokens: max,
		temperature,
	};

	const url = makeUrl(type, 'completion');
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});
	const data = await response.json();
	return data.message.content;
}

interface MessagesCompleteOptions {
	type?: T;
	max?: number;
	temperature?: number;
}

interface Message {
	id?: string;
	role: string;
	content: string;
}
/** Run a chat thread (defaults to `llamacpp`) */
export async function completeMessages(
	messages: Message[],
	{ type, max = 128, temperature = 0.25 }: MessagesCompleteOptions = {}
): Promise<string> {
	const payload = {
		messages,
		max_tokens: max,
		temperature,
	};

	const url = makeUrl(type, 'message');
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});
	const data = await response.json();
	return data.message.content;
}
