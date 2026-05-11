from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import random
import numpy as np
from PIL import Image
import io
import os
import httpx
import json
import re
import base64
from datetime import datetime

app = FastAPI()

# ─────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# In-memory storage
# ─────────────────────────────────────────────
claims_db = []
claim_counter = 1

# ─────────────────────────────────────────────
# Env vars
# ─────────────────────────────────────────────
GEMINI_API_KEY  = os.getenv("GOOGLE_API_KEY", "")
RESEND_API_KEY  = os.getenv("RESEND_API_KEY", "")
NOTIFY_EMAIL    = os.getenv("NOTIFY_EMAIL", "")


# ─────────────────────────────────────────────
# Gemini Vision Analysis
# ─────────────────────────────────────────────
async def analyze_with_gemini(image_bytes: bytes):
    """Call Gemini 1.5 Flash to analyse the tyre image."""
    if not GEMINI_API_KEY:
        return None, None, None

    try:
        b64_image = base64.b64encode(image_bytes).decode("utf-8")

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
            ],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 256
            }
        }

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        )

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

        raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()

        # Extract JSON even if wrapped in markdown fences
        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if not match:
            return None, None, None

        result = json.loads(match.group())
        severity    = int(result.get("severity", 50))
        damage      = result.get("damage", "Minor")
        explanation = result.get("explanation", "")

        # Clamp severity
        severity = max(0, min(100, severity))
        return severity, damage, explanation

    except Exception as e:
        print(f"[Gemini] Error: {e}")
        return None, None, None


# ─────────────────────────────────────────────
# Fallback: pixel-variance heuristic
# ─────────────────────────────────────────────
def calculate_severity_fallback(image_bytes: bytes) -> int:
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("L")
        arr   = np.array(image)
        variance = np.var(arr)
        return int(min(100, max(10, variance / 50)))
    except Exception:
        return random.randint(30, 90)


# ─────────────────────────────────────────────
# Decision logic
# ─────────────────────────────────────────────
def get_decision(severity: int, damage: Optional[str] = None):
    if damage == "Severe" or severity >= 75:
        return "Severe", "Replace", False
    elif damage == "Moderate" or severity >= 50:
        return "Moderate", "Partial Refund", False
    else:
        return "Minor", "Manual Review", True


# ─────────────────────────────────────────────
# Email via Resend
# ─────────────────────────────────────────────
async def send_claim_email(claim: dict, target_email: str):
    if not RESEND_API_KEY:
        print("[Email] Skipped — RESEND_API_KEY not set")
        return False

    badge_color = {
        "Severe":   "#ef4444",
        "Moderate": "#f59e0b",
        "Minor":    "#22c55e",
    }.get(claim["damage"], "#94a3b8")

    html = f"""
    <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#111418;
                color:#e8edf2;border-radius:12px;overflow:hidden;">
      <div style="background:#1f2630;padding:24px 28px;border-bottom:1px solid #1f2a36;">
        <span style="font-size:22px;font-weight:700;letter-spacing:-0.5px;">TyreGuard AI</span>
        <span style="font-size:12px;color:#5a6a7e;margin-left:10px;">Claims Platform</span>
      </div>
      <div style="padding:28px;">
        <p style="color:#8a9ab0;font-size:13px;margin-bottom:16px;">New claim submitted</p>
        <h2 style="font-size:20px;font-weight:600;margin-bottom:4px;">
          Claim <span style="font-family:monospace;">#{str(claim['id']).zfill(5)}</span>
        </h2>
        <span style="display:inline-block;background:{badge_color}22;color:{badge_color};
                     border:1px solid {badge_color}44;border-radius:20px;
                     padding:3px 12px;font-size:12px;font-weight:500;margin-bottom:20px;">
          {claim['damage']} — {claim['decision']}
        </span>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr style="border-bottom:1px solid #1f2630;">
            <td style="padding:10px 0;color:#8a9ab0;">Severity Score</td>
            <td style="padding:10px 0;font-weight:500;">{claim['severity']} / 100</td>
          </tr>
          <tr style="border-bottom:1px solid #1f2630;">
            <td style="padding:10px 0;color:#8a9ab0;">Decision</td>
            <td style="padding:10px 0;font-weight:500;">{claim['decision']}</td>
          </tr>
          <tr style="border-bottom:1px solid #1f2630;">
            <td style="padding:10px 0;color:#8a9ab0;">Manual Review</td>
            <td style="padding:10px 0;font-weight:500;">{'Yes ⚠' if claim['manual_intervention'] else 'No ✓'}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#8a9ab0;">Status</td>
            <td style="padding:10px 0;font-weight:500;">{claim.get('status','Pending')}</td>
          </tr>
        </table>
        {f'<div style="background:#181d24;border-radius:8px;padding:14px;margin-top:16px;font-size:13px;color:#8a9ab0;"><strong style="color:#e8edf2;">AI Analysis:</strong> {claim["explanation"]}</div>' if claim.get('explanation') else ''}
      </div>
      <div style="padding:16px 28px;background:#0a0c0f;font-size:11px;color:#5a6a7e;">
        TyreGuard AI · Automated notification · {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}
      </div>
    </div>
    """

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from":    "TyreGuard AI <onboarding@resend.dev>",
                    "to":      [target_email],
                    "subject": f"[TyreGuard] New Claim #{str(claim['id']).zfill(5)} — {claim['damage']} Damage",
                    "html":    html,
                },
            )
            if r.status_code >= 400:
                print(f"[Email] Resend error {r.status_code}: {r.text}")
                return False
            else:
                print(f"[Email] Sent to {target_email}")
                return True
    except Exception as e:
        print(f"[Email] Exception: {e}")
        return False


# ─────────────────────────────────────────────
# Login
# ─────────────────────────────────────────────
@app.post("/login")
async def login(username: str = Form(...), password: str = Form(...)):
    if username == "retailer1" and password == "1234":
        return {"status": "success"}
    return {"status": "fail"}


# ─────────────────────────────────────────────
# Upload + analyse
# ─────────────────────────────────────────────
@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    global claim_counter

    image_bytes = await file.read()

    # Try Gemini first
    severity, damage, explanation = await analyze_with_gemini(image_bytes)

    if severity is None:
        # Fallback to heuristic
        severity    = calculate_severity_fallback(image_bytes)
        damage, decision, manual_flag = get_decision(severity)
        explanation = None
    else:
        damage, decision, manual_flag = get_decision(severity, damage)

    claim = {
        "id":                claim_counter,
        "severity":          severity,
        "damage":            damage,
        "decision":          decision,
        "manual_intervention": manual_flag,
        "status":            "Pending",
        "explanation":       explanation,
        "time":              datetime.utcnow().isoformat(),
        "ai_powered":        explanation is not None,
    }

    claims_db.append(claim)
    claim_counter += 1

    return claim


# ─────────────────────────────────────────────
# Get all claims
# ─────────────────────────────────────────────
@app.get("/claims")
async def get_claims():
    return claims_db


# ─────────────────────────────────────────────
# Update claim status
# ─────────────────────────────────────────────
class StatusUpdate(BaseModel):
    status: str

VALID_STATUSES = {"Pending", "Under Review", "Approved", "Rejected"}

@app.patch("/claims/{claim_id}/status")
async def update_status(claim_id: int, body: StatusUpdate):
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Use: {VALID_STATUSES}")
    for claim in claims_db:
        if claim["id"] == claim_id:
            claim["status"] = body.status
            return claim
    raise HTTPException(status_code=404, detail="Claim not found")

# ─────────────────────────────────────────────
# Send Email manually
# ─────────────────────────────────────────────
class EmailRequest(BaseModel):
    email: str

@app.post("/claims/{claim_id}/send-email")
async def trigger_email(claim_id: int, body: EmailRequest):
    claim = next((c for c in claims_db if c["id"] == claim_id), None)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    success = await send_claim_email(claim, body.email)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email. Check API key or verified email address.")
    return {"status": "success"}


# ─────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "message":     "TyreGuard AI backend running",
        "gemini":      bool(GEMINI_API_KEY),
        "email":       bool(RESEND_API_KEY and NOTIFY_EMAIL),
        "total_claims": len(claims_db),
    }