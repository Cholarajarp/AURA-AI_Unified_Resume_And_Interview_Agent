import google.generativeai as genai
import json
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('GOOGLE_API_KEY')
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.5-flash')

# Test JSON response
response = model.generate_content('Return ONLY this JSON with no extra text: {"name": "John", "score": 85}')
try:
    result = json.loads(response.text)
    print('JSON parsing successful!')
    print(f'Name: {result["name"]}, Score: {result["score"]}')
except json.JSONDecodeError as e:
    print(f'Error: {e}')
    print(f'Raw response: {response.text}')
