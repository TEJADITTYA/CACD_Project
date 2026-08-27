const API_URL = "http://127.0.0.1:5000";

let verificationType = "";
let verificationValue = "";


/* ==========================================
   SEND PHONE OTP
========================================== */

async function sendPhoneOTP() {

    const country =
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


    verificationType = "phone";

    verificationValue =
        country + phone;


    await requestOTP(
        "phone",
        verificationValue
    );
}


/* ==========================================
   SEND EMAIL OTP
========================================== */

async function sendEmailOTP() {

    const email =
        document.getElementById("emailAddress")
        .value
        .trim();

    const error =
        document.getElementById("emailError");

    error.textContent = "";


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailPattern.test(email)) {

        error.textContent =
            "Please enter a valid email address.";

        return;
    }


    verificationType = "email";

    verificationValue = email;


    await requestOTP(
        "email",
        email
    );
}


/* ==========================================
   REQUEST OTP
========================================== */

async function requestOTP(type, value) {

    const endpoint =
        type === "phone"
            ? "/api/send-phone-otp"
            : "/api/send-email-otp";


    try {

        console.log(
            "Sending OTP:",
            type,
            value
        );


        const response =
            await fetch(
                API_URL + endpoint,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        [type]: value

                    })
                }
            );


        const data =
            await response.json();


        console.log(
            "Backend response:",
            data
        );


        if (!response.ok ||
            !data.success) {

            const errorId =
                type === "phone"
                    ? "phoneError"
                    : "emailError";


            document.getElementById(
                errorId
            ).textContent =
                data.error ||
                "Unable to send OTP.";

            return;
        }


        /* ==================================
           OTP REQUEST SUCCESS
        ================================== */

        const otpSection =
            document.getElementById(
                "otpSection"
            );


        /* Show OTP page */

        otpSection.style.display =
            "block";


        /* Message */

        document.getElementById(
            "otpMessage"
        ).textContent =
            `Enter the OTP sent to ${maskContact(
                value,
                type
            )}`;


        /* Demo OTP */

        const demoOtp =
            document.getElementById(
                "demoOtp"
            );


        if (data.demo_otp) {

            demoOtp.textContent =
                "DEMO OTP: " +
                data.demo_otp;

            demoOtp.style.display =
                "inline-block";

        } else {

            demoOtp.style.display =
                "none";
        }


        /* Scroll to OTP */

        otpSection.scrollIntoView({

            behavior: "smooth",

            block: "center"

        });


        /* Focus first box */

        setTimeout(() => {

            document.getElementById(
                "otp1"
            ).focus();

        }, 500);


    } catch (error) {

        console.error(
            "Backend connection error:",
            error
        );


        const errorId =
            type === "phone"
                ? "phoneError"
                : "emailError";


        document.getElementById(
            errorId
        ).textContent =
            "Cannot connect to backend. Make sure Flask is running.";
    }
}


/* ==========================================
   VERIFY OTP
========================================== */

async function verifyContactOTP() {

    const inputs =
        document.querySelectorAll(
            ".contact-otp"
        );


    let otp = "";


    inputs.forEach(input => {

        otp += input.value;

    });


    const error =
        document.getElementById(
            "otpError"
        );


    error.textContent = "";


    if (!/^[0-9]{6}$/.test(otp)) {

        error.textContent =
            "Please enter the complete 6-digit OTP.";

        return;
    }


    const endpoint =
        verificationType === "phone"
            ? "/api/verify-phone-otp"
            : "/api/verify-email-otp";


    const body = {

        otp: otp

    };


    if (verificationType === "phone") {

        body.phone =
            verificationValue;

    } else {

        body.email =
            verificationValue;

    }


    try {

        const response =
            await fetch(
                API_URL + endpoint,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(body)
                }
            );


        const data =
            await response.json();


        console.log(
            "Verification response:",
            data
        );


        if (!response.ok ||
            !data.success) {

            error.textContent =
                data.error ||
                "Invalid OTP.";

            return;
        }

        // Hide OTP section
document.getElementById("otpSection").style.display = "none";

// Show success message
document.getElementById("successMessage").style.display = "block";

// Display random security message from backend
document.getElementById("successText").textContent = data.message;

// Save verification status
localStorage.setItem(
    "scamDetectPhoneVerified",
    "true"
);


        /* ==================================
           VERIFIED
        ================================== */

        if (
            verificationType ===
            "phone"
        ) {

            document.getElementById(
                "phoneVerified"
            ).style.display =
                "block";

            document.getElementById(
                "phoneButton"
            ).style.display =
                "none";

        } else {

            document.getElementById(
                "emailVerified"
            ).style.display =
                "block";

            document.getElementById(
                "emailButton"
            ).style.display =
                "none";
        }


        /* Hide OTP */

        document.getElementById(
            "otpSection"
        ).style.display =
            "none";


        alert(
            verificationType === "phone"
                ? "Phone number verified successfully!"
                : "Email address verified successfully!"
        );


        clearOTP();


    } catch (error) {

        console.error(error);

        document.getElementById(
            "otpError"
        ).textContent =
            "Unable to connect to backend.";
    }
}


/* ==========================================
   MASK CONTACT
========================================== */

function maskContact(value, type) {

    if (type === "phone") {

        return (
            value.substring(
                0,
                value.length - 6
            ) +
            "******"
        );

    }


    const parts =
        value.split("@");


    return (
        parts[0].substring(0, 2) +
        "***@" +
        parts[1]
    );
}


/* ==========================================
   CLEAR OTP
========================================== */

function clearOTP() {

    document.querySelectorAll(
        ".contact-otp"
    ).forEach(input => {

        input.value = "";

    });

}


/* ==========================================
   CLOSE OTP
========================================== */

function closeOTPSection() {

    document.getElementById(
        "otpSection"
    ).style.display =
        "none";


    clearOTP();

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