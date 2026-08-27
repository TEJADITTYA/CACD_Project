const container =
    document.getElementById(
        "historyContainer"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );


function loadHistory() {

    const history =
        JSON.parse(
            localStorage.getItem(
                "scamDetectHistory"
            )
        ) || [];


    container.innerHTML = "";


    if (history.length === 0) {

        emptyState.style.display =
            "block";

        return;

    }


    emptyState.style.display =
        "none";


    history.forEach(
        scan => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "history-card";


            const risk =
                scan.risk || "LOW";


            const riskClass =
                risk.toLowerCase();


            card.innerHTML = `

                <div class="history-top">

                    <strong>
                        🛡️ Security Analysis
                    </strong>

                    <span class="risk ${riskClass}">
                        ${risk} RISK
                    </span>

                </div>

                <div class="message">
                    ${escapeHTML(scan.message)}
                </div>

                <div class="date">
                    ${scan.date}
                </div>

            `;


            container.appendChild(
                card
            );

        }
    );

}


function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text;

    return div.innerHTML;
}


function clearHistory() {

    const confirmed =
        confirm(
            "Are you sure you want to delete all scan history?"
        );


    if (!confirmed) {
        return;
    }


    localStorage.removeItem(
        "scamDetectHistory"
    );


    loadHistory();

}


loadHistory();