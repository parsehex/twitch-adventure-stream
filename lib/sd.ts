export async function makeImage(prompt: string) {
	const res = await fetch('http://192.168.0.217:3939/api/text-to-image', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ posPrompt: prompt }),
	});
	const data = await res.text();
	return data;
}
