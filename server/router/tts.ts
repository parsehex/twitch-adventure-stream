import express from 'express';
import fs from 'fs-extra';
import OpenAI from 'openai';
import { runPiper } from '../piper';

if (!process.env.OPENAI_API_KEY) {
	throw new Error('OPENAI_API_KEY is not set');
}

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

const ttsRouter = express.Router();

ttsRouter.post('/api/tts', async (req, res) => {
	let { text, voice, good } = req.body || {};

	if (!good) {
		// use piper tts
		const speechFile = Date.now() + '.wav';
		await runPiper('./out/' + speechFile, text);
		return res
			.status(200)
			.send('http://192.168.0.217:3939/static/' + speechFile);
	}

	const mp3 = await openai.audio.speech.create({
		model: 'tts-1',
		voice: voice,
		input: text,
	});
	const buffer = Buffer.from(await mp3.arrayBuffer());
	const speechFile = `${Date.now()}.mp3`;
	await fs.writeFile('./out/' + speechFile, buffer);

	res.status(200).send('http://192.168.0.217:3939/static/' + speechFile);
});

export default ttsRouter;
