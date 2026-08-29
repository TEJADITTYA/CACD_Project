const messageInput = document.getElementById("messageInput");
const charCount = document.getElementById("charCount");
const emptyState = document.getElementById("emptyState");
const resultContent = document.getElementById("resultContent");

if (messageInput && charCount) {
    messageInput.addEventListener("input", function () {
        charCount.textContent = `${messageInput.value.length} characters`;
    });
}

function scrollToAnalyzer() {
    const analyzer = document.getElementById("analyzer");
    if (analyzer) {
        analyzer.scrollIntoView({ behavior: "smooth" });
    }
}

function scrollToFeatures() {
    const features = document.getElementById("features");
    if (features) {
        features.scrollIntoView({ behavior: "smooth" });
    }
}

function clearMessage() {
    if (!messageInput || !charCount) return;

    messageInput.value = "";
    charCount.textContent = "0 characters";

    if (emptyState) {
        emptyState.style.display = "flex";
    }

    if (resultContent) {
        resultContent.style.display = "none";
    }
}

function loadExample() {
    if (!messageInput || !charCount) return;

    const example = `URGENT! Congratulations! You have won ₹50,000 in our special lottery.

To claim your prize immediately, send your OTP and UPI details to our support team.

Click https://bit.ly/claim-prize now. Your reward will expire today!`;

    messageInput.value = example;
    charCount.textContent = `${example.length} characters`;
    messageInput.focus();
}

function containsAny(message, words) {
    return words.some((word) => message.includes(word));
}

const homeHero = document.querySelector('.hero');
const particleLayer = document.querySelector('.particle-layer');
const parallaxLayers = document.querySelectorAll('[data-parallax]');

if (homeHero && particleLayer) {
    const particles = 38;

    for (let i = 0; i < particles; i += 1) {
        const particle = document.createElement('span');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.width = `${2 + Math.random() * 6}px`;
        particle.style.height = particle.style.width;
        particle.style.animationDelay = `${Math.random() * 6}s`;
        particle.style.animationDuration = `${5 + Math.random() * 9}s`;
        particle.style.opacity = String(0.4 + Math.random() * 0.6);
        particleLayer.appendChild(particle);
    }

    const updateHeroMotion = () => {
        const rect = homeHero.getBoundingClientRect();
        const scrollRatio = Math.min(Math.max((window.innerHeight - rect.top) / (window.innerHeight + rect.height), -0.6), 1);

        homeHero.style.setProperty('--hero-shift-x', `${((scrollRatio - 0.5) * 26)}px`);
        homeHero.style.setProperty('--hero-shift-y', `${((scrollRatio - 0.35) * 18)}px`);
        homeHero.style.setProperty('--glow-shift', `${scrollRatio * 22}px`);
    };

    updateHeroMotion();
    window.addEventListener('scroll', updateHeroMotion, { passive: true });

    window.addEventListener('pointermove', (event) => {
        const x = (event.clientX / window.innerWidth - 0.5) * 24;
        const y = (event.clientY / window.innerHeight - 0.5) * 20;
        homeHero.style.setProperty('--hero-shift-x', `${x}px`);
        homeHero.style.setProperty('--hero-shift-y', `${y}px`);
        homeHero.style.setProperty('--glow-shift', `${x * 0.8}px`);
    }, { passive: true });
}

if (parallaxLayers.length) {
    const updateParallax = () => {
        parallaxLayers.forEach((layer) => {
            const rect = layer.getBoundingClientRect();
            const offset = (window.innerHeight - rect.top) * 0.08;
            const depth = Number(layer.dataset.parallax || 1);
            layer.style.transform = `translate3d(0, ${offset * depth}px, 0)`;
        });
    };

    updateParallax();
    window.addEventListener('scroll', updateParallax, { passive: true });
}

function analyzeMessage() {
    if (!messageInput || !charCount) return;

    const message = messageInput.value.trim();
    if (!message) {
        alert("Please paste a suspicious message first.");
        return;
    }

    const lowerMessage = message.toLowerCase();
    let score = 0;
    const indicators = [];

    const urgencyWords = ["urgent", "immediately", "act now", "hurry", "expires today", "limited time", "last chance"];
    if (containsAny(lowerMessage, urgencyWords)) {
        score += 20;
        indicators.push({
            title: "⏰ Urgency Tactic",
            description: "The message attempts to pressure you into acting quickly.",
            match: "Urgency language detected"
        });
    }

    const credentialWords = ["otp", "password", "pin", "cvv", "verification code", "security code"];
    if (containsAny(lowerMessage, credentialWords)) {
        score += 30;
        indicators.push({
            title: "🔐 Credential / OTP Request",
            description: "The message references sensitive authentication information.",
            match: "OTP or credential-related terms detected"
        });
    }

    const financialWords = ["send money", "payment", "upi", "bank account", "credit card", "debit card", "refund", "transfer money", "pay now"];
    if (containsAny(lowerMessage, financialWords)) {
        score += 20;
        indicators.push({
            title: "💳 Financial Request",
            description: "The message contains financial or payment-related language.",
            match: "Financial terms detected"
        });
    }

    const prizeWords = ["winner", "won", "lottery", "prize", "reward", "congratulations", "free gift", "cash prize"];
    if (containsAny(lowerMessage, prizeWords)) {
        score += 20;
        indicators.push({
            title: "🎁 Prize / Reward Scam",
            description: "The message contains suspicious prize or reward claims.",
            match: "Prize-related language detected"
        });
    }

    const impersonationWords = ["official", "support team", "customer care", "bank manager", "instagram support", "facebook support", "government", "admin"];
    if (containsAny(lowerMessage, impersonationWords)) {
        score += 15;
        indicators.push({
            title: "🎭 Possible Impersonation",
            description: "The sender may be pretending to represent an official organization.",
            match: "Authority or support identity detected"
        });
    }

    const investmentWords = ["guaranteed profit", "double your money", "investment", "crypto", "bitcoin", "forex", "guaranteed return"];
    if (containsAny(lowerMessage, investmentWords)) {
        score += 20;
        indicators.push({
            title: "📈 Investment Scam",
            description: "The message contains potentially suspicious financial opportunity claims.",
            match: "Investment-related language detected"
        });
    }

    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    const urls = message.match(urlPattern);
    if (urls) {
        score += 15;
        indicators.push({
            title: "🔗 External Link",
            description: "The message contains a link. Verify the destination before opening it.",
            match: urls.join(", ")
        });
    }

    const threatWords = ["account will be blocked", "account suspended", "legal action", "police complaint", "arrest", "account will be deleted"];
    if (containsAny(lowerMessage, threatWords)) {
        score += 20;
        indicators.push({
            title: "⚠ Threat / Account Manipulation",
            description: "The message uses threats or account-related consequences.",
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
        summary = "This message contains several strong indicators commonly associated with scams and social engineering.";
    } else if (score >= 45) {
        summary = "Multiple suspicious characteristics were detected. Verify the sender before taking any action.";
    } else if (score >= 20) {
        summary = "Some potentially suspicious patterns were detected. Proceed carefully.";
    } else {
        summary = "No major scam indicators were detected, but unexpected messages should still be treated carefully.";
    }

    let recommendation;
    if (score >= 70) {
        recommendation = "Do not click links, send money, share OTPs or provide personal information. Verify the sender through an official channel.";
    } else if (score >= 45) {
        recommendation = "Do not provide sensitive information. Independently verify the sender and any links before responding.";
    } else if (score >= 20) {
        recommendation = "Be cautious and verify the message before taking any action.";
    } else {
        recommendation = "The message appears relatively low risk, but continue to exercise caution.";
    }

    if (emptyState) emptyState.style.display = "none";
    if (resultContent) resultContent.style.display = "block";

    const riskTitle = document.getElementById("riskTitle");
    const riskScore = document.getElementById("riskScore");
    const summaryText = document.getElementById("summaryText");
    const recommendationText = document.getElementById("recommendationText");
    const riskProgress = document.getElementById("riskProgress");
    const scoreCircle = document.querySelector(".score-circle");
    const indicatorsContainer = document.getElementById("indicators");

    if (riskTitle) riskTitle.textContent = risk;
    if (riskScore) riskScore.textContent = score;
    if (summaryText) summaryText.textContent = summary;
    if (recommendationText) recommendationText.textContent = recommendation;
    if (riskProgress) riskProgress.style.width = `${score}%`;

    if (score >= 70) {
        if (scoreCircle) scoreCircle.style.borderColor = "#ef4444";
        if (riskTitle) riskTitle.style.color = "#ff6b6b";
        if (riskProgress) riskProgress.style.background = "#ef4444";
    } else if (score >= 45) {
        if (scoreCircle) scoreCircle.style.borderColor = "#f97316";
        if (riskTitle) riskTitle.style.color = "#fb923c";
        if (riskProgress) riskProgress.style.background = "#f97316";
    } else if (score >= 20) {
        if (scoreCircle) scoreCircle.style.borderColor = "#eab308";
        if (riskTitle) riskTitle.style.color = "#facc15";
        if (riskProgress) riskProgress.style.background = "#eab308";
    } else {
        if (scoreCircle) scoreCircle.style.borderColor = "#22c55e";
        if (riskTitle) riskTitle.style.color = "#4ade80";
        if (riskProgress) riskProgress.style.background = "#22c55e";
    }

    if (indicatorsContainer) {
        indicatorsContainer.innerHTML = "";

        if (indicators.length === 0) {
            indicatorsContainer.innerHTML = `
                <div class="indicator" style="border-left-color:#22c55e">
                    <h4>🟢 No Major Threats Detected</h4>
                    <p>No significant scam indicators were found.</p>
                </div>
            `;
            return;
        }

        indicators.forEach((indicator) => {
            const div = document.createElement("div");
            div.className = "indicator";
            div.innerHTML = `
                <h4>${indicator.title}</h4>
                <p>${indicator.description}</p>
                <span>${indicator.match}</span>
            `;
            indicatorsContainer.appendChild(div);
        });
    }
}

