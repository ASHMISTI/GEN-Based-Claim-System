from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import random
import numpy as np
from PIL import Image
import io

app = FastAPI()

# ─────────────────────────────────────────────
# CORS (IMPORTANT for React frontend)
# ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # you can restrict later
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
# Dummy login
# ─────────────────────────────────────────────
@app.post("/login")
async def login(username: str = Form(...), password: str = Form(...)):
    if username == "retailer1" and password == "1234":
        return {"status": "success"}
    return {"status": "fail"}


# ─────────────────────────────────────────────
# Image-based severity calculation
# ─────────────────────────────────────────────
def calculate_severity(image_bytes):
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("L")  # grayscale
        arr = np.array(image)

        # variance-based heuristic
        variance = np.var(arr)

        # normalize to 0–100
        severity = int(min(100, max(10, variance / 50)))

    except:
        # fallback random if image fails
        severity = random.randint(30, 90)

    return severity


# ─────────────────────────────────────────────
# Decision logic
# ─────────────────────────────────────────────
def get_decision(severity):
    if severity >= 75:
        return "Severe", "Replace", False
    elif severity >= 50:
        return "Moderate", "Partial Refund", False
    else:
        return "Minor", "Manual Review", True


# ─────────────────────────────────────────────
# Upload endpoint
# ─────────────────────────────────────────────
@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    global claim_counter

    image_bytes = await file.read()

    severity = calculate_severity(image_bytes)
    damage, decision, manual_flag = get_decision(severity)

    claim = {
        "id": claim_counter,
        "severity": severity,
        "damage": damage,
        "decision": decision,
        "manual_intervention": manual_flag
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
# Health check (optional)
# ─────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "TyreGuard AI backend running"}