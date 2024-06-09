@REM C:\Users\User\Code\GitHub\BuddyGenAI\binaries\cuda12\llamacpp-server.exe --model "C:\Users\User\BuddyGen Models\Meta-Llama-3-8B-Instruct-Q8_0.gguf" -ngl 99 --chat-template llama3 --host 0.0.0.0

RUN .\venv\Scripts\activate.bat

@REM python3 -m llama_cpp.server --model <model_path_to_functionary_v2_model> --chat_format functionary-v2 --hf_pretrained_model_name_or_path <model_path_to_functionary_v2_tokenizer>

@REM model="F:\LLaMA\functionary-small-v2.5\functionary-small-v2.5.Q4_0.gguf"
@REM tokenizer="F:\LLaMA\functionary-small-v2.5"

python3 -m llama_cpp.server --model 'F:\LLaMA\functionary-small-v2.5\functionary-small-v2.5.Q4_0.gguf' --chat_format functionary-v2 --hf_pretrained_model_name_or_path 'F:\LLaMA\functionary-small-v2.5'
