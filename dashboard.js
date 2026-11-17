/* =====================================
   EMPIRE OF KINGS
   PLAYER DASHBOARD
===================================== */


let currentUser = null;

let currentProfile = null;


/* =====================================
   SESSION
===================================== */

async function initializeDashboard() {

    const { data, error } =
        await supabaseClient.auth.getUser();

    if (error || !data.user) {

        window.location.replace("index.html");

        return;

    }

    currentUser = data.user;

    await loadPlayerProfile();

    if (typeof initializeMultiplayer === "function") {

        await initializeMultiplayer();

    }

}


initializeDashboard();


/* =====================================
   PROFILE
===================================== */

async function loadPlayerProfile() {

    const { data, error } = await supabaseClient

        .from("profiles")

        .select("*")

        .eq("id", currentUser.id)

        .single();


    if (error) {

        console.error(error);

        return;

    }


    currentProfile = data;


    document.getElementById("topUsername")
        .textContent = data.username;


    document.getElementById("profileUsername")
        .textContent = data.display_name || data.username;


    document.getElementById("avatar")
        .textContent = data.username.charAt(0).toUpperCase();


    document.getElementById("playerID")
        .textContent = data.player_id;


    document.getElementById("profileBio")
        .value = data.bio || "";


    document.getElementById("statLevel")
        .textContent = data.level;


    document.getElementById("statXP")
        .textContent = data.xp;


    document.getElementById("statCoins")
        .textContent = data.coins;


    document.getElementById("statReputation")
        .textContent = data.reputation;


    document.getElementById("statJob")
        .textContent = data.job;


    document.getElementById("statStatus")
        .textContent = data.social_status;


    document.getElementById("statTitle")
        .textContent = data.player_title;

}


/* =====================================
   SAVE PROFILE
===================================== */

document.getElementById("saveProfile")
.addEventListener("click", async function() {

    const bio = document.getElementById("profileBio").value;

    const { error } = await supabaseClient

        .from("profiles")

        .update({

            bio: bio

        })

        .eq("id", currentUser.id);


    if (error) {

        alert(error.message);

    } else {

        alert("Profile updated successfully.");

    }

});


/* =====================================
   NAVIGATION
===================================== */

const navigationButtons =
    document.querySelectorAll(".nav-item");


const pages = {

    overview: "overviewPage",

    global: "globalPage",

    players: "playersPage",

    friends: "friendsPage",

    private: "privatePage",

    notifications: "notificationsPage"

};


navigationButtons.forEach(button => {

    button.addEventListener("click", function() {

        const page = button.dataset.page;

        navigationButtons.forEach(item => {

            item.classList.remove("active");

        });

        button.classList.add("active");


        Object.values(pages).forEach(id => {

            document.getElementById(id)
                .classList.add("hidden");

        });


        document.getElementById(pages[page])
            .classList.remove("hidden");


        document.getElementById("pageTitle")
            .textContent = button.textContent.trim();

    });

});


/* =====================================
   LOGOUT
===================================== */

document.getElementById("logoutButton")
.addEventListener("click", async function() {

    const confirmed = confirm(
        "Are you sure you want to leave the kingdom?"
    );

    if (!confirmed) return;


    await supabaseClient.auth.signOut();

    window.location.replace("index.html");

});