import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

try:
    models = list(genai.list_models())
    print("Modelos disponibles:")
    for m in models:
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error listando modelos: {e}")
