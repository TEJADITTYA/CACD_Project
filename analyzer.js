const messageInput = document.getElementById("messageInput");
const charCount = document.getElementById("charCount");


// ==========================================
// CHARACTER COUNT
// ==========================================

messageInput.addEventListener("input", () => {
    charCount.textContent = `${messageInput.value.length} characters`;
});

function updateAnalysisStage(index) {
    const stages = document.getElementById("analysisStages");
    if (!stages) return;
    stages.hidden = false;
    stages.querySelectorAll("[data-stage]").forEach(stage => {
        stage.classList.toggle("active", Number(stage.dataset.stage) === index);
    });
}


// ==========================================
// SCAM EXAMPLES
// ==========================================

const scamExamples = {

    prize: `Congratulations! 🎉 You have been selected as the lucky winner of ₹50,000.

To claim your prize, send your OTP and UPI details immediately.

Click this link now:
https://bit.ly/claim-reward

Hurry! Your reward expires today.`,

    bank: `URGENT: Your SBI bank account will be blocked today due to incomplete KYC verification.

Verify your account immediately by clicking the link below:

https://sbi-verify-account.example.com

Enter your account number, ATM PIN and OTP to complete verification.`,

    upi: `Your UPI payment of ₹24,999 has been initiated successfully.

If you did not make this transaction, call our customer support immediately at 9876543210.

Share the OTP received on your phone to cancel the transaction.`,

    otp: `Your account has been selected for a security upgrade.

To prevent your account from being suspended, please share the 6-digit OTP sent to your mobile number with our support executive.

This request must be completed within 10 minutes.`,

    job: `Congratulations! Your profile has been shortlisted for a work-from-home job.

You can earn ₹50,000 per month by working only 2 hours a day.

To activate your employee account, pay a refundable registration fee of ₹2,499.

Send the payment screenshot to confirm your position.`,

    delivery: `Your package could not be delivered because your address is incomplete.

Please pay ₹35 delivery verification charges using the link below:

https://delivery-update.example.com

Your package will be returned if payment is not completed within 2 hours.`,

    investment: `Exclusive Investment Opportunity!

Invest ₹5,000 today and receive ₹25,000 guaranteed within 7 days.

Our AI trading system has a 100% success rate.

Limited slots available!

Send your money to the UPI ID below to reserve your account.`,

    tech: `WARNING: Your computer has been infected with a dangerous virus.

Microsoft Security has detected suspicious activity on your device.

Call our technical support immediately at 1800-123-4567.

Do not turn off your computer or your files may be permanently deleted.`,

    loan: `Your personal loan of ₹5,00,000 has been PRE-APPROVED!

Complete your verification today to receive the money instantly.

Pay a processing fee of ₹3,999 to activate your loan.

Click here to complete the process:

https://quick-loan.example.com`,

    social: `Hi! This is the official support team.

We detected unusual activity on your Instagram account.

Your account will be permanently deleted within 24 hours unless you verify your identity.

Send us your password and OTP to restore your account:

https://instagram-security.example.com`
};


// ==========================================
// LOAD EXAMPLE
// ==========================================

function loadSelectedExample() {

    const selected = document.getElementById("exampleSelect").value;

    if (!selected) {
        alert("Please select an example first.");
        return;
    }

    const message = scamExamples[selected];

    messageInput.value = message;

    charCount.textContent = `${message.length} characters`;

    // Automatically analyze
    analyzeMessage();
}


// ==========================================
// CLEAR MESSAGE
// ==========================================

function clearMessage() {

    messageInput.value = "";

    charCount.textContent = "0 characters";

    document.getElementById("emptyState").style.display = "flex";

    document.getElementById("resultContent").style.display = "none";
}


// ==========================================
// ANALYZE MESSAGE
// ==========================================

async function analyzeMessage() {

    const message = messageInput.value.trim();

    if (!message) {
        alert("Please paste a suspicious message first.");
        return;
    }

    const button = document.querySelector(".analyze-button");
    const source = document.getElementById("messageSource")?.value || "other";

    button.disabled = true;
    button.textContent = "🔄 Analyzing...";
    updateAnalysisStage(0);

    try {

        await new Promise(resolve => setTimeout(resolve, 180));
        updateAnalysisStage(1);
        await new Promise(resolve => setTimeout(resolve, 180));
        updateAnalysisStage(2);

        const response = await fetch(
            "http://127.0.0.1:5000/api/analyze",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: message,
                    source: source
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                `Server error: ${response.status}`
            );
        }

        updateAnalysisStage(3);
        const data = await response.json();

        console.log("Backend response:", data);

        if (!data.success) {

            alert(
                data.error ||
                "Analysis failed."
            );

            return;
        }

        updateAnalysisStage(4);
        await new Promise(resolve => setTimeout(resolve, 180));

        // Save result globally
        window.lastAnalysisResult = data.result;

        // Save history
        saveScanHistory(
            message,
            data.result
        );

        // Display result
        displayResults(
            data.result
        );

    } catch (error) {

        console.error(
            "Analysis error:",
            error
        );

        alert(
            "Cannot connect to backend.\n\n" +
            "Make sure Flask is running on:\n" +
            "http://127.0.0.1:5000"
        );

    } finally {

        button.disabled = false;

        button.textContent =
            "🛡 Analyze Message";

        const stages = document.getElementById("analysisStages");
        if (stages) stages.hidden = true;
    }
}


// ==========================================
// DISPLAY RESULTS
// ==========================================

function displayResults(result) {

    document.getElementById("emptyState")
        .style.display = "none";

    document.getElementById("resultContent")
        .style.display = "block";


    // Risk level

    const riskLevel =
        result.risk_level ||
        result.risk ||
        "Unknown";

    document.getElementById("riskTitle")
        .textContent =
        `${riskLevel} Risk`;


    // Risk score

    const riskScore =
        Number(
            result.risk_score || 0
        );

    document.getElementById("riskScore")
        .textContent =
        riskScore;


    // Summary

    document.getElementById("summaryText")
        .textContent =
        result.summary ||
        "No summary available.";


    // Recommendation

    document.getElementById("recommendationText")
        .textContent =
        result.recommendation ||
        result.recommendations ||
        "Stay cautious and avoid sharing personal information.";


    // Progress bar

    document.getElementById("riskProgress")
        .style.width =
        `${riskScore}%`;


    // Indicators

    const container =
        document.getElementById("indicators");

    container.innerHTML = "";


    if (
        !result.indicators ||
        result.indicators.length === 0
    ) {

        container.innerHTML = `
            <div class="indicator safe">

                <h4>
                    🟢 No Major Threats Detected
                </h4>

                <p>
                    No significant scam indicators
                    were found.
                </p>

            </div>
        `;

        return;
    }


    result.indicators.forEach(
        indicator => {

            const div =
                document.createElement("div");

            div.className =
                "indicator";


            const type =
                indicator.type ||
                "Suspicious Activity";


            const description =
                indicator.description ||
                "Suspicious behavior detected.";


            let matches = "";

            if (
                Array.isArray(
                    indicator.matches
                )
            ) {

                matches =
                    indicator.matches.join(", ");

            } else if (
                indicator.matches
            ) {

                matches =
                    indicator.matches;

            }


            div.innerHTML = `

                <h4>
                    ⚠️ ${escapeHTML(type)}
                </h4>

                <p>
                    ${escapeHTML(description)}
                </p>

                ${
                    matches
                    ? `<span>${escapeHTML(matches)}</span>`
                    : ""
                }

            `;


            container.appendChild(div);
        }
    );
}


// ==========================================
// SAVE SCAN HISTORY
// ==========================================

function saveScanHistory(
    message,
    result
) {

    const history =
        JSON.parse(
            localStorage.getItem(
                "scamDetectHistory"
            )
        ) || [];


    let risk = "LOW";


    if (result.risk_level) {

        risk =
            String(
                result.risk_level
            ).toUpperCase();

    } else if (result.risk) {

        risk =
            String(
                result.risk
            ).toUpperCase();

    } else if (
        result.is_scam === true
    ) {

        risk = "HIGH";
    }


    const scan = {

        id: Date.now(),

        message:
            message.substring(
                0,
                150
            ),

        risk: risk,

        result: result,

        date:
            new Date().toLocaleString()
    };


    history.unshift(scan);


    const limitedHistory =
        history.slice(0, 50);


    localStorage.setItem(
        "scamDetectHistory",
        JSON.stringify(
            limitedHistory
        )
    );
}


// ==========================================
// SECURITY REPORT
// ==========================================

function generateSecurityReport() {

    const message =
        document.getElementById(
            "messageInput"
        )?.value || "";


    const result =
        window.lastAnalysisResult;


    if (!message.trim()) {

        alert(
            "Please enter and analyze a message first."
        );

        return;
    }


    if (!result) {

        alert(
            "Please analyze the message first."
        );

        return;
    }


    const reportWindow =
        window.open(
            "",
            "_blank"
        );


    if (!reportWindow) {

        alert(
            "Please allow pop-ups to generate the report."
        );

        return;
    }


    const riskLevel =
        result.risk_level ||
        result.risk ||
        "Unknown";


    const riskScore =
        result.risk_score ||
        0;


    reportWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                ScamDetect AI - Security Report
            </title>

            <style>

                body {
                    font-family: Arial, sans-serif;
                    background: #f4f7f9;
                    color: #17202a;
                    padding: 40px;
                    line-height: 1.6;
                }

                .report {
                    max-width: 850px;
                    margin: auto;
                    background: white;
                    padding: 45px;
                    border-radius: 16px;
                    box-shadow:
                        0 10px 30px
                        rgba(0,0,0,.08);
                }

                .header {
                    border-bottom:
                        2px solid #22c55e;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }

                .logo {
                    font-size: 28px;
                    font-weight: bold;
                }

                .logo span {
                    color: #22c55e;
                }

                .date {
                    color: #667085;
                    font-size: 14px;
                }

                .risk {
                    padding: 20px;
                    border-radius: 12px;
                    background: #fff4e5;
                    margin: 20px 0;
                }

                .section {
                    margin-top: 30px;
                }

                .message {
                    background: #f7f8fa;
                    padding: 18px;
                    border-left:
                        4px solid #22c55e;
                    border-radius: 8px;
                    white-space: pre-wrap;
                }

                .score {
                    font-size: 24px;
                    font-weight: bold;
                }

                .print-btn {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    background: #22c55e;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                }

                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #667085;
                    font-size: 13px;
                }

                @media print {

                    .print-btn {
                        display: none;
                    }

                    body {
                        background: white;
                    }

                    .report {
                        box-shadow: none;
                    }

                }

            </style>

        </head>


        <body>

            <button
                class="print-btn"
                onclick="window.print()">

                🖨 Download / Print Report

            </button>


            <div class="report">

                <div class="header">

                    <div class="logo">

                        🛡️ ScamDetect
                        <span>AI</span>

                    </div>

                    <h1>
                        Security Analysis Report
                    </h1>

                    <div class="date">

                        Generated:
                        ${new Date().toLocaleString()}

                    </div>

                </div>


                <div class="section">

                    <h2>
                        Analyzed Message
                    </h2>

                    <div class="message">

                        ${escapeHTML(message)}

                    </div>

                </div>


                <div class="section">

                    <h2>
                        Security Assessment
                    </h2>

                    <div class="risk">

                        <p>
                            <strong>
                                Risk Level:
                            </strong>

                            ${escapeHTML(
                                String(riskLevel)
                            )}
                        </p>

                        <p class="score">

                            Risk Score:
                            ${riskScore}%

                        </p>

                    </div>

                </div>


                <div class="section">

                    <h2>
                        Analysis Summary
                    </h2>

                    <p>

                        ${escapeHTML(
                            String(
                                result.summary ||
                                "No summary available."
                            )
                        )}

                    </p>

                </div>


                <div class="section">

                    <h2>
                        Detected Scam Indicators
                    </h2>

                    ${formatReportList(
                        result.indicators
                    )}

                </div>


                <div class="section">

                    <h2>
                        Security Recommendation
                    </h2>

                    <p>

                        ${escapeHTML(
                            String(
                                result.recommendation ||
                                "Stay cautious and do not share sensitive information."
                            )
                        )}

                    </p>

                </div>


                <div class="footer">

                    <strong>
                        ScamDetect AI
                    </strong>

                    <br>

                    AI-powered social media fraud
                    and scam message detection.

                    <br><br>

                    This report is intended as a
                    security-assistance tool.

                </div>

            </div>

        </body>

        </html>

    `);


    reportWindow.document.close();
}


// ==========================================
// REPORT LIST
// ==========================================

function formatReportList(items) {

    if (!items) {

        return `
            <p>
                No specific indicators detected.
            </p>
        `;
    }


    if (!Array.isArray(items)) {

        return `
            <p>
                ${escapeHTML(
                    String(items)
                )}
            </p>
        `;
    }


    if (items.length === 0) {

        return `
            <p>
                No specific indicators detected.
            </p>
        `;
    }


    return `
        <ul>

            ${items.map(item => {

                if (
                    typeof item === "object"
                ) {

                    return `
                        <li>
                            <strong>
                                ${escapeHTML(
                                    String(
                                        item.type ||
                                        "Indicator"
                                    )
                                )}
                            </strong>

                            <br>

                            ${escapeHTML(
                                String(
                                    item.description ||
                                    ""
                                )
                            )}
                        </li>
                    `;

                }

                return `
                    <li>
                        ${escapeHTML(
                            String(item)
                        )}
                    </li>
                `;

            }).join("")}

        </ul>
    `;
}


// ==========================================
// SECURITY / HTML ESCAPE
// ==========================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}