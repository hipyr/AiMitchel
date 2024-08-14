import torch
import json
from TTS.api import TTS

# Load the response data
with open('response.json') as response:
    data = json.load(response)

print("Response loaded getting ready to run TTS")


device = "cuda" if torch.cuda.is_available() else "cpu"

model_path = "tts_models/en/vocoder_model.pth"
config_path = "VoiceModelAI.pth"
tts = TTS(model_path, config_path)


tts.tts_to_file(text=data, file_path="response.wav", language="en")

print("TTS conversion completed and saved to response.wav")
print(data)
