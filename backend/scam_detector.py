import re
from urllib.parse import urlparse


# ==============================
# SCAM INDICATOR KEYWORDS
# ==============================

URGENCY_KEYWORDS = [
    "urgent",
    "immediately",
    "act now",
    "hurry",
    "quickly",
    "limited time",
    "last chance",
    "expires today",
    "within 24 hours",
    "do it now"
]


IMPERSONATION_KEYWORDS = [
    "official",
    "support team",
    "customer care",
    "customer support",
    "bank manager",
    "bank support",
    "instagram support",
    "facebook support",
    "whatsapp support",
    "government",
    "police",
    "admin",
    "security team"
]


FINANCIAL_KEYWORDS = [
    "send money",
    "transfer money",
    "bank account",
    "credit card",
    "debit card",
    "upi",
    "payment",
    "pay now",
    "refund",
    "cash",
    "loan",
    "processing fee",
    "registration fee",
    "joining fee"
]


CREDENTIAL_KEYWORDS = [
    "password",
    "otp",
    "one time password",
    "pin",
    "cvv",
    "verification code",
    "security code",
    "login details",
    "username",
    "account password"
]


PRIZE_KEYWORDS = [
    "winner",
    "won",
    "lottery",
    "prize",
    "reward",
    "congratulations",
    "free gift",
    "cash prize",
    "lucky winner"
]


INVESTMENT_KEYWORDS = [
    "investment",
    "guaranteed profit",
    "double your money",
    "trading",
    "crypto",
    "bitcoin",
    "forex",
    "guaranteed return",
    "passive income",
    "high return"
]


JOB_SCAM_KEYWORDS = [
    "work from home",
    "part time job",
    "earn money",
    "easy money",
    "job opportunity",
    "registration fee",
    "joining fee",
    "earn daily",
    "daily income"
]


THREAT_KEYWORDS = [
    "account will be blocked",
    "account suspended",
    "legal action",
    "police complaint",
    "arrest",
    "account will be deleted",
    "account will be closed",
    "verify immediately"
]


SUSPICIOUS_DOMAIN_PATTERNS = [
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "goo.gl",
    "cutt.ly",
    "is.gd",
    "shorturl.at"
]


# ==============================
# HELPER FUNCTIONS
# ==============================

def find_keywords(message, keywords):

    message_lower = message.lower()

    return [
        keyword
        for keyword in keywords
        if keyword in message_lower
    ]


def extract_urls(message):

    pattern = r'https?://[^\s]+|www\.[^\s]+'

    return re.findall(pattern, message)


def analyze_urls(urls):

    suspicious_urls = []

    for url in urls:

        clean_url = url.rstrip(".,!?")

        reasons = []

        try:

            parsed_url = urlparse(
                clean_url
                if clean_url.startswith("http")
                else "http://" + clean_url
            )

            domain = parsed_url.netloc.lower()

            # URL shortener
            for suspicious_domain in SUSPICIOUS_DOMAIN_PATTERNS:

                if suspicious_domain in domain:

                    reasons.append(
                        "URL shortener detected"
                    )

                    break

            # @ symbol
            if "@" in clean_url:

                reasons.append(
                    "URL contains @ symbol"
                )

            # Very long URL
            if len(clean_url) > 100:

                reasons.append(
                    "Unusually long URL"
                )

            # Multiple hyphens
            if domain.count("-") >= 2:

                reasons.append(
                    "Domain contains multiple hyphens"
                )

            # IP address instead of domain
            ip_pattern = (
                r"^(?:\d{1,3}\.){3}\d{1,3}$"
            )

            if re.match(ip_pattern, domain):

                reasons.append(
                    "URL uses an IP address"
                )

            if reasons:

                suspicious_urls.append({
                    "url": clean_url,
                    "domain": domain,
                    "reasons": reasons
                })

        except Exception:

            suspicious_urls.append({
                "url": clean_url,
                "domain": "Unknown",
                "reasons": [
                    "Unable to validate URL"
                ]
            })

    return suspicious_urls


# ==============================
# MAIN ANALYSIS
# ==============================

def analyze_message(message):

    score = 0

    indicators = []


    # --------------------------
    # URGENCY
    # --------------------------

    urgency = find_keywords(
        message,
        URGENCY_KEYWORDS
    )

    if urgency:

        score += min(
            len(urgency) * 10,
            20
        )

        indicators.append({

            "type": "Urgency Tactic",

            "severity": "Medium",

            "description":
                "The message attempts to pressure "
                "the recipient into acting quickly.",

            "matches": urgency

        })


    # --------------------------
    # IMPERSONATION
    # --------------------------

    impersonation = find_keywords(
        message,
        IMPERSONATION_KEYWORDS
    )

    if impersonation:

        score += min(
            len(impersonation) * 10,
            20
        )

        indicators.append({

            "type": "Possible Impersonation",

            "severity": "High",

            "description":
                "The sender may be pretending to "
                "represent an organization or authority.",

            "matches": impersonation

        })


    # --------------------------
    # FINANCIAL
    # --------------------------

    financial = find_keywords(
        message,
        FINANCIAL_KEYWORDS
    )

    if financial:

        score += min(
            len(financial) * 8,
            20
        )

        indicators.append({

            "type": "Financial Request",

            "severity": "High",

            "description":
                "The message contains financial "
                "or payment-related language.",

            "matches": financial

        })


    # --------------------------
    # CREDENTIALS
    # --------------------------

    credentials = find_keywords(
        message,
        CREDENTIAL_KEYWORDS
    )

    if credentials:

        score += min(
            len(credentials) * 15,
            30
        )

        indicators.append({

            "type": "Credential / OTP Request",

            "severity": "Critical",

            "description":
                "The message references sensitive "
                "authentication information.",

            "matches": credentials

        })


    # --------------------------
    # PRIZE
    # --------------------------

    prizes = find_keywords(
        message,
        PRIZE_KEYWORDS
    )
    if prizes:

        score += min(
            len(prizes) * 8,
            20
        )

        indicators.append({

            "type": "Prize / Reward Scam",

            "severity": "High",

            "description":
                "The message contains prize, reward, "
                "or lottery-related claims.",

            "matches": prizes

        })


    # --------------------------
    # INVESTMENT
    # --------------------------

    investments = find_keywords(
        message,
        INVESTMENT_KEYWORDS
    )

    if investments:

        score += min(
            len(investments) * 8,
            20
        )

        indicators.append({

            "type": "Investment Scam",

            "severity": "High",

            "description":
                "The message contains potentially "
                "suspicious investment or profit claims.",

            "matches": investments

        })


    # --------------------------
    # JOB SCAM
    # --------------------------

    jobs = find_keywords(
        message,
        JOB_SCAM_KEYWORDS
    )

    if jobs:

        score += min(
            len(jobs) * 7,
            20
        )

        indicators.append({

            "type": "Possible Job Scam",

            "severity": "Medium",

            "description":
                "The message contains patterns commonly "
                "associated with fraudulent job offers.",

            "matches": jobs

        })


    # --------------------------
    # THREATS
    # --------------------------

    threats = find_keywords(
        message,
        THREAT_KEYWORDS
    )

    if threats:

        score += min(
            len(threats) * 12,
            25
        )

        indicators.append({

            "type": "Threat / Account Manipulation",

            "severity": "High",

            "description":
                "The message uses threats or account "
                "consequences to pressure the recipient.",

            "matches": threats

        })


    # --------------------------
    # URL ANALYSIS
    # --------------------------

    urls = extract_urls(message)

    suspicious_urls = analyze_urls(urls)


    if urls:

        score += min(
            len(urls) * 5,
            15
        )

        indicators.append({

            "type": "External Link",

            "severity": "Medium",

            "description":
                "The message contains an external link. "
                "Verify the destination before opening it.",

            "matches": urls

        })


    if suspicious_urls:

        score += min(
            len(suspicious_urls) * 15,
            30
        )

        indicators.append({

            "type": "Suspicious Link",

            "severity": "High",

            "description":
                "One or more links contain characteristics "
                "that deserve additional verification.",

            "matches": suspicious_urls

        })


    # ==============================
    # FINAL SCORE
    # ==============================

    score = min(score, 100)


    # ==============================
    # RISK LEVEL
    # ==============================

    if score >= 70:

        risk_level = "Critical"

        risk_class = "critical"

    elif score >= 45:

        risk_level = "High"

        risk_class = "high"

    elif score >= 20:

        risk_level = "Medium"

        risk_class = "medium"

    else:

        risk_level = "Low"

        risk_class = "low"


    # ==============================
    # SUMMARY
    # ==============================

    if not indicators:

        summary = (
            "No major scam indicators were "
            "detected in this message."
        )

    elif score >= 70:

        summary = (
            "This message contains several strong "
            "indicators associated with potential "
            "scams or social engineering."
        )

    elif score >= 45:

        summary = (
            "This message contains multiple "
            "suspicious characteristics and "
            "should be independently verified."
        )

    elif score >= 20:

        summary = (
            "This message contains some potentially "
            "suspicious patterns."
        )

    else:

        summary = (
            "Only a small number of potentially "
            "suspicious patterns were detected."
        )


    # ==============================
    # RECOMMENDATION
    # ==============================

    if score >= 70:

        recommendation = (
            "Do not respond, click links, send money, "
            "or provide OTPs and personal information. "
            "Verify the sender through an official channel."
        )

    elif score >= 45:

        recommendation = (
            "Be cautious. Do not share sensitive "
            "information and independently verify "
            "the sender and any links."
        )

    elif score >= 20:

        recommendation = (
            "Some suspicious characteristics were "
            "detected. Verify the message before "
            "taking action."
        )

    else:

        recommendation = (
            "No major scam indicators were detected, "
            "but remain cautious with unexpected messages."
        )


    return {

        "risk_score": score,

        "risk_level": risk_level,

        "risk_class": risk_class,

        "summary": summary,

        "indicators": indicators,

        "urls": urls,

        "suspicious_urls": suspicious_urls,

        "recommendation": recommendation

    }