import fs from 'fs-extra';
import express from 'express';

const sdRouter = express.Router();

sdRouter.options('/api/text-to-image');
sdRouter.post('/api/text-to-image', async (req, res) => {
	const { posPrompt, negPrompt } = req.body;

	try {
		const imgName = await textToImage(posPrompt, negPrompt);
		res.status(200).send(imgName);
	} catch (error) {
		res.status(500).send(error.message);
	}
});

export default sdRouter;

async function textToImage(posPrompt, negPrompt = 'blurry, bad') {
	if (!process.env.STABILITYAI_API_KEY) {
		throw new Error('STABILITYAI_API_KEY is not set');
	}

	const path =
		'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';

	const headers = {
		Accept: 'application/json',
		Authorization: 'Bearer ' + process.env.STABILITYAI_API_KEY,
		'Content-Type': 'application/json',
	};

	const body = {
		steps: 40,
		width: 1024,
		height: 1024,
		seed: 0,
		cfg_scale: 5,
		samples: 1,
		text_prompts: [
			{
				text: posPrompt,
				weight: 1,
			},
			{
				text: negPrompt,
				weight: -1,
			},
		],
	};

	const response = await fetch(path, {
		headers,
		method: 'POST',
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		throw new Error(`Non-200 response: ${await response.text()}`);
	}

	const responseJSON = await response.json();

	// responseJSON.artifacts.forEach((image, index) => {
	// 	fs.writeFileSync(
	// 		`./out/txt2img_${image.seed}.png`,
	// 		Buffer.from(image.base64, 'base64')
	// 	);
	// });

	await fs.ensureDir('./out');

	// only saving 1, lets return its name too
	const image = responseJSON.artifacts[0];
	fs.writeFileSync(
		`./out/txt2img_${image.seed}.png`,
		Buffer.from(image.base64, 'base64')
	);

	return `txt2img_${image.seed}.png`;
}
