import os
import asyncio
import httpx
import base64
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")

async def main():
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"
    with open("temp_Tyre 1.jfif", "rb") as f:
        img_bytes = f.read()
    b64_image = base64.b64encode(img_bytes).decode("utf-8")
    
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": (
                                "You are an expert tyre damage assessor. Analyse this tyre image carefully. "
                                "Respond ONLY with a valid JSON object in this exact format:\n"
                                '{"severity": <integer 0-100>, "damage": "<Severe|Moderate|Minor>", '
                                '"explanation": "<1-2 sentence plain-English explanation of what you see and why>"}\n\n'
                                "Rules:\n"
                                "- Severe (score 75-100): cracks, bulges, sidewall damage, tread below 2 mm, blowouts\n"
                                "- Moderate (score 50-74): uneven wear, punctures, embedded objects\n"
                                "- Minor (score 10-49): surface scuffing, cosmetic marks, light wear\n"
                                "Output only the JSON, nothing else."
                        )
                    },
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": b64_image
                        }
                    }
                ]
            }
        ]
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.post(url, json=payload)
            print("Status:", resp.status_code)
            data = resp.json()
            parts = data["candidates"][0]["content"]["parts"]
            for part in parts:
                if "text" in part:
                    print("TEXT:", part["text"])
        except Exception as e:
            print("Exception:", e)

if __name__ == "__main__":
    asyncio.run(main())
