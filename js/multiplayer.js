/* =====================================
   EMPIRE OF KINGS
   MULTIPLAYER SYSTEM
   PART 4
===================================== */


let globalChannel = null;

let privateChannel = null;

let activeConversation = null;

let onlineProfiles = [];


/* =====================================
   INITIALIZATION
===================================== */

async function initializeMultiplayer() {

    await loadGlobalMessages();

    await loadFriends();

    await loadNotifications();

    await initializePresence();

    subscribeGlobalChat();

    subscribePrivateMessages();

    subscribeNotifications();

}


/* =====================================
   SAFE ELEMENT
===================================== */

function createTextElement(tag, text, className) {

    const element = document.createElement(tag);

    element.textContent = text;

    if (className) {

        element.className = className;

    }

    return element;

}


/* =====================================
   GLOBAL CHAT
===================================== */

async function loadGlobalMessages() {

    const { data, error } = await supabaseClient

        .from("global_messages")

        .select("id, content, sender_id, created_at")

        .order("created_at", {
            ascending: true
        })

        .limit(100);


    if (error) {

        console.error(error);

        return;

    }


    const senderIds = [
        ...new Set(data.map(message => message.sender_id))
    ];


    let profiles = [];


    if (senderIds.length > 0) {

        const result = await supabaseClient

            .from("profiles")

            .select("id, username")

            .in("id", senderIds);

        profiles = result.data || [];

    }


    const profileMap = new Map(

        profiles.map(profile => [
            profile.id,
            profile.username
        ])

    );


    renderGlobalMessages(data, profileMap);

}


function renderGlobalMessages(messages, profileMap) {

    const container =
        document.getElementById("globalMessages");

    container.replaceChildren();


    if (!messages.length) {

        container.append(
            createTextElement(
                "p",
                "No messages yet.",
                "empty-state"
            )
        );

        return;

    }


    messages.forEach(message => {

        const box = document.createElement("div");

        box.className = "chat-message";


        const username = createTextElement(
            "strong",
            profileMap.get(message.sender_id) || "Player"
        );


        const content = createTextElement(
            "p",
            message.content
        );


        const time = createTextElement(
            "small",
            new Date(message.created_at).toLocaleString()
        );


        box.append(username, content, time);

        container.append(box);

    });


    container.scrollTop = container.scrollHeight;

}


/* =====================================
   SEND GLOBAL MESSAGE
===================================== */

document.getElementById("globalChatForm")
.addEventListener("submit", async function(event) {

    event.preventDefault();

    const input =
        document.getElementById("globalChatInput");

    const content = input.value.trim();


    if (!content || !currentUser) return;


    const { error } = await supabaseClient

        .from("global_messages")

        .insert({

            sender_id: currentUser.id,

            content: content

        });


    if (error) {

        alert(error.message);

        return;

    }


    input.value = "";

});


/* =====================================
   GLOBAL CHAT REALTIME
===================================== */

function subscribeGlobalChat() {

    globalChannel = supabaseClient

        .channel("eok-global-chat")

        .on(

            "postgres_changes",

            {

                event: "*",

                schema: "public",

                table: "global_messages"

            },

            function() {

                loadGlobalMessages();

            }

        )

        .subscribe();

}


/* =====================================
   ONLINE PRESENCE
===================================== */

async function initializePresence() {

    const channel = supabaseClient.channel(
        "eok-global-presence",
        {
            config: {

                presence: {

                    key: currentUser.id

                }

            }

        }
    );


    channel.on(
        "presence",
        {
            event: "sync"
        },
        async function() {

            const state = channel.presenceState();

            const ids = Object.keys(state);


            if (!ids.length) {

                onlineProfiles = [];

                renderOnlinePlayers();

                return;

            }


            const { data } = await supabaseClient

                .from("profiles")

                .select("id, username, player_id, level")

                .in("id", ids);


            onlineProfiles = data || [];

            renderOnlinePlayers();

        }

    );


    const { error } = await channel.subscribe(
        async function(status) {

            if (status === "SUBSCRIBED") {

                await channel.track({

                    user_id: currentUser.id,

                    username: currentProfile.username,

                    online_at: new Date().toISOString()

                });

            }

        }
    );


    if (error) {

        console.error(error);

    }


    window.eokPresenceChannel = channel;

}


/* =====================================
   ONLINE PLAYERS
===================================== */

function renderOnlinePlayers() {

    const container =
        document.getElementById("playerList");


    if (!container) return;


    container.replaceChildren();


    onlineProfiles.forEach(player => {

        if (player.id === currentUser.id) return;


        const row = document.createElement("div");

        row.className = "player-row";


        const info = document.createElement("div");

        info.append(

            createTextElement(
                "strong",
                player.username
            ),

            createTextElement(
                "small",
                player.player_id + " | Level " + player.level
            )

        );


        const actions = document.createElement("div");

        actions.className = "player-actions";


        const messageButton = createTextElement(
            "button",
            "MESSAGE"
        );


        messageButton.addEventListener("click", function() {

            openPrivateConversation(player);

        });


        const friendButton = createTextElement(
            "button",
            "ADD FRIEND"
        );


        friendButton.addEventListener("click", function() {

            sendFriendRequest(player.id);

        });


        actions.append(messageButton, friendButton);

        row.append(info, actions);

        container.append(row);

    });


    if (!container.children.length) {

        container.append(

            createTextElement(
                "p",
                "No other players are currently online.",
                "empty-state"
            )

        );

    }

}


/* =====================================
   PLAYER SEARCH
===================================== */

document.getElementById("playerSearch")
.addEventListener("input", async function() {

    const query = this.value.trim();


    const container =
        document.getElementById("playerList");


    if (query.length < 2) {

        renderOnlinePlayers();

        return;

    }


    const { data, error } = await supabaseClient

        .from("profiles")

        .select("id, username, player_id, level")

        .ilike("username", "%" + query + "%")

        .neq("id", currentUser.id)

        .limit(20);


    if (error) {

        console.error(error);

        return;

    }


    container.replaceChildren();


    data.forEach(player => {

        const row = document.createElement("div");

        row.className = "player-row";


        const info = document.createElement("div");

        info.append(

            createTextElement(
                "strong",
                player.username
            ),

            createTextElement(
                "small",
                player.player_id
            )

        );


        const actions = document.createElement("div");

        actions.className = "player-actions";


        const messageButton = createTextElement(
            "button",
            "MESSAGE"
        );


        messageButton.addEventListener("click", () => {

            openPrivateConversation(player);

        });


        const friendButton = createTextElement(
            "button",
            "ADD FRIEND"
        );


        friendButton.addEventListener("click", () => {

            sendFriendRequest(player.id);

        });


        actions.append(messageButton, friendButton);

        row.append(info, actions);

        container.append(row);

    });


});


/* =====================================
   FRIEND REQUEST
===================================== */

async function sendFriendRequest(receiverId) {

    const { error } = await supabaseClient

        .from("friend_requests")

        .insert({

            sender_id: currentUser.id,

            receiver_id: receiverId,

            status: "pending"

        });


    if (error) {

        alert(
            "Friend request failed: " + error.message
        );

        return;

    }


    alert("Friend request sent.");

}


/* =====================================
   LOAD FRIENDS
===================================== */

async function loadFriends() {

    const { data, error } = await supabaseClient

        .from("friend_requests")

        .select("*")

        .or(
            "sender_id.eq." + currentUser.id +
            ",receiver_id.eq." + currentUser.id
        );


    const container =
        document.getElementById("friendList");


    if (error) {

        console.error(error);

        return;

    }


    container.replaceChildren();


    for (const request of data) {

        const isIncoming =
            request.receiver_id === currentUser.id;


        const otherId = isIncoming
            ? request.sender_id
            : request.receiver_id;


        const result = await supabaseClient

            .from("profiles")

            .select("id, username, player_id")

            .eq("id", otherId)

            .single();


        if (!result.data) continue;


        const player = result.data;


        const row = document.createElement("div");

        row.className = "player-row";


        const info = document.createElement("div");

        info.append(

            createTextElement(
                "strong",
                player.username
            ),

            createTextElement(
                "small",
                "Status: " + request.status
            )

        );


        const actions = document.createElement("div");

        actions.className = "player-actions";


        if (
            request.status === "pending" &&
            isIncoming
        ) {

            const accept = createTextElement(
                "button",
                "ACCEPT"
            );


            accept.addEventListener("click", async function() {

                const { error } = await supabaseClient

                    .from("friend_requests")

                    .update({

                        status: "accepted"

                    })

                    .eq("id", request.id);


                if (error) {

                    alert(error.message);

                } else {

                    loadFriends();

                }

            });


            actions.append(accept);

        }


        const message = createTextElement(
            "button",
            "MESSAGE"
        );


        message.addEventListener("click", () => {

            openPrivateConversation(player);

        });


        actions.append(message);

        row.append(info, actions);

        container.append(row);

    }


    if (!container.children.length) {

        container.append(

            createTextElement(
                "p",
                "No friends or requests yet.",
                "empty-state"
            )

        );

    }

}


/* =====================================
   PRIVATE CONVERSATION
===================================== */

async function openPrivateConversation(player) {

    activeConversation = player;


    document.getElementById("privateTarget")
        .textContent = "Conversation with " + player.username;


    document.getElementById("privateChatInput")
        .disabled = false;


    document.getElementById("privateSendButton")
        .disabled = false;


    document.querySelector(
        '[data-page="private"]'
    ).click();


    await loadPrivateMessages();

}


/* =====================================
   LOAD PRIVATE MESSAGES
===================================== */

async function loadPrivateMessages() {

    if (!activeConversation) return;


    const targetId = activeConversation.id;


    const { data, error } = await supabaseClient

        .from("private_messages")

        .select("*")

        .or(

            "and(sender_id.eq." + currentUser.id +
            ",receiver_id.eq." + targetId + ")," +

            "and(sender_id.eq." + targetId +
            ",receiver_id.eq." + currentUser.id + ")"

        )

        .order("created_at", {
            ascending: true
        })

        .limit(100);


    if (error) {

        console.error(error);

        return;

    }


    const container =
        document.getElementById("privateMessages");


    container.replaceChildren();


    if (!data.length) {

        container.append(

            createTextElement(
                "p",
                "Start your conversation.",
                "empty-state"
            )

        );

        return;

    }


    data.forEach(message => {

        const row = document.createElement("div");

        row.className = "chat-message";


        const sender =
            message.sender_id === currentUser.id
            ? "You"
            : activeConversation.username;


        row.append(

            createTextElement(
                "strong",
                sender
            ),

            createTextElement(
                "p",
                message.content
            )

        );


        container.append(row);

    });


    container.scrollTop = container.scrollHeight;

}


/* =====================================
   SEND PRIVATE MESSAGE
===================================== */

document.getElementById("privateChatForm")
.addEventListener("submit", async function(event) {

    event.preventDefault();


    if (!activeConversation) return;


    const input =
        document.getElementById("privateChatInput");


    const content = input.value.trim();


    if (!content) return;


    const { error } = await supabaseClient

        .from("private_messages")

        .insert({

            sender_id: currentUser.id,

            receiver_id: activeConversation.id,

            content: content

        });


    if (error) {

        alert(error.message);

        return;

    }


    input.value = "";

    await loadPrivateMessages();

});


/* =====================================
   PRIVATE MESSAGE REALTIME
===================================== */

function subscribePrivateMessages() {

    privateChannel = supabaseClient

        .channel("eok-private-messages")

        .on(

            "postgres_changes",

            {

                event: "INSERT",

                schema: "public",

                table: "private_messages"

            },

            function(payload) {

                if (!activeConversation) return;


                const message = payload.new;


                if (

                    message.sender_id === activeConversation.id ||

                    message.receiver_id === activeConversation.id

                ) {

                    loadPrivateMessages();

                }

            }

        )

        .subscribe();

}


/* =====================================
   NOTIFICATIONS
===================================== */

async function loadNotifications() {

    const { data, error } = await supabaseClient

        .from("notifications")

        .select("*")

        .eq("user_id", currentUser.id)

        .order("created_at", {
            ascending: false
        })

        .limit(50);


    if (error) {

        console.error(error);

        return;

    }


    const container =
        document.getElementById("notificationList");


    container.replaceChildren();


    if (!data.length) {

        container.append(

            createTextElement(
                "p",
                "No notifications yet.",
                "empty-state"
            )

        );

        return;

    }


    data.forEach(notification => {

        const row = document.createElement("div");

        row.className =
            "notification-item" +
            (notification.is_read ? "" : " unread");


        row.append(

            createTextElement(
                "div",
                notification.content
            ),

            createTextElement(
                "small",
                new Date(
                    notification.created_at
                ).toLocaleString()
            )

        );


        if (!notification.is_read) {

            const button = createTextElement(
                "button",
                "MARK AS READ",
                "notification-button"
            );


            button.addEventListener("click", async function() {

                const { error } = await supabaseClient

                    .from("notifications")

                    .update({

                        is_read: true

                    })

                    .eq("id", notification.id);


                if (error) {

                    alert(error.message);

                } else {

                    loadNotifications();

                }

            });


            row.append(button);

        }


        container.append(row);

    });

}


/* =====================================
   REALTIME NOTIFICATIONS
===================================== */

function subscribeNotifications() {

    supabaseClient

        .channel("eok-notifications")

        .on(

            "postgres_changes",

            {

                event: "INSERT",

                schema: "public",

                table: "notifications",

                filter: "user_id=eq." + currentUser.id

            },

            function() {

                loadNotifications();

            }

        )

        .subscribe();

              }
