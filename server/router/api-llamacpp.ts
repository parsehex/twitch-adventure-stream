import express from 'express';
import { llamacpp } from '../oai';
import { ChatCompletionMessageParam } from 'openai/resources/';

const llamacppRouter = express.Router();

const stop = [
	'<|eot_id|>',
	'USER:',
	'user:',
	'</s>',
	'<|end|>',
	'<|im_0|>',
	'<|im_end|>',
	'<|im_start|>',
];

llamacppRouter.post('/api/llamacpp/message', async (req, res) => {
	let { max_tokens, temperature, messages, seed } = req.body || {};
	// console.log(req.body);

	if (messages.length === 0) {
		res.status(400).send('No messages provided');
		return;
	}

	const aiResponse = await llamacpp.chat.completions.create({
		model: '',
		messages,
		max_tokens,
		temperature,
		seed,
		stop,
	});

	res.json({ message: aiResponse.choices[0].message });
});

llamacppRouter.post('/api/llamacpp/completion', async (req, res) => {
	const { prompt, max_tokens, temperature, json_schema, messages } = req.body;
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

	const aiResponse = await llamacpp.chat.completions.create({
		model: '',
		messages: messagesToPass,
		max_tokens,
		temperature,
		stop,
	});

	res.json({ message: aiResponse.choices[0].message });
});

export default llamacppRouter;
