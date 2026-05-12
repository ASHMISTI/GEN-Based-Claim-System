import os
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")

async def main():
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        print("Status:", resp.status_code)
        data = resp.json()
        if "models" in data:
            print("Available models:")
            for m in data["models"]:
                print(" -", m["name"])
        else:
            print("Response:", data)

if __name__ == "__main__":
    asyncio.run(main())
