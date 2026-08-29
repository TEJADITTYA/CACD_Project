"""Cyber Shield API with safe local fallback and MongoDB-ready persistence."""
import hashlib
import json
import os
import re
import secrets
import time
import uuid
import base64
from datetime import datetime, timezone
from functools import wraps
from io import BytesIO
from urllib.parse import urlparse

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash
from scam_detector import analyze_message

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass
try:
    import jwt
except ImportError:
    jwt = None
try:
    from pymongo import MongoClient
except ImportError:
    MongoClient = None
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
except ImportError:
    A4 = getSampleStyleSheet = Paragraph = SimpleDocTemplate = Spacer = None

app = Flask(__name__, static_folder="../", static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 64 * 1024
CORS(app, resources={r"/*": {"origins": os.getenv("CORS_ORIGINS", "*").split(",")}})
JWT_SECRET = os.getenv("JWT_SECRET", "development-only-change-me")
OTP_TTL = 300
otp_store = {}
memory = {"users": {}, "analyses": {}, "reports": {}, "contacts": {}}


def now():
    return datetime.now(timezone.utc)


def serialize(value):
    return value.isoformat() if isinstance(value, datetime) else value


def collection(name):
    if MongoClient and os.getenv("MONGODB_URI"):
        if not hasattr(app, "mongo_db"):
            client = MongoClient(os.environ["MONGODB_URI"], serverSelectionTimeoutMS=2500)
            app.mongo_db = client[os.getenv("MONGODB_DB", "cybershield")]
        return app.mongo_db[name]
    return memory[name]


def insert(name, document):
    store = collection(name)
    if isinstance(store, dict):
        store[document["_id"]] = document
    else:
        store.insert_one(document)
    return document


def find_one(name, query):
    store = collection(name)
    if isinstance(store, dict):
        return next((item for item in store.values() if all(item.get(k) == v for k, v in query.items())), None)
    return store.find_one(query)


def find_many(name, query=None):
    store = collection(name)
    if isinstance(store, dict):
        return [item for item in store.values() if not query or all(item.get(k) == v for k, v in query.items())]
    return list(store.find(query or {}).sort("created_at", -1))


def token_for(user_id):
    if not jwt:
        return user_id
    return jwt.encode({"sub": user_id, "exp": int(time.time()) + 86400}, JWT_SECRET, algorithm="HS256")


def current_user():
    value = request.headers.get("Authorization", "")
    if not value.startswith("Bearer "):
        return None
    try:
        token = value[7:]
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"]) if jwt else {"sub": token}
        return find_one("users", {"_id": payload["sub"]})
    except Exception:
        return None


def auth_required(handler):
    @wraps(handler)
    def wrapped(*args, **kwargs):
        user = current_user()
        if not user:
            return jsonify(success=False, error="Authentication required."), 401
        request.user = user
        return handler(*args, **kwargs)
    return wrapped


def body():
    return request.get_json(silent=True) or {}


def otp_key(kind, value):
    return f"{kind}:{value}"


def issue_otp(kind, value):
    code = f"{secrets.randbelow(10000):04d}"
    otp_store[otp_key(kind, value)] = {"hash": hashlib.sha256(code.encode()).hexdigest(), "expires": time.time() + OTP_TTL, "attempts": 0}
    app.logger.info("OTP requested for %s; delivery requires a configured provider", value)
    return code


def deliver_phone_otp(phone, code):
    """Deliver an OTP through Twilio without exposing provider credentials."""
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    sender = os.getenv("TWILIO_FROM_NUMBER")
    if not sid or not token or not sender:
        raise RuntimeError("SMS provider is not configured.")
    import urllib.parse
    import urllib.request
    endpoint = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
    payload = urllib.parse.urlencode({
        "To": phone,
        "From": sender,
        "Body": "Your Cyber Shield verification code is " + code + ". It expires in 5 minutes.",
    }).encode()
    credentials = base64.b64encode(f"{sid}:{token}".encode()).decode()
    request = urllib.request.Request(endpoint, payload, {
        "Authorization": "Basic " + credentials,
        "Content-Type": "application/x-www-form-urlencoded",
    })
    with urllib.request.urlopen(request, timeout=10) as response:
        if response.status >= 300:
            raise RuntimeError("SMS provider rejected the request.")


def deliver_email_otp(email, code):
    """Deliver email OTP via SMTP when explicitly configured."""
    host = os.getenv("SMTP_HOST")
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM", username or "")
    if not all((host, username, password, sender)):
        raise RuntimeError("Email provider is not configured.")
    import smtplib
    from email.message import EmailMessage
    message = EmailMessage()
    message["Subject"] = "Cyber Shield verification code"
    message["From"] = sender
    message["To"] = email
    message.set_content("Your Cyber Shield verification code is " + code + ". It expires in 5 minutes.")
    with smtplib.SMTP_SSL(os.getenv("SMTP_PORT", "465"), timeout=10) as server:
        server.login(username, password)
        server.send_message(message)


def verify_otp(kind, value, code):
    key = otp_key(kind, value); record = otp_store.get(key)
    if not record or record["expires"] < time.time():
        otp_store.pop(key, None)
        return False, "OTP expired or not requested."
    record["attempts"] += 1
    valid = record["attempts"] <= 5 and secrets.compare_digest(record["hash"], hashlib.sha256(code.encode()).hexdigest())
    if valid:
        otp_store.pop(key, None)
    return valid, "OTP verified." if valid else "Invalid OTP."


def safe_preview(message):
    value = re.sub(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}", "[email masked]", message)
    value = re.sub(r"\b\+?\d[\d ()-]{7,}\d\b", "[phone masked]", value)
    return re.sub(r"\b\d{4,}\b", "[number masked]", value)[:280]


def normalize(result):
    score = max(0, min(100, int(result.get("risk_score", 0))))
    level = "SAFE" if score <= 20 else "LOW" if score <= 40 else "MEDIUM" if score <= 60 else "HIGH" if score <= 80 else "CRITICAL"
    result.update({"risk_score": score, "risk_level": level, "classification": "LIKELY_SCAM" if score > 60 else "NEEDS_REVIEW" if score > 20 else "SAFE"})
    result.setdefault("detected_urls", result.get("urls", []))
    result.setdefault("actions", ["Verify the sender independently", "Avoid sharing credentials or payment details"])
    return result


def analyze_with_provider(message, source):
    key, endpoint = os.getenv("AI_API_KEY"), os.getenv("AI_API_URL")
    if not key or not endpoint:
        result = normalize(analyze_message(message)); result["analysis_mode"] = "Fallback heuristic analysis"; return result
    try:
        import urllib.request
        payload = {"model": os.getenv("AI_MODEL", "gpt-4o-mini"), "temperature": 0, "response_format": {"type": "json_object"}, "messages": [{"role": "system", "content": "Analyze scam evidence. Return JSON only with risk_score, risk_level, classification, summary, indicators, detected_urls, recommendation, actions. Do not invent facts."}, {"role": "user", "content": f"Source: {source}\nMessage: {message}"}]}
        req = urllib.request.Request(endpoint, json.dumps(payload).encode(), {"Content-Type": "application/json", "Authorization": f"Bearer {key}"})
        with urllib.request.urlopen(req, timeout=12) as response:
            content = json.loads(response.read())["choices"][0]["message"]["content"]
        result = normalize(json.loads(content)); result["analysis_mode"] = "AI semantic analysis"; return result
    except Exception:
        result = normalize(analyze_message(message)); result["analysis_mode"] = "Fallback heuristic analysis (AI unavailable)"; return result


@app.after_request
def security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


@app.get("/")
def home():
    return app.send_static_file("index.html")


@app.get("/api/health")
def health():
    return jsonify(success=True, status="healthy", persistence="mongodb" if os.getenv("MONGODB_URI") else "local development")


@app.post("/api/auth/register")
def register():
    data = body(); email = str(data.get("email", "")).strip().lower(); password = str(data.get("password", "")); name = str(data.get("name", "")).strip()
    valid_email = re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email)
    if not name or not valid_email or len(password) < 8:
        return jsonify(success=False, error="Name, valid email, and password of at least 8 characters are required."), 400
    if find_one("users", {"email": email}):
        return jsonify(success=False, error="Email is already registered."), 409
    user = insert("users", {"_id": uuid.uuid4().hex, "name": name, "email": email, "password_hash": generate_password_hash(password), "created_at": now()})
    return jsonify(success=True, token=token_for(user["_id"]), user={"id": user["_id"], "name": name, "email": email}), 201


@app.post("/api/auth/login")
def login():
    data = body(); user = find_one("users", {"email": str(data.get("email", "")).strip().lower()})
    if not user or not check_password_hash(user["password_hash"], str(data.get("password", ""))):
        return jsonify(success=False, error="Invalid email or password."), 401
    return jsonify(success=True, token=token_for(user["_id"]), user={"id": user["_id"], "name": user["name"], "email": user["email"]})


@app.post("/api/auth/logout")
def logout():
    return jsonify(success=True, message="Signed out. Discard the client token.")


def otp_endpoint(kind, verify=False):
    data = body(); value = str(data.get(kind, "")).strip().lower()
    pattern = r"[^\s@]+@[^\s@]+\.[^\s@]+" if kind == "email" else r"\+[1-9]\d{7,14}"
    if not re.fullmatch(pattern, value):
        return jsonify(success=False, error=f"Valid {kind} is required."), 400
    if verify:
        code = str(data.get("otp", "")).strip()
        if not re.fullmatch(r"\d{4}", code): return jsonify(success=False, error="A four-digit OTP is required."), 400
        valid, message = verify_otp(kind, value, code); return jsonify(success=valid, message=message), 200 if valid else 400
    code = issue_otp(kind, value)
    try:
        has_phone_provider = all(os.getenv(name) for name in ("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"))
        has_email_provider = all(os.getenv(name) for name in ("SMTP_HOST", "SMTP_USERNAME", "SMTP_PASSWORD", "SMTP_FROM"))
        if kind == "phone" and has_phone_provider:
            deliver_phone_otp(value, code)
        elif kind == "email" and has_email_provider:
            deliver_email_otp(value, code)
        elif os.getenv("APP_ENV", "development") == "production":
            raise RuntimeError("OTP provider is not configured.")
    except Exception:
        otp_store.pop(otp_key(kind, value), None)
        app.logger.exception("OTP delivery failed")
        return jsonify(success=False, error=f"{kind.title()} delivery is not configured or unavailable."), 503
    response = {"success": True, "message": f"{kind.title()} OTP sent successfully."}
    if os.getenv("APP_ENV", "development") != "production":
        response["development_otp"] = code
        response["message"] = f"{kind.title()} OTP generated for local development."
    return jsonify(response)


@app.post("/api/auth/send-phone-otp")
def send_phone_otp(): return otp_endpoint("phone")
@app.post("/api/send-phone-otp")
def legacy_send_phone_otp(): return otp_endpoint("phone")
@app.post("/api/auth/verify-phone-otp")
def verify_phone_otp(): return otp_endpoint("phone", True)
@app.post("/api/verify-phone-otp")
def legacy_verify_phone_otp(): return otp_endpoint("phone", True)
@app.post("/api/auth/send-email-otp")
def send_email_otp(): return otp_endpoint("email")
@app.post("/api/send-email-otp")
def legacy_send_email_otp(): return otp_endpoint("email")
@app.post("/api/auth/verify-email-otp")
def verify_email_otp(): return otp_endpoint("email", True)
@app.post("/api/verify-email-otp")
def legacy_verify_email_otp(): return otp_endpoint("email", True)


@app.post("/api/analyze")
def analyze():
    data = body(); message = data.get("message", ""); source = str(data.get("source", "other"))[:32]
    if not isinstance(message, str) or not message.strip() or len(message) > 10000:
        return jsonify(success=False, error="Message must be non-empty text of at most 10,000 characters."), 400
    try:
        result = analyze_with_provider(message.strip(), source); user = current_user()
        analysis = {"_id": uuid.uuid4().hex, "user_id": user["_id"] if user else None, "message_hash": hashlib.sha256(message.encode()).hexdigest(), "message_preview": safe_preview(message), "source": source, **result, "created_at": now()}
        insert("analyses", analysis)
        return jsonify(success=True, analysis_id=analysis["_id"], result={k: serialize(v) for k, v in result.items()})
    except Exception:
        app.logger.exception("analysis failed")
        return jsonify(success=False, error="Analysis failed safely. Please try again."), 500


@app.post("/api/url-check")
def url_check():
    urls = body().get("urls", []); urls = urls if isinstance(urls, list) else [urls]; results = []
    for value in urls[:20]:
        parsed = urlparse(str(value)); domain = parsed.netloc.lower(); reasons = []
        if parsed.scheme != "https": reasons.append("Connection is not HTTPS")
        if re.fullmatch(r"(?:\d{1,3}\.){3}\d{1,3}", domain): reasons.append("Host is an IP address")
        if any(shortener in domain for shortener in ("bit.ly", "tinyurl.com", "t.co", "cutt.ly")): reasons.append("URL shortener")
        results.append({"url": str(value), "domain": domain, "status": "SUSPICIOUS" if reasons else "UNKNOWN", "reasons": reasons or ["No reputation provider configured; no verdict asserted"]})
    return jsonify(success=True, urls=results)


@app.get("/api/analysis/history")
@auth_required
def history():
    records = find_many("analyses", {"user_id": request.user["_id"]})
    return jsonify(success=True, analyses=[{k: serialize(v) for k, v in r.items() if k not in ("_id", "user_id", "message_hash")} | {"id": r["_id"]} for r in records])


@app.get("/api/analysis/<analysis_id>")
@auth_required
def analysis_detail(analysis_id):
    record = find_one("analyses", {"_id": analysis_id, "user_id": request.user["_id"]})
    if not record: return jsonify(success=False, error="Analysis not found."), 404
    return jsonify(success=True, analysis={k: serialize(v) for k, v in record.items() if k not in ("user_id", "message_hash")})


@app.get("/api/dashboard/stats")
@auth_required
def dashboard_stats():
    records = find_many("analyses", {"user_id": request.user["_id"]}); scores = [r.get("risk_score", 0) for r in records]
    distribution = {level: sum(r.get("risk_level") == level for r in records) for level in ("SAFE", "LOW", "MEDIUM", "HIGH", "CRITICAL")}
    return jsonify(success=True, stats={"total_messages": len(records), "scams_detected": sum(r.get("risk_score", 0) > 60 for r in records), "safe_messages": sum(r.get("risk_score", 0) <= 20 for r in records), "average_risk_score": round(sum(scores) / len(scores), 1) if scores else 0, "risk_distribution": distribution})


def make_report(analysis):
    report_id = "SD-" + secrets.token_hex(4).upper(); created = now()
    content = {"report_id": report_id, "analysis_id": analysis["_id"], "risk_score": analysis.get("risk_score", 0), "classification": analysis.get("classification"), "timestamp": created.isoformat(), "preview": analysis.get("message_preview", ""), "indicators": analysis.get("indicators", []), "summary": analysis.get("summary", ""), "recommendation": analysis.get("recommendation", "")}
    digest = hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()
    return insert("reports", {"_id": uuid.uuid4().hex, "user_id": request.user["_id"], "report_id": report_id, "report_hash": digest, "created_at": created, "content": content})


@app.post("/api/report/generate")
@auth_required
def report_generate():
    analysis = find_one("analyses", {"_id": body().get("analysis_id"), "user_id": request.user["_id"]})
    if not analysis: return jsonify(success=False, error="Analysis not found."), 404
    report = make_report(analysis); return jsonify(success=True, report={"id": report["_id"], "report_id": report["report_id"], "hash": report["report_hash"]}), 201


@app.get("/api/report/<report_id>")
def report_get(report_id):
    report = find_one("reports", {"report_id": report_id})
    if not report: return jsonify(success=False, error="Report not found."), 404
    return jsonify(success=True, report={"report_id": report["report_id"], "created_at": serialize(report["created_at"]), "hash": report["report_hash"], **report["content"]})


@app.get("/api/report/<report_id>/verify")
def report_verify(report_id):
    report = find_one("reports", {"report_id": report_id})
    if not report: return jsonify(success=True, verified=False, message="Report not found.")
    expected = hashlib.sha256(json.dumps(report["content"], sort_keys=True).encode()).hexdigest()
    return jsonify(success=True, verified=secrets.compare_digest(expected, report["report_hash"]), report_id=report_id, timestamp=serialize(report["created_at"]))


@app.get("/api/report/<report_id>/json")
def report_json(report_id):
    report = find_one("reports", {"report_id": report_id})
    if not report:
        return jsonify(success=False, error="Report not found."), 404
    payload = {"report_id": report["report_id"], "created_at": serialize(report["created_at"]), "report_hash": report["report_hash"], **report["content"]}
    response = app.response_class(json.dumps(payload, indent=2), mimetype="application/json")
    response.headers["Content-Disposition"] = f"attachment; filename={report_id}.json"
    return response


@app.get("/api/report/<report_id>/pdf")
def report_pdf(report_id):
    report = find_one("reports", {"report_id": report_id})
    if not report: return jsonify(success=False, error="Report not found."), 404
    if not SimpleDocTemplate: return jsonify(success=False, error="PDF support requires reportlab."), 503
    stream = BytesIO(); doc = SimpleDocTemplate(stream, pagesize=A4); styles = getSampleStyleSheet(); content = report["content"]
    story = [Paragraph("CYBER SHIELD", styles["Title"]), Paragraph("THREAT INTELLIGENCE REPORT", styles["Heading2"]), Spacer(1, 18)]
    for label, value in (("Report ID", report["report_id"]), ("Risk", f"{content['risk_score']}/100 - {content['classification']}"), ("Generated", report["created_at"].isoformat()), ("Message snapshot", content["preview"]), ("Threat summary", content["summary"]), ("Recommendation", content["recommendation"]), ("Integrity hash", report["report_hash"])):
        story.extend([Paragraph(f"<b>{label}</b>", styles["Heading3"]), Paragraph(str(value), styles["BodyText"]), Spacer(1, 8)])
    doc.build(story); stream.seek(0); return send_file(stream, as_attachment=True, download_name=f"{report_id}.pdf", mimetype="application/pdf")


@app.route("/<path:path>", methods=["GET"])
def serve_frontend(path):
    if path.startswith("api/"):
        return jsonify(success=False, error="Not found."), 404
    file_path = os.path.normpath(os.path.join("..", path))
    if path and os.path.exists(file_path):
        return app.send_static_file(path)
    return app.send_static_file("index.html")


@app.errorhandler(413)
def too_large(_): return jsonify(success=False, error="Request is too large."), 413


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=os.getenv("APP_ENV") != "production")
