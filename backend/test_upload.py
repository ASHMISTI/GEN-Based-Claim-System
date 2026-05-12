import httpx
import asyncio

async def main():
    url = "https://gen-based-claim-system-production.up.railway.app/upload"
    files = {'file': ('temp_Tyre 1.jfif', open('temp_Tyre 1.jfif', 'rb'), 'image/jpeg')}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, files=files)
        print("Status:", resp.status_code)
        print("Response:", resp.text)

if __name__ == "__main__":
    asyncio.run(main())
