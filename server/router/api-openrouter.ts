import express from 'express';
import { openrouter } from '../oai';
import { ChatCompletionMessageParam } from 'openai/resources';

const DefaultModel = 'meta-llama/llama-3-70b-instruct';

const openrouterRouter = express.Router();

openrouterRouter.post('/api/openrouter/message', async (req, res) => {
	let {
		max_tokens,
		temperature,
		messages,
		seed,
		model = DefaultModel,
	} = req.body || {};

	if (messages.length === 0) {
		res.status(400).send('No messages provided');
		return;
	}

	const aiResponse = await openrouter.chat.completions.create({
		model,
		messages,
		max_tokens,
		temperature,
		seed,
	});

	res.json({ message: aiResponse.choices[0].message });
});

openrouterRouter.post('/api/openrouter/completion', async (req, res) => {
	const {
		prompt,
		max_tokens,
		temperature,
		json_schema,
		messages,
		model = DefaultModel,
	} = req.body;
	// console.log(req.body);

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

	let messagesToPass = messagesToComplete as ChatCompletionMessageParam[];

	if (messages) {
		messagesToPass = messages.slice();
		// set the first/system message to prompt
		messagesToPass[0].content = prompt;
	}

	const aiResponse = await openrouter.chat.completions.create({
		model,
		messages: messagesToPass,
		max_tokens,
		temperature,
	});

	res.json({ message: aiResponse.choices[0].message });
});

export default openrouterRouter;
