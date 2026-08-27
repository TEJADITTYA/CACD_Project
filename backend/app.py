from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import time
import re

# Scam analyzer
from scam_detector import analyze_message


# =========================================================
# APP CONFIGURATION
# =========================================================

app = Flask(__name__)

# Allow frontend (Vite/HTML) to communicate with Flask
CORS(app)


# =========================================================
# TEMPORARY OTP STORAGE
# =========================================================

otp_storage = {}


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def generate_otp():
    """Generate a 6-digit OTP."""
    return str(random.randint(100000, 999999))


def is_valid_email(email):
    """Validate email address."""
    pattern = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
    return re.match(pattern, email) is not None


def store_otp(key, otp):
    """Store OTP for 5 minutes."""

    otp_storage[key] = {
        "otp": otp,
        "created_at": time.time(),
        "verified": False
    }


def check_otp(key, otp):
    """Check OTP and expiry."""

    if key not in otp_storage:
        return False, "No OTP was requested. Please request a new OTP."

    stored = otp_storage[key]

    # OTP expires after 5 minutes
    if time.time() - stored["created_at"] > 300:

        del otp_storage[key]

        return False, "OTP has expired. Please request a new OTP."

    # Check OTP
    if otp != stored["otp"]:
        return False, "Incorrect OTP. Please try again."

    stored["verified"] = True

    return True, "OTP verified successfully."


# =========================================================
# HOME ROUTE
# =========================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "success": True,
        "message": "ScamDetect AI backend is running",
        "version": "1.0"
    })


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "success": True,
        "status": "healthy",
        "service": "ScamDetect AI",
        "message": "Backend API is working correctly."
    })


# =========================================================
# PHONE - SEND OTP
# =========================================================

@app.route("/api/send-phone-otp", methods=["POST"])
def send_phone_otp():

    try:

        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "error": "Request body is empty."
            }), 400

        phone = str(
            data.get("phone", "")
        ).strip()

        if not phone:
            return jsonify({
                "success": False,
                "error": "Phone number is required."
            }), 400

        # Phone must contain country code
        if not phone.startswith("+"):
            return jsonify({
                "success": False,
                "error": "Phone number must include country code."
            }), 400

        # Generate OTP
        otp = generate_otp()

        # Store OTP
        key = "phone:" + phone

        store_otp(
            key,
            otp
        )

        # DEMO MODE
        print("")
        print("=" * 60)
        print("PHONE OTP GENERATED")
        print("Phone:", phone)
        print("OTP:", otp)
        print("=" * 60)
        print("")

        return jsonify({

            "success": True,

            "message":
                "Phone OTP generated successfully.",

            # DEMO ONLY
            "demo_otp": otp

        }), 200

    except Exception as error:

        print(
            "SEND PHONE OTP ERROR:",
            error
        )

        return jsonify({

            "success": False,

            "error":
                "Unable to generate phone OTP."

        }), 500


# =========================================================
# PHONE - VERIFY OTP
# =========================================================

@app.route("/api/verify-phone-otp", methods=["POST"])
def verify_phone_otp():

    try:

        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "error": "Request body is empty."
            }), 400

        phone = str(
            data.get("phone", "")
        ).strip()

        otp = str(
            data.get("otp", "")
        ).strip()

        if not phone:
            return jsonify({
                "success": False,
                "error": "Phone number is required."
            }), 400

        if not otp:
            return jsonify({
                "success": False,
                "error": "OTP is required."
            }), 400

        key = "phone:" + phone

        valid, message = check_otp(
            key,
            otp
        )

        if not valid:

            return jsonify({
                "success": False,
                "error": message
            }), 400

        # Random success messages
        security_messages = [

            "Your phone number has been securely linked to ScamDetect AI.",

            "Phone verification completed successfully. Your security profile is active.",

            "Your trusted phone contact has been successfully verified.",

            "Security verification completed. Your phone is now linked.",

            "Your ScamDetect AI profile has been successfully protected."

        ]

        success_message = random.choice(
            security_messages
        )

        return jsonify({

            "success": True,

            "message": success_message,

            "phone": phone

        }), 200

    except Exception as error:

        print(
            "VERIFY PHONE OTP ERROR:",
            error
        )

        return jsonify({

            "success": False,

            "error":
                "Unable to verify phone OTP."

        }), 500


# =========================================================
# EMAIL - SEND OTP
# =========================================================

@app.route("/api/send-email-otp", methods=["POST"])
def send_email_otp():

    try:

        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "error": "Request body is empty."
            }), 400

        email = str(
            data.get("email", "")
        ).strip().lower()

        if not email:

            return jsonify({
                "success": False,
                "error": "Email address is required."
            }), 400

        if not is_valid_email(email):

            return jsonify({
                "success": False,
                "error": "Invalid email address."
            }), 400

        # Generate OTP
        otp = generate_otp()

        # Store OTP
        key = "email:" + email

        store_otp(
            key,
            otp
        )

        # DEMO MODE
        print("")
        print("=" * 60)
        print("EMAIL OTP GENERATED")
        print("Email:", email)
        print("OTP:", otp)
        print("=" * 60)
        print("")

        return jsonify({

            "success": True,

            "message":
                "Email OTP generated successfully.",

            # DEMO ONLY
            "demo_otp": otp

        }), 200

    except Exception as error:

        print(
            "SEND EMAIL OTP ERROR:",
            error
        )

        return jsonify({

            "success": False,

            "error":
                "Unable to generate email OTP."

        }), 500


# =========================================================
# EMAIL - VERIFY OTP
# =========================================================

@app.route("/api/verify-email-otp", methods=["POST"])
def verify_email_otp():

    try:

        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "error": "Request body is empty."
            }), 400

        email = str(
            data.get("email", "")
        ).strip().lower()

        otp = str(
            data.get("otp", "")
        ).strip()

        if not email:

            return jsonify({
                "success": False,
                "error": "Email address is required."
            }), 400

        if not otp:

            return jsonify({
                "success": False,
                "error": "OTP is required."
            }), 400

        key = "email:" + email

        valid, message = check_otp(
            key,
            otp
        )

        if not valid:

            return jsonify({
                "success": False,
                "error": message
            }), 400

        # Random success messages
        security_messages = [

            "Your email address has been securely linked to ScamDetect AI.",

            "Email verification completed successfully. Your security profile is active.",

            "Your trusted email contact has been successfully verified.",

            "Security verification completed. Your email is now linked.",

            "Your ScamDetect AI profile has been successfully protected."

        ]

        success_message = random.choice(
            security_messages
        )

        return jsonify({

            "success": True,

            "message": success_message,

            "email": email

        }), 200

    except Exception as error:

        print(
            "VERIFY EMAIL OTP ERROR:",
            error
        )

        return jsonify({

            "success": False,

            "error":
                "Unable to verify email OTP."

        }), 500


# =========================================================
# MESSAGE ANALYZER
# =========================================================

@app.route("/api/analyze", methods=["POST"])
def analyze():

    try:

        data = request.get_json(silent=True)

        if not data:

            return jsonify({

                "success": False,

                "error":
                    "Request body is empty."

            }), 400

        message = data.get(
            "message",
            ""
        )

        if not isinstance(
            message,
            str
        ):

            return jsonify({

                "success": False,

                "error":
                    "Message must be text."

            }), 400

        message = message.strip()

        if not message:

            return jsonify({

                "success": False,

                "error":
                    "Please provide a message."

            }), 400

        if len(message) > 10000:

            return jsonify({

                "success": False,

                "error":
                    "Message is too long. Maximum length is 10,000 characters."

            }), 400

        # Analyze scam message
        result = analyze_message(message)

        return jsonify({

            "success": True,

            "result": result

        }), 200

    except Exception as error:

        print(
            "ANALYZE ERROR:",
            error
        )

        return jsonify({

            "success": False,

            "error":
                "An internal error occurred while analyzing the message."

        }), 500


# =========================================================
# ERROR HANDLER
# =========================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({

        "success": False,

        "error":
            "API endpoint not found."

    }), 404


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":

    print("")
    print("=" * 60)
    print("             ScamDetect AI Backend")
    print("=" * 60)
    print("")
    print("Server starting...")
    print("")
    print("Health check:")
    print("http://127.0.0.1:5000/api/health")
    print("")
    print("Phone OTP:")
    print("POST /api/send-phone-otp")
    print("POST /api/verify-phone-otp")
    print("")
    print("Email OTP:")
    print("POST /api/send-email-otp")
    print("POST /api/verify-email-otp")
    print("")
    print("Message Analyzer:")
    print("POST /api/analyze")
    print("")
    print("=" * 60)
    print("")

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )