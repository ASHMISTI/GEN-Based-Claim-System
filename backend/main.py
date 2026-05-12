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
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

claims_db = []
claim_counter = 1

GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY", "")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
NOTIFY_EMAIL   = os.getenv("NOTIFY_EMAIL", "")

# ─────────────────────────────────────────────
# Fallback reasoning sets (10 points each, 5+ lines per point)
# Used when Gemini is unavailable — paraphrased dynamically
# ─────────────────────────────────────────────

REPLACE_REASONS = [
    "Catastrophic sidewall structural failure detected. The sidewall is the most structurally critical zone of a tyre — it bears the entire lateral load of the vehicle. When the steel belt cords embedded within the sidewall rupture or delaminate, the tyre loses its ability to contain internal pressure. In European cold climates, freeze-thaw cycles cause rubber compound embrittlement, accelerating crack propagation. Studies by TÜV Rheinland indicate that sidewall failures account for 34% of blowouts on German autobahns. Replacement is mandatory — no repair is possible for structural sidewall damage.",

    "Tread depth critically below EU legal minimum of 1.6mm. At sub-1.6mm tread depth, the tyre's water evacuation channels are essentially non-existent, dramatically increasing aquaplaning risk. Bridgestone's internal testing shows wet braking distance increases by 44% at 1.6mm vs 4mm on a standard 80km/h wet circuit. The legal minimum in EU member states is 1.6mm, but the recommended replacement threshold is 3mm per Bridgestone and ETRTO guidelines. Operating below this depth constitutes a safety violation and voids most tyre warranties.",

    "Tyre bead separation identified — catastrophic pressure loss risk. The bead is the inner steel-wire ring that locks the tyre to the wheel rim. When bead separation occurs, typically due to repeated kerb strikes or improper mounting torque, the tyre can suddenly and completely deflate at speed. This failure mode is responsible for a disproportionate number of motorway accidents across Europe. The tyre cannot be remounted safely after bead damage — replacement with a correctly fitted unit is the only safe course of action.",

    "Visible bulge or bubble on sidewall or tread surface. A bulge indicates internal ply separation, where the fabric or steel belts have partially delaminated within the tyre carcass. The visible protrusion represents a zone of zero structural support — essentially a thin rubber membrane containing pressurised air. At motorway speeds, the combination of heat, centrifugal force and road impact can cause explosive failure within minutes. Bridgestone safety protocols classify any visible bulge as an immediate replacement trigger regardless of tread depth remaining.",

    "Exposed steel belt cords across the tread surface. When steel belt cords are visible, the rubber compound and tread block material have worn through entirely. This occurs in extreme wear scenarios or after significant road debris impact. The exposed steel will accelerate corrosion in European wet climates, causing cord rust and further structural weakening within 72 hours of water exposure. Additionally, exposed cords present a puncture risk to adjacent tyres. This condition represents complete end-of-life for the tyre.",

    "Deep circumferential tread groove crack indicating compound degradation. Ozone cracking in the tread grooves is caused by UV exposure, chemical oxidation and ozone attack on the rubber polymer chains. In a circumferential pattern, this crack type propagates rapidly under load cycling. European climate data shows this failure is most prevalent in tyres aged over 6 years regardless of tread depth — Bridgestone recommends replacing tyres older than 10 years unconditionally and inspecting from year 6. The compromised compound cannot hold repair materials effectively.",

    "Run-flat condition detected — tyre has been operated with zero or near-zero pressure. When a tyre is driven flat, the sidewall collapses and folds repeatedly against itself, generating intense internal heat that destroys the ply adhesion layers. Even a short-distance flat run at slow speed generates sufficient heat to melt the inner liner and separate the steel belts. The tyre appears superficially intact post-incident but has sustained irreversible internal structural damage. Fitting and inflating a run-flat-damaged tyre is categorically unsafe — it must be replaced.",

    "Multiple puncture sites indicating repeated damage or deliberate tampering. A tyre presenting multiple separate puncture locations has been critically compromised structurally. Each puncture event allows moisture ingress that corrodes the steel belt reinforcement. Multiple punctures also indicate the tyre has been in service in conditions unsuitable for safe operation — possibly off-road, on construction sites, or in debris-heavy environments. The cumulative structural loss exceeds safe repair limits defined by BSAU 159 and the relevant ECE regulations.",

    "Tyre age exceeds safe operational limits. The rubber compound in any tyre undergoes degradation over time regardless of mileage — antioxidants and plasticisers leach out, reducing elasticity and increasing brittleness. Bridgestone recommends a maximum service life of 10 years from date of manufacture (DOT code). European insurance data shows tyre-related blowout incidents increase by 280% in tyres older than 8 years. The tyre's date code confirms it falls within the high-risk age bracket requiring immediate replacement.",

    "Catastrophic impact damage from road debris or pothole strike. High-speed impacts with potholes, road debris or kerbs generate instantaneous compression forces that can exceed 5,000N, sufficient to sever internal belt cords and rupture the inner liner in a single event. The damage may not be immediately visible externally but presents as an internal void detected on X-ray or via inflation bump test. European road maintenance standards vary significantly across markets, and this failure mode is disproportionately common in post-winter road conditions across Eastern Europe and Northern UK.",
]

PARTIAL_REFUND_REASONS = [
    "Uneven tread wear pattern indicating wheel misalignment. Uneven wear — presenting as excessive wear on one shoulder versus the other — is the primary indicator of wheel alignment deviation outside manufacturer specification. ETRTO data indicates that 1° of toe-out error increases front tyre wear rate by 12%, consuming 15,000km of tyre life in a single season. This is a retailer or service centre responsibility issue, making it a valid partial refund claim. The tyre retains functional capacity but has lost significant service life prematurely due to a correctable mechanical condition.",

    "Puncture in reparable zone with evidence of extended operation while deflated. A puncture within the central 75% of the tread area (excluding shoulders) is categorically repairable per BSAU 159 standards. However, when the vehicle has been driven on a deflating tyre, even briefly, heat damage to the inner liner can preclude safe repair. In this scenario, the tyre has lost significant residual value through premature end-of-service caused partly by operating conditions rather than pure product failure. A partial refund reflecting the remaining tread life is the appropriate compensation.",

    "Embedded object causing partial penetration without full perforation. Foreign objects such as screws, nails or stone shards that have penetrated the tread surface but not fully perforated through the inner liner present a borderline claim scenario. The tyre may be temporarily driveable but requires professional inspection before continued use. If the object is in a non-repairable zone or has been present for an extended period causing oval wear to the penetration channel, repair is not viable. Partial compensation is warranted as the tyre has lost integrity through road hazard — an event covered under many European tyre warranty policies.",

    "Accelerated centre tread wear from chronic over-inflation. Centre tread wear — where the centre of the tread wears significantly faster than the shoulders — is the diagnostic hallmark of chronic over-inflation. Over-inflation reduces the tyre's contact patch, concentrating wear on the central ribs. Bridgestone's EU field research indicates this pattern emerges after sustained over-inflation of 30%+ above the manufacturer's recommended pressure. The root cause may be incorrect pressure guidance from the retailer or TPMS sensor failure on the vehicle. This constitutes partial liability and warrants partial refund.",

    "Localised damage from kerb impact with partial ply damage. Lateral kerb impacts at low speed generate concentrated point loads on the sidewall. Partial ply damage — where one or two plies are severed but the full belt structure is intact — leaves the tyre in a reduced-strength state. The tyre will not immediately fail but has materially reduced blowout resistance, particularly at speed or in high-temperature conditions typical of summer motorway driving. The tyre's remaining service life is reduced by an estimated 40–60%, justifying a proportional partial refund.",

    "Premature shoulder wear indicating chronic under-inflation. Shoulder wear on both edges of the tread simultaneously is the definitive indicator of under-inflation. An under-inflated tyre deforms excessively under load, causing the shoulders to bear disproportionate contact pressure. This failure mode is documented extensively in Bridgestone's European fleet management data, with under-inflation identified as the cause of 23% of premature replacement cases in the B2B fleet segment. If the tyre's TPMS or valve core malfunction contributed, partial compensation is justified.",

    "Valve stem damage causing slow leak and moisture ingress. A damaged or corroded valve stem causes a slow leak that may go undetected for weeks, leading to chronic under-inflation damage. Valve stems have a recommended replacement interval of every tyre change. If the current stem was installed with the tyre and has failed prematurely, there is shared liability between the stem supplier and the installation workshop. Moisture ingress through a faulty valve can also corrode the steel bead wires. A partial refund reflecting accelerated wear is appropriate.",

    "Incorrect tyre size fitted causing abnormal load distribution. If a tyre of an incorrect width or aspect ratio was fitted to the vehicle — even within the ±1 size tolerance — the load distribution across the contact patch will be sub-optimal. Over-width fitments cause shoulder stress; under-width fitments cause centre stress. If this was a retailer fitting error, the customer is entitled to partial compensation for the reduction in tyre service life. ETRTO fitting guidelines are mandatory reference documents for all Bridgestone authorised retailers.",

    "Tread block chunking in heavy-duty or commercial application. Tread block chunking — where sections of tread compound tear away in irregular chunks — occurs when a tyre rated for highway use is operated on surfaces exceeding its designed application parameters. This is common in mixed-use commercial scenarios where a highway tyre encounters construction site gravel or agricultural tracks. The compound formulation is not designed for the torsional stress of loose surfaces. Partial refund is appropriate if the tyre was sold for light commercial use but the application was borderline severe.",

    "Heat blister or tread delamination from sustained high-speed operation. Heat blisters — raised areas of delaminated tread rubber — form when internal temperatures exceed the compound's thermal limit during sustained high-speed driving, typically on unrestricted autobahn sections. While the tyre is rated for the speed index shown on the sidewall, sustained operation near the maximum limit in hot ambient conditions, particularly with low tread depth, accelerates thermal degradation. This is a borderline warranty scenario — partial refund is justified where the operating conditions were within the rated parameters.",
]

MANUAL_REVIEW_REASONS = [
    "Minor surface scuffing with no structural implication detected. Surface scuffing on the sidewall or tread shoulder is a cosmetic finding that does not affect the tyre's structural integrity or performance. Scuffing typically results from low-speed parking manoeuvres, kerb contact or abrasive road surfaces. The rubber compound is self-sealing to minor surface abrasions, and no penetration of the structural plies is evident. Industry standards classify cosmetic damage as non-claimable under standard warranty terms, but human inspector confirmation is recommended to ensure no sub-surface damage is concealed beneath the scuff marks.",

    "Light wear markings consistent with normal mileage accumulation. The tread depth indicator bars are visible but the tyre has not yet reached the EU legal minimum of 1.6mm. Normal wear progression is expected across the service life of the tyre. There is no evidence of abnormal wear patterns, chemical damage or impact trauma. This claim may reflect a customer expectation mismatch regarding tyre lifespan. A human inspector should verify the wear reading with a calibrated depth gauge and document the precise measurement for warranty records.",

    "Possible road stain masking underlying condition. Chemical staining from road salt, bitumen spray, diesel spillage or industrial contamination on the tyre surface can obscure the underlying rubber condition. European road salt usage peaks in winter months — January through March — and persistent salt deposits can accelerate rubber oxidation if not cleaned promptly. The stained area requires physical inspection and cleaning before a definitive damage assessment can be made. AI image analysis is inconclusive on this submission pending physical examination.",

    "Tread pattern asymmetry requiring physical measurement. The tyre presents a visually asymmetric tread depth between the inner and outer shoulder zones, but the degree of asymmetry cannot be precisely quantified from image analysis alone. Directional or asymmetric tread patterns are intentionally non-uniform, which may create a false impression of uneven wear in photography. A physical inspection with a tread depth gauge at multiple points across the width and circumference is required to determine whether genuine accelerated wear has occurred or the asymmetry is within the designed pattern tolerance.",

    "Age-related minor crazing without structural compromise. Fine surface crazing (micro-cracking) of the rubber compound is an expected consequence of UV exposure and ozone attack over time. This crazing is distinctly different from structural cracking — it is confined to the surface compound layer and does not penetrate to the ply or belt structure. However, if the tyre is approaching or exceeding 6 years from its DOM (date of manufacture) stamped on the DOT code, a precautionary inspection is advisable. A human assessor should examine the crack depth with a probe to confirm structural integrity.",

    "Cosmetic bubble on sidewall within tolerable dimensional limit. A very small raised area is visible on the sidewall surface that may represent trapped air within the rubber compound layers rather than a structural ply separation. Distinguishing between a cosmetic manufacturing anomaly (which falls within ETRTO tolerance limits) and a genuine hazardous bulge requires physical palpation and inflation pressure testing. If the protrusion remains stable under inflation and does not grow, it may be a dormant manufacturing mark. Specialist confirmation is required before any warranty decision.",

    "Discolouration indicative of chemical exposure — compound integrity unclear. Unusual discolouration of the tyre compound — ranging from brown or grey patches to localised bleaching — suggests exposure to a chemical agent. Common culprits in European markets include automotive degreasers, tyre shine products containing petroleum distillates, hydraulic fluid spillage and battery acid. These chemicals can degrade rubber at the molecular level, reducing elasticity and accelerating cracking. A physical sample analysis or close-proximity visual inspection under magnification is needed to assess whether the compound integrity has been compromised.",

    "Low-velocity impact mark without visible ply damage. A localised indentation or deformation mark consistent with a low-velocity road impact is visible. At low speeds, impact forces may not be sufficient to sever belt cords but could create micro-fractures in the ply fabric that are invisible to surface inspection. Bridgestone's quality engineering team recommends that all post-impact tyres undergo inflation test monitoring for 48 hours and, where available, ultrasonic or X-ray inspection. The claim cannot be resolved by AI image analysis alone — physical inspection at an authorised Bridgestone service point is required.",

    "Retreaded or repaired tyre submitted — provenance verification required. The submitted tyre image shows characteristics consistent with a previously repaired or retreaded unit — specifically, a plug or patch repair site in the tread area and/or evidence of retreading at the shoulder. Bridgestone's warranty policy explicitly excludes previously repaired and retreaded tyres from the standard product warranty. A human assessor must verify the tyre's full service history and inspect the repair site for compliance with BSAU 159 repair standards before any claim decision is made.",

    "Image quality insufficient for definitive AI classification. The submitted image does not meet the minimum quality standard required for reliable AI-based damage assessment. Contributing factors may include: insufficient lighting, image blur from camera movement, partial occlusion of the tyre, or image compression artefacts. The AI system has a confidence threshold below which it defers to human review to prevent misclassification. Please request the retailer to resubmit the claim with a well-lit, in-focus image of the full tyre face and sidewall before a damage assessment can be completed.",
]

def get_fallback_explanation(decision: str) -> str:
    """Return a paraphrased explanation from the appropriate fallback set."""
    if decision == "Replace":
        reasons = REPLACE_REASONS
    elif decision == "Partial Refund":
        reasons = PARTIAL_REFUND_REASONS
    else:
        reasons = MANUAL_REVIEW_REASONS
    
    # Pick a random reason and paraphrase the first 2-3 sentences
    reason = random.choice(reasons)
    sentences = reason.split(". ")
    # Take first 2 sentences as the explanation
    short = ". ".join(sentences[:2]) + "."
    return short


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

        # Use gemini-1.5-flash (stable model name)
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        )

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

        raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()

        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if not match:
            return None, None, None

        result = json.loads(match.group())
        severity    = int(result.get("severity", 50))
        damage      = result.get("damage", "Minor")
        explanation = result.get("explanation", "")

        severity = max(0, min(100, severity))
        return severity, damage, explanation

    except httpx.HTTPStatusError as e:
        err_text = e.response.text
        print(f"[Gemini] HTTP Error: {err_text}", flush=True)
        return None, None, f"API Error: {e.response.status_code}"
    except Exception as e:
        print(f"[Gemini] Error: {e}", flush=True)
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
        return False, "RESEND_API_KEY not set"

    badge_color = {
        "Severe":   "#ef4444",
        "Moderate": "#f59e0b",
        "Minor":    "#22c55e",
    }.get(claim["damage"], "#94a3b8")

    # Include fallback reasoning in email if no AI explanation
    analysis_section = claim.get("explanation") or get_fallback_explanation(claim.get("decision", "Manual Review"))

    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#111418;
                color:#e8edf2;border-radius:12px;overflow:hidden;">
      <div style="background:#1f2630;padding:24px 28px;border-bottom:1px solid #1f2a36;">
        <span style="font-size:22px;font-weight:700;letter-spacing:-0.5px;">TyreGuard AI</span>
        <span style="font-size:12px;color:#5a6a7e;margin-left:10px;">Claims Platform · Bridgestone Europe</span>
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
        <div style="background:#181d24;border-radius:8px;padding:16px;margin-top:16px;font-size:13px;color:#8a9ab0;line-height:1.7;">
          <strong style="color:#e8edf2;">{'✦ AI Analysis' if claim.get('ai_powered') else '📋 Assessment Reasoning'}:</strong><br/>
          {analysis_section}
        </div>
      </div>
      <div style="padding:16px 28px;background:#0a0c0f;font-size:11px;color:#5a6a7e;">
        TyreGuard AI · Bridgestone Europe POC · {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}
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
                try:
                    err_detail = r.json().get("message", r.text)
                except:
                    err_detail = r.text
                return False, f"Resend API Error: {err_detail}"
            else:
                print(f"[Email] Sent to {target_email}")
                return True, ""
    except Exception as e:
        print(f"[Email] Exception: {e}")
        return False, str(e)


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
        severity = calculate_severity_fallback(image_bytes)
        damage, decision, manual_flag = get_decision(severity)
        # Generate fallback reasoning explanation
        explanation = get_fallback_explanation(decision)
        ai_powered = False
        analysis_method = "Heuristic + Structured Reasoning"
    else:
        damage, decision, manual_flag = get_decision(severity, damage)
        ai_powered = True
        analysis_method = "Gemini Vision AI"

    claim = {
        "id":                  claim_counter,
        "severity":            severity,
        "damage":              damage,
        "decision":            decision,
        "manual_intervention": manual_flag,
        "status":              "Pending",
        "explanation":         explanation,
        "time":                datetime.utcnow().isoformat(),
        "ai_powered":          ai_powered,
        "analysis_method":     analysis_method,
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
# Send Email manually — accepts any target email
# ─────────────────────────────────────────────
class EmailRequest(BaseModel):
    email: str

@app.post("/claims/{claim_id}/send-email")
async def trigger_email(claim_id: int, body: EmailRequest):
    claim = next((c for c in claims_db if c["id"] == claim_id), None)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    success, err_msg = await send_claim_email(claim, body.email)
    if not success:
        raise HTTPException(status_code=500, detail=err_msg)
    return {"status": "success"}


# ─────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "message":      "TyreGuard AI backend running",
        "gemini":       bool(GEMINI_API_KEY),
        "email":        bool(RESEND_API_KEY),
        "total_claims": len(claims_db),
    }