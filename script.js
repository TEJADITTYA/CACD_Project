const messageInput = document.getElementById("messageInput");
const charCount = document.getElementById("charCount");

messageInput.addEventListener("input", function () {
    charCount.textContent = `${messageInput.value.length} characters`;
});


function scrollToAnalyzer() {
    document.getElementById("analyzer").scrollIntoView({
        behavior: "smooth"
    });
}


function scrollToFeatures() {
    document.getElementById("features").scrollIntoView({
        behavior: "smooth"
    });
}


function clearMessage() {

    messageInput.value = "";

    charCount.textContent = "0 characters";

    document.getElementById("emptyState").style.display = "flex";

    document.getElementById("resultContent").style.display = "none";
}


function loadExample() {

    const example = `URGENT! Congratulations! You have won ₹50,000 in our special lottery.

To claim your prize immediately, send your OTP and UPI details to our support team.

Click https://bit.ly/claim-prize now. Your reward will expire today!`;

    messageInput.value = example;

    charCount.textContent =
        `${example.length} characters`;

    messageInput.focus();
}


function analyzeMessage() {

    const message = messageInput.value.trim();

    if (!message) {

        alert("Please paste a suspicious message first.");

        return;
    }


    const lowerMessage = message.toLowerCase();

    let score = 0;

    let indicators = [];


    // URGENCY

    const urgencyWords = [
        "urgent",
        "immediately",
        "act now",
        "hurry",
        "expires today",
        "limited time",
        "last chance"
    ];

    if (containsAny(lowerMessage, urgencyWords)) {

        score += 20;

        indicators.push({
            title: "⏰ Urgency Tactic",
            description:
                "The message attempts to pressure you into acting quickly.",
            match: "Urgency language detected"
        });
    }


    // OTP / PASSWORD

    const credentialWords = [
        "otp",
        "password",
        "pin",
        "cvv",
        "verification code",
        "security code"
    ];

    if (containsAny(lowerMessage, credentialWords)) {

        score += 30;

        indicators.push({
            title: "🔐 Credential / OTP Request",
            description:
                "The message references sensitive authentication information.",
            match: "OTP or credential-related terms detected"
        });
    }


    // FINANCIAL

    const financialWords = [
        "send money",
        "payment",
        "upi",
        "bank account",
        "credit card",
        "debit card",
        "refund",
        "transfer money",
        "pay now"
    ];

    if (containsAny(lowerMessage, financialWords)) {

        score += 20;

        indicators.push({
            title: "💳 Financial Request",
            description:
                "The message contains financial or payment-related language.",
            match: "Financial terms detected"
        });
    }


    // PRIZE

    const prizeWords = [
        "winner",
        "won",
        "lottery",
        "prize",
        "reward",
        "congratulations",
        "free gift",
        "cash prize"
    ];

    if (containsAny(lowerMessage, prizeWords)) {

        score += 20;

        indicators.push({
            title: "🎁 Prize / Reward Scam",
            description:
                "The message contains suspicious prize or reward claims.",
            match: "Prize-related language detected"
        });
    }


    // IMPERSONATION

    const impersonationWords = [
        "official",
        "support team",
        "customer care",
        "bank manager",
        "instagram support",
        "facebook support",
        "government",
        "admin"
    ];

    if (containsAny(lowerMessage, impersonationWords)) {

        score += 15;

        indicators.push({
            title: "🎭 Possible Impersonation",
            description:
                "The sender may be pretending to represent an official organization.",
            match: "Authority or support identity detected"
        });
    }


    // INVESTMENT

    const investmentWords = [
        "guaranteed profit",
        "double your money",
        "investment",
        "crypto",
        "bitcoin",
        "forex",
        "guaranteed return"
    ];

    if (containsAny(lowerMessage, investmentWords)) {

        score += 20;

        indicators.push({
            title: "📈 Investment Scam",
            description:
                "The message contains potentially suspicious financial opportunity claims.",
            match: "Investment-related language detected"
        });
    }


    // LINKS

    const urlPattern =
        /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

    const urls = message.match(urlPattern);

    if (urls) {

        score += 15;

        indicators.push({
            title: "🔗 External Link",
            description:
                "The message contains a link. Verify the destination before opening it.",
            match: urls.join(", ")
        });
    }


    // THREATS

    const threatWords = [
        "account will be blocked",
        "account suspended",
        "legal action",
        "police complaint",
        "arrest",
        "account will be deleted"
    ];

    if (containsAny(lowerMessage, threatWords)) {

        score += 20;

        indicators.push({
            title: "⚠ Threat / Account Manipulation",
            description:
                "The message uses threats or account-related consequences.",
            match: "Threatening language detected"
        });
    }


    score = Math.min(score, 100);


    let risk;

    if (score >= 70) {
        risk = "Critical Risk";
    } else if (score >= 45) {
        risk = "High Risk";
    } else if (score >= 20) {
        risk = "Medium Risk";
    } else {
        risk = "Low Risk";
    }


    let summary;

    if (score >= 70) {

        summary =
            "This message contains several strong indicators commonly associated with scams and social engineering.";

    } else if (score >= 45) {

        summary =
            "Multiple suspicious characteristics were detected. Verify the sender before taking any action.";

    } else if (score >= 20) {

        summary =
            "Some potentially suspicious patterns were detected. Proceed carefully.";

    } else {

        summary =
            "No major scam indicators were detected, but unexpected messages should still be treated carefully.";
    }


    let recommendation;

    if (score >= 70) {

        recommendation =
            "Do not click links, send money, share OTPs or provide personal information. Verify the sender through an official channel.";

    } else if (score >= 45) {

        recommendation =
            "Do not provide sensitive information. Independently verify the sender and any links before responding.";

    } else if (score >= 20) {

        recommendation =
            "Be cautious and verify the message before taking any action.";

    } else {

        recommendation =
            "The message appears relatively low risk, but continue to exercise caution.";
    }


    displayResults(
        score,
        risk,
        summary,
        recommendation,
        indicators
    );
}


function containsAny(message, words) {

    return words.some(word =>
        message.includes(word)
    );
}


function displayResults(
    score,
    risk,
    summary,
    recommendation,
    indicators
) {

    document.getElementById("emptyState").style.display = "none";

    document.getElementById("resultContent").style.display = "block";


    document.getElementById("riskTitle").textContent = risk;

    document.getElementById("riskScore").textContent = score;

    document.getElementById("summaryText").textContent = summary;

    document.getElementById("recommendationText").textContent =
        recommendation;


    const progress =
        document.getElementById("riskProgress");

    progress.style.width = `${score}%`;


    const scoreCircle =
        document.querySelector(".score-circle");


    if (score >= 70) {

        scoreCircle.style.borderColor = "#ef4444";

        document.getElementById("riskTitle").style.color =
            "#ff6b6b";

        progress.style.background = "#ef4444";

    } else if (score >= 45) {

        scoreCircle.style.borderColor = "#f97316";

        document.getElementById("riskTitle").style.color =
            "#fb923c";

        progress.style.background = "#f97316";

    } else if (score >= 20) {

        scoreCircle.style.borderColor = "#eab308";

        document.getElementById("riskTitle").style.color =
            "#facc15";

        progress.style.background = "#eab308";

    } else {

        scoreCircle.style.borderColor = "#22c55e";

        document.getElementById("riskTitle").style.color =
            "#4ade80";

        progress.style.background = "#22c55e";
    }


    const indicatorsContainer =
        document.getElementById("indicators");

    indicatorsContainer.innerHTML = "";


    if (indicators.length === 0) {

        indicatorsContainer.innerHTML = `
            <div class="indicator"
                 style="border-left-color:#22c55e">

                <h4>🟢 No Major Threats Detected</h4>

                <p>
                    No significant scam indicators were found.
                </p>

            </div>
        `;

        return;
    }


    indicators.forEach(indicator => {

        const div = document.createElement("div");

        div.className = "indicator";

        div.innerHTML = `
            <h4>${indicator.title}</h4>

            <p>
                ${indicator.description}
            </p>

            <span>
                ${indicator.match}
            </span>
        `;

        indicatorsContainer.appendChild(div);

    });

}

async function analyzeMessage() {

    const message = messageInput.value.trim();

    if (!message) {

        alert("Please paste a suspicious message first.");

        return;
    }


    const button =
        document.querySelector(".analyze-button");


    button.disabled = true;

    button.textContent = "🔄 Analyzing...";


    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/analyze",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: message
                })
            }
        );


        const data = await response.json();


        if (!response.ok || !data.success) {

            alert(
                data.error ||
                "Unable to analyze the message."
            );

            return;
        }


        const result = data.result;


        displayBackendResults(result);


    } catch (error) {

        console.error(error);

        alert(
            "Cannot connect to ScamDetect AI backend. " +
            "Make sure the Flask server is running."
        );

    } finally {

        button.disabled = false;

        button.textContent =
            "🛡 Analyze Message";

    }
}