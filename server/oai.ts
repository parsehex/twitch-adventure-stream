import OpenAI from 'openai';

export const llamacpp = new OpenAI({
	baseURL: 'http://192.168.0.217:8080/v1/',
	apiKey: 'sk-1234',
});

export const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export const openrouter = new OpenAI({
	baseURL: 'https://openrouter.ai/api/v1',
	apiKey: process.env.OPENROUTER_API_KEY,
});
