/* =====================================
   EMPIRE OF KINGS
   AUTHENTICATION SYSTEM
   PART 2
===================================== */


const loginTab = document.getElementById("loginTab");

const registerTab = document.getElementById("registerTab");

const loginForm = document.getElementById("loginForm");

const registerForm = document.getElementById("registerForm");

const authTitle = document.getElementById("authTitle");

const authDescription = document.getElementById("authDescription");

const messageBox = document.getElementById("messageBox");


/* =====================================
   NOTIFICATION
===================================== */

function showMessage(message, type = "error") {

    messageBox.textContent = message;

    messageBox.className = "message-box";

    if (type === "error") {

        messageBox.classList.add("error");

    }

    messageBox.classList.remove("hidden");

}


function hideMessage() {

    messageBox.classList.add("hidden");

}


/* =====================================
   AUTH TABS
===================================== */

loginTab.addEventListener("click", function() {

    loginTab.classList.add("active");

    registerTab.classList.remove("active");

    loginForm.classList.remove("hidden");

    registerForm.classList.add("hidden");

    authTitle.textContent = "Enter the Kingdom";

    authDescription.textContent =
        "Sign in to continue your journey.";

    hideMessage();

});


registerTab.addEventListener("click", function() {

    registerTab.classList.add("active");

    loginTab.classList.remove("active");

    registerForm.classList.remove("hidden");

    loginForm.classList.add("hidden");

    authTitle.textContent = "Create Your Legacy";

    authDescription.textContent =
        "Create your account and enter the realm.";

    hideMessage();

});


/* =====================================
   PASSWORD VISIBILITY
===================================== */

document.querySelectorAll(".toggle-password")
.forEach(button => {

    button.addEventListener("click", function() {

        const input = document.getElementById(
            button.dataset.target
        );

        input.type =
            input.type === "password"
            ? "text"
            : "password";

        button.textContent =
            input.type === "password"
            ? "SHOW"
            : "HIDE";

    });

});


/* =====================================
   REGISTER
===================================== */

registerForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    hideMessage();

    const username = document
        .getElementById("registerUsername")
        .value.trim();

    const email = document
        .getElementById("registerEmail")
        .value.trim();

    const password = document
        .getElementById("registerPassword")
        .value;

    const confirmPassword = document
        .getElementById("confirmPassword")
        .value;


    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {

        showMessage(
            "Username must contain 3-20 letters, numbers or underscores."
        );

        return;

    }


    if (password.length < 8) {

        showMessage(
            "Password must contain at least 8 characters."
        );

        return;

    }


    if (password !== confirmPassword) {

        showMessage("Passwords do not match.");

        return;

    }


    const button = registerForm.querySelector(
        ".primary-button"
    );

    button.disabled = true;

    button.querySelector("span").textContent =
        "CREATING ACCOUNT...";


    try {

        const { data, error } =
            await supabaseClient.auth.signUp({

                email: email,

                password: password,

                options: {

                    data: {

                        username: username

                    },

                    emailRedirectTo: window.location.origin

                }

            });


        if (error) {

            throw error;

        }


        if (data.session) {

            showMessage(
                "Account created successfully. Entering the kingdom...",
                "success"
            );

            window.location.replace("dashboard.html");

        } else {

            showMessage(
                "Registration submitted. Check your email to confirm your account.",
                "success"
            );

        }

    }

    catch(error) {

        showMessage(error.message);

    }

    finally {

        button.disabled = false;

        button.querySelector("span").textContent =
            "CREATE ACCOUNT";

    }

});


/* =====================================
   LOGIN
===================================== */

loginForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    hideMessage();

    const email = document
        .getElementById("loginEmail")
        .value.trim();

    const password = document
        .getElementById("loginPassword")
        .value;


    const button = loginForm.querySelector(
        ".primary-button"
    );

    button.disabled = true;

    button.querySelector("span").textContent =
        "ENTERING...";


    try {

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({

                email: email,

                password: password

            });


        if (error) {

            throw error;

        }


        window.location.replace("dashboard.html");

    }

    catch(error) {

        showMessage(error.message);

    }

    finally {

        button.disabled = false;

        button.querySelector("span").textContent =
            "ENTER THE KINGDOM";

    }

});


/* =====================================
   EXISTING SESSION
===================================== */

async function checkExistingSession() {

    const { data } =
        await supabaseClient.auth.getSession();

    if (data.session) {

        window.location.replace("dashboard.html");

    }

}


checkExistingSession();