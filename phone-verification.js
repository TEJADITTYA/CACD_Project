const API_URL = window.CYBERSHIELD_API_URL || (
    window.location.protocol === "file:" || window.location.port === "5173"
        ? "http://127.0.0.1:5000"
        : ""
);

let phoneValue = "";


/* ==========================================
   SEND PHONE OTP
========================================== */

async function sendPhoneOTP() {

    const countryCode =
        document.getElementById("countryCode").value;

    const phone =
        document.getElementById("phoneNumber")
        .value
        .trim();

    const error =
        document.getElementById("phoneError");

    error.textContent = "";


    if (!/^[0-9]{10}$/.test(phone)) {

        error.textContent =
            "Please enter a valid 10-digit phone number.";

        return;
    }


    phoneValue =
        countryCode + phone;


    try {

        const response =
            await fetch(
                API_URL +
                "/api/send-phone-otp",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        phone: phoneValue
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


        document.getElementById(
            "otpSection"
        ).style.display = "block";


        document.getElementById(
            "otpMessage"
        ).textContent =
            "Enter the OTP sent to " +
            maskPhone(phoneValue);

        if (data.development_otp) {
            document.getElementById("demoOtp").textContent =
                "LOCAL DEVELOPMENT OTP: " + data.development_otp;
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
            "phoneError"
        ).textContent =
            "Cannot connect to Cyber Shield backend.";

    }

}


/* ==========================================
   VERIFY PHONE OTP
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


    if (!/^[0-9]{4}$/.test(otp)) {

        error.textContent =
            "Enter the complete 4-digit OTP.";

        return;
    }


    try {

        const response =
            await fetch(
                API_URL +
                "/api/verify-phone-otp",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        phone:
                            phoneValue,

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
            "scamDetectPhoneVerified",
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
   MASK PHONE
========================================== */

function maskPhone(phone) {

    return (
        phone.substring(
            0,
            phone.length - 6
        ) +
        "******"
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