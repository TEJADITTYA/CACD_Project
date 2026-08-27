const history =
    JSON.parse(
        localStorage.getItem("scamDetectHistory")
    ) || [];


// Total scans
document.getElementById(
    "totalScans"
).textContent = history.length;


// Scam detection
const scams =
    history.filter(
        item =>
            item.risk === "HIGH" ||
            item.risk === "MEDIUM"
    );

document.getElementById(
    "scamsDetected"
).textContent =
    scams.length;


// High risk
const highRisk =
    history.filter(
        item =>
            item.risk === "HIGH"
    );

document.getElementById(
    "highRisk"
).textContent =
    highRisk.length;


// Safe
const safe =
    history.filter(
        item =>
            item.risk === "LOW"
    );

document.getElementById(
    "safeMessages"
).textContent =
    safe.length;