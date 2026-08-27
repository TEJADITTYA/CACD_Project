function scanURL() {

    const input =
        document.getElementById("urlInput");

    const error =
        document.getElementById("error");

    const result =
        document.getElementById("result");

    const url = input.value.trim();

    error.textContent = "";

    if (!url) {

        error.textContent =
            "Please enter a URL.";

        return;
    }

    let parsedURL;

    try {

        parsedURL =
            new URL(
                url.startsWith("http")
                    ? url
                    : "https://" + url
            );

    } catch {

        error.textContent =
            "Please enter a valid URL.";

        return;
    }


    const hostname =
        parsedURL.hostname.toLowerCase();


    let score = 5;

    let reasons = [];


    // HTTP instead of HTTPS
    if (
        parsedURL.protocol === "http:"
    ) {

        score += 25;

        reasons.push(
            "Website does not use HTTPS."
        );
    }


    // Suspicious keywords
    const suspiciousWords = [

        "login",
        "verify",
        "account",
        "secure",
        "update",
        "claim",
        "winner",
        "prize",
        "free",
        "gift",
        "bonus",
        "bank",
        "payment"

    ];


    suspiciousWords.forEach(
        word => {

            if (
                hostname.includes(word)
            ) {

                score += 8;

                reasons.push(
                    `Suspicious keyword detected: "${word}".`
                );

            }

        }
    );


    // Suspicious TLDs
    const suspiciousTLDs = [
        ".xyz",
        ".top",
        ".click",
        ".win",
        ".tk",
        ".gq"
    ];


    suspiciousTLDs.forEach(
        tld => {

            if (
                hostname.endsWith(tld)
            ) {

                score += 20;

                reasons.push(
                    `Potentially suspicious domain extension: ${tld}`
                );

            }

        }
    );


    // IP address instead of domain
    const ipPattern =
        /^(\d{1,3}\.){3}\d{1,3}$/;


    if (
        ipPattern.test(hostname)
    ) {

        score += 30;

        reasons.push(
            "URL uses an IP address instead of a normal domain."
        );

    }


    // Too many subdomains
    const parts =
        hostname.split(".");

    if (parts.length >= 4) {

        score += 15;

        reasons.push(
            "URL contains an unusually large number of subdomains."
        );

    }


    // Long URL
    if (url.length > 100) {

        score += 10;

        reasons.push(
            "URL is unusually long."
        );

    }


    score =
        Math.min(score, 100);


    let risk;

    if (score >= 70) {

        risk = "HIGH";

    } else if (score >= 40) {

        risk = "MEDIUM";

    } else {

        risk = "LOW";

    }


    displayResult(
        risk,
        score,
        reasons,
        hostname
    );
}


function displayResult(
    risk,
    score,
    reasons,
    hostname
) {

    const result =
        document.getElementById("result");

    const icon =
        document.getElementById("riskIcon");

    const title =
        document.getElementById("riskTitle");

    const scoreElement =
        document.getElementById("riskScore");

    const reasonsContainer =
        document.getElementById("reasons");

    const recommendation =
        document.getElementById(
            "recommendationText"
        );


    result.style.display = "block";


    if (risk === "HIGH") {

        icon.textContent = "🚨";

        title.textContent =
            "High Risk Link Detected";

        recommendation.textContent =
            "Do not open this link or provide personal, financial or login information.";

    } else if (risk === "MEDIUM") {

        icon.textContent = "⚠️";

        title.textContent =
            "Potentially Suspicious Link";

        recommendation.textContent =
            "Verify the website independently before entering sensitive information.";

    } else {

        icon.textContent = "🛡️";

        title.textContent =
            "Low Risk Link";

        recommendation.textContent =
            "No major suspicious patterns were detected. Continue to stay cautious.";

    }


    scoreElement.textContent =
        `${score}/100`;


    reasonsContainer.innerHTML = "";


    if (reasons.length === 0) {

        reasonsContainer.innerHTML =
            `<div class="reason">
                ✓ No obvious suspicious patterns detected.
            </div>`;

    } else {

        reasons.forEach(
            reason => {

                const div =
                    document.createElement(
                        "div"
                    );

                div.className =
                    "reason";

                div.textContent =
                    "⚠ " + reason;

                reasonsContainer.appendChild(
                    div
                );

            }
        );

    }

}


function loadExample(number) {

    const input =
        document.getElementById(
            "urlInput"
        );


    if (number === 1) {

        input.value =
            "http://claim-free-prize.xyz/winner";

    }


    if (number === 2) {

        input.value =
            "http://secure-bank-login.top/verify";

    }


    if (number === 3) {

        input.value =
            "https://www.wikipedia.org";

    }

}