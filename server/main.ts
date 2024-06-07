import * as dotenv from 'dotenv';
dotenv.config();

import express, { json } from 'express';
import cors from 'cors';
import llamacppRouter from './router/api-llamacpp';
import openaiRouter from './router/api-openai';
import sdRouter from './router/sd';
import ttsRouter from './router/tts';

const app = express();
app.use(json());
app.use(cors());

app.use('/static', express.static('out'));

app.use(llamacppRouter);
app.use(openaiRouter);
app.use(sdRouter);
app.use(ttsRouter);

const PORT = +process.env.PORT || 3939;
app.listen(PORT, '0.0.0.0', () => {
	console.log(`Server is running on port ${PORT}`);
});
