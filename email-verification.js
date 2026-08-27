const API_URL = "http://127.0.0.1:5000";

let emailValue = "";


/* ==========================================
   SEND EMAIL OTP
========================================== */

async function sendEmailOTP() {

    const email =
        document.getElementById(
            "emailAddress"
        ).value.trim().toLowerCase();


    const error =
        document.getElementById(
            "emailError"
        );


    error.textContent = "";


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailPattern.test(email)) {

        error.textContent =
            "Please enter a valid email address.";

        return;
    }


    emailValue = email;


    try {

        const response =
            await fetch(
                API_URL +
                "/api/send-email-otp",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        email:
                            emailValue

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


        /* Show OTP */

        document.getElementById(
            "otpSection"
        ).style.display =
            "block";


        document.getElementById(
            "otpMessage"
        ).textContent =
            "Enter the OTP sent to " +
            maskEmail(emailValue);


        /* Demo OTP */

        if (data.demo_otp) {

            document.getElementById(
                "demoOtp"
            ).textContent =
                "DEMO OTP: " +
                data.demo_otp;

        }


        document.getElementById(
            "otp1"
        ).focus();


        document.getElementById(
            "otpSection"
        ).scrollIntoView({
            behavior: "smooth"
        });


    } catch (error) {

        console.error(error);

        document.getElementById(
            "emailError"
        ).textContent =
            "Cannot connect to ScamDetect backend.";

    }

}


/* ==========================================
   VERIFY EMAIL OTP
========================================== */

async function verifyContactOTP() {

    let otp = "";


    document.querySelectorAll(
        ".contact-otp"
    ).forEach(input => {

        otp += input.value;

    });


    const error =
        document.getElementById(
            "otpError"
        );


    error.textContent = "";


    if (!/^[0-9]{6}$/.test(otp)) {

        error.textContent =
            "Enter the complete 6-digit OTP.";

        return;
    }


    try {

        const response =
            await fetch(
                API_URL +
                "/api/verify-email-otp",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        email:
                            emailValue,

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
                "Incorrect OTP.";

            return;
        }


        /* Hide OTP */

        document.getElementById(
            "otpSection"
        ).style.display =
            "none";


        /* Show success */

        document.getElementById(
            "successSection"
        ).style.display =
            "block";


        localStorage.setItem(
            "scamDetectEmailVerified",
            "true"
        );


    } catch (error) {

        console.error(error);

        document.getElementById(
            "otpError"
        ).textContent =
            "Unable to connect to backend.";

    }

}


/* ==========================================
   MASK EMAIL
========================================== */

function maskEmail(email) {

    const parts =
        email.split("@");


    const username =
        parts[0];

    const domain =
        parts[1];


    const visible =
        username.substring(
            0,
            Math.min(2, username.length)
        );


    return (
        visible +
        "***@" +
        domain
    );

}


/* ==========================================
   OTP AUTO MOVE
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const inputs =
            document.querySelectorAll(
                ".contact-otp"
            );


        inputs.forEach(
            (input, index) => {

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
                            index <
                            inputs.length - 1
                        ) {

                            inputs[
                                index + 1
                            ].focus();

                        }

                    }
                );


                input.addEventListener(
                    "keydown",
                    event => {

                        if (
                            event.key ===
                            "Backspace" &&
                            !input.value &&
                            index > 0
                        ) {

                            inputs[
                                index - 1
                            ].focus();

                        }

                    }
                );

            }
        );

    }
);