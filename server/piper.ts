import path from 'path';
import fs from 'fs-extra';
import { execFile } from 'child_process';
import stream from 'stream';

const model = 'F:\\TTS-Piper\\en_US-hfc_male-medium.onnx';

export async function runPiper(output: string, text: string): Promise<string> {
	// piper.exe should be at ../piper/piper.exe
	const piperPath = path.resolve(__dirname, '../piper-tts/piper.exe');
	return new Promise((resolve, reject) => {
		// echo "Test" | .\piper.exe --model .\model.onnx --output_file ./out.wav
		const args = [
			'--model',
			model,
			'--output_file',
			output,
			'--sentence_silence',
			'0.3',
		];

		console.info('Piper Path:', piperPath);
		console.info('Running Piper:', args);
		const command = execFile(piperPath, args, (error, stdout, stderr) => {
			if (error) {
				console.error(`Piper exError: ${error.message}`);
				reject(error);
			} else {
				console.log(stdout);
				console.log(stderr);
			}
		});

		const input = text;

		var stdinStream = new stream.Readable();
		stdinStream.push(input); // Add data to the internal queue for users of the stream to consume
		stdinStream.push(null); // Signals the end of the stream (EOF)
		stdinStream.pipe(command.stdin as any);

		command.on('error', (error) => {
			console.error(`Piper onError: ${error.message}`);
			reject(error);
		});

		command.on('exit', (code, signal) => {
			if (code) console.info(`Piper Process exited with code: ${code}`);
			if (signal) console.info(`Piper Process killed with signal: ${signal}`);
			resolve(output);
		});

		command.stdout?.on('data', (data: any) => {
			const str = data.toString();
			console.log('Piper stdout:', str);
		});

		process.on('exit', () => {
			command.kill();
		});
	});
}
