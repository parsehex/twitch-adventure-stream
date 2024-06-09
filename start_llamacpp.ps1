& '.\venv\Scripts\activate.ps1'
python -m llama_cpp.server --host 0.0.0.0 --port 8080 --model 'F:/LLaMA/functionary-small-v2.5/functionary-small-v2.5.Q8_0.gguf' --chat_format functionary-v2 --hf_pretrained_model_name_or_path 'F:/LLaMA/functionary-small-v2.5' --n_gpu_layers 99
