const API_URL =
    window.CYBERSHIELD_API_URL || "";


let fullPhoneNumber = "";


/* ==========================================
   SEND OTP
========================================== */

async function sendOTP() {

    const countryCode =
        document.getElementById(
            "countryCode"
        ).value;

    const phone =
        document.getElementById(
            "phoneNumber"
        ).value.trim();


    const error =
        document.getElementById(
            "phoneError"
        );


    error.textContent = "";


    /* Validate phone */

    if (!/^[0-9]{10}$/.test(phone)) {

        error.textContent =
            "Please enter a valid 10-digit phone number.";

        return;
    }


    fullPhoneNumber =
        countryCode + phone;


    const button =
        document.getElementById(
            "sendOtpButton"
        );


    button.disabled = true;

    button.textContent =
        "🔄 Sending OTP...";


    try {

        const response =
            await fetch(
                `${API_URL}/api/send-phone-otp`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        phone:
                            fullPhoneNumber

                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok ||
            !data.success) {

            error.textContent =
                data.error ||
                "Unable to send OTP.";

            return;
        }


        /* Move to OTP screen */

        document.getElementById(
            "phoneStep"
        ).style.display = "none";


        document.getElementById(
            "otpStep"
        ).style.display = "block";


        document.getElementById(
            "otpMessage"
        ).textContent =
            `Enter the verification code for ${maskPhone(fullPhoneNumber)}`;

        if (data.development_otp) {
            document.getElementById("demoOtp").textContent =
                `LOCAL DEVELOPMENT OTP: ${data.development_otp}`;
        }


        document.getElementById(
            "otp1"
        ).focus();


    } catch (error) {

        console.error(error);

        document.getElementById(
            "phoneError"
        ).textContent =
            "Cannot connect to Cyber Shield backend.";

    } finally {

        button.disabled = false;

        button.textContent =
            "🔐 Send Verification OTP";

    }

}


/* ==========================================
   VERIFY OTP
========================================== */

async function verifyOTP() {

    const otp =
        Array.from(
            document.querySelectorAll(".otp")
        )
        .map(input => input.value)
        .join("");


    const error =
        document.getElementById(
            "otpError"
        );


    error.textContent = "";


    if (!/^[0-9]{4}$/.test(otp)) {

        error.textContent =
            "Please enter the 4-digit OTP.";

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/verify-otp`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        phone:
                            fullPhoneNumber,

                        otp:
                            otp

                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok ||
            !data.success) {

            error.textContent =
                data.error ||
                "Invalid OTP.";

            return;
        }


        /* Hide OTP */

        document.getElementById(
            "otpStep"
        ).style.display = "none";


        /* Show success */

        document.getElementById(
            "successStep"
        ).style.display = "block";


        document.getElementById(
            "verifiedNumber"
        ).textContent =
            maskPhone(fullPhoneNumber);


        /*
         Store verification status
         for this browser session.
        */

        localStorage.setItem(
            "scamDetectPhone",
            fullPhoneNumber
        );


        localStorage.setItem(
            "scamDetectPhoneVerified",
            "true"
        );


    } catch (error) {

        console.error(error);

        document.getElementById(
            "otpError"
        ).textContent =
            "Unable to verify OTP.";

    }

}


/* ==========================================
   GO BACK
========================================== */

function goBackToPhone() {

    document.getElementById(
        "otpStep"
    ).style.display = "none";


    document.getElementById(
        "phoneStep"
    ).style.display = "block";


    document.querySelectorAll(
        ".otp"
    ).forEach(input => {

        input.value = "";

    });

}


/* ==========================================
   MASK PHONE NUMBER
========================================== */

function maskPhone(phone) {

    if (phone.length < 7) {

        return phone;

    }


    return phone.substring(
        0,
        phone.length - 6
    ) + "******";

}


/* ==========================================
   OTP INPUT AUTO MOVE
========================================== */

document.querySelectorAll(
    ".otp"
).forEach((input, index, inputs) => {

    input.addEventListener(
        "input",
        () => {

            input.value =
                input.value.replace(
                    /[^0-9]/g,
                    ""
                );


            if (
                input.value &&
                index < inputs.length - 1
            ) {

                inputs[index + 1].focus();

            }

        }
    );


    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Backspace" &&
                !input.value &&
                index > 0
            ) {

                inputs[index - 1].focus();

            }

        }
    );

});