/** calls api to generate and save TTS which returns name of file which we can play */
export async function makeTTS(text: string, good = false): Promise<string> {
	// POST /api/tts with {text, voice}
	const response = await fetch('http://192.168.0.217:3939/api/tts', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ text, voice: 'alloy', good }),
	});
	const file = await response.text();
	return file;
}
