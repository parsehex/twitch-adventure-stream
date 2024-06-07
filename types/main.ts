export interface ChatMessage {
	username: string;
	content: string;
	createdAt: number;
	seen?: boolean;
}

export interface LLMMessage {
	id: string;
	role: string;
	content: string;
	tts: string | null;
}
