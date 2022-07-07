const express = require("express");
const sessions = require("express-session");
const { AuthorizationCode } = require("simple-oauth2");
const axios = require("axios");
const fs = require("fs");
const configFile = require("./data/config.json");
const net = require("net");

const PORT = process.env.port || 3000;

const app = express();
app.use(express.static("public"));
app.use(sessions({
    secret: configFile.session_key,
    saveUninitialized:true,
    cookie: { maxAge: 24 * 60 * 60 * 10000 },
    resave: false
}))
const client = new AuthorizationCode(configFile.oauth);
const states = new Map();
let db = new Map();
let invites = new Map();
const serverClient = new net.Socket();
serverClient.connect(1234, "minecraft");

if (fs.existsSync("data/db.json")) {
    db = new Map(Object.entries(JSON.parse(fs.readFileSync("data/db.json"))));
}
if (fs.existsSync("data/invites.json")) {
    invites = new Map(Object.entries(JSON.parse(fs.readFileSync("data/invites.json"))));
}
function saveDB() {
    fs.writeFileSync("data/db.json", JSON.stringify(Object.fromEntries(db)));
    fs.writeFileSync("data/invites.json", JSON.stringify(Object.fromEntries(invites)));
}

function randomString(length) {
    const chars = "abcdefghijlkmnopqrstuvwxyzABCDEFGHIJLKMNOPQRSTUVWXYZ0123456789";
    let result = "";

    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }

    return result;
}

// Oauth zooi
app.get("/auth", (req, res) => {
    if (typeof req.query.state === "undefined" || !states.has(req.query.state)) return res.redirect("/status.html?code=0");

    const authorizationUri = client.authorizeURL({
        redirect_uri: `${configFile.base_uri}/callback`,
        scope: "user/basic",
        state: req.query.state
    });

    res.redirect(authorizationUri);
});
app.get("/callback", async (req, res) => {
    if (typeof req.query.state === "undefined" || !states.has(req.query.state) || typeof req.query.code === "undefined") return res.redirect("/status.html?code=0");

    const tokenParams = {
        code: req.query.code,
        redirect_uri: `${configFile.base_uri}/callback`,
        scope: "user/basic",
    };

    try {
        const tokenDetails = await client.getToken(tokenParams);
        const accessToken = tokenDetails.token.access_token;

        axios.get("https://leden.djoamersfoort.nl/api/v1/member/details", {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }) .then(_res => {
            const state = states.get(req.query.state);
            if (db.has(_res.data.id)) {
                if (db.get(_res.data.id) === state.username) {
                    state.ownerShip = true;
                } else {
                    state.ownerShip = false;
                    return res.redirect("/status.html?code=1&info=" + encodeURIComponent(db.get(_res.data.id)));
                }
            } else {
                const values = [...db.values()];
                const inviteValues = [...invites.values()];
                if (values.includes(state.username) || inviteValues.includes(state.username)) {
                    state.ownerShip = false;
                    return res.redirect("/status.html?code=2&info=" + encodeURIComponent(state.username));
                }

                db.set(_res.data.id, state.username);
                saveDB();
                state.ownerShip = true;
            }

            req.session.username = state.username;

            req.session.method = 0;
            state.method = 0;

            serverClient.write(state.username + "\n");
            return res.redirect("/status.html");
        })
            .catch(err => {
                console.log(err);
                return res.redirect("/status.html?code=3");
            })
    } catch (e) {
        return res.redirect("/status.html?code=4");
    }
})

// Invite code stuff
app.get("/inviteLogin", (req, res) => {
    if (typeof req.query.code === "undefined" || typeof req.query.state === "undefined" || !states.has(req.query.state)) return res.redirect("/status.html?code=0");
    if (!invites.has(req.query.code)) return res.redirect("/status.html?code=5");

    const state = states.get(req.query.state);
    const codeValue = invites.get(req.query.code);
    if (codeValue === null) {
        const values = [...db.values()];
        const inviteValues = [...invites.values()];
        if (values.includes(state.username) || inviteValues.includes(state.username)) {
            state.ownerShip = false;
            return res.redirect("/status.html?code=2&info=" + encodeURIComponent(state.username));
        }

        invites.set(req.query.code, state.username);
        saveDB();
        state.ownerShip = true;
    } else {
        if (codeValue === state.username) {
            state.ownerShip = true;
        } else {
            state.ownerShip = false;
            return res.redirect("/status.html?code=1&info=" + encodeURIComponent(db.get(_res.data.id)));
        }
    }

    req.session.username = state.username;

    req.session.method = 1;
    state.method = 1;

    serverClient.write(state.username + "\n");
    return res.redirect("/status.html");
});

// Login page
app.get("/login", (req, res) => {
    if (typeof req.query.state === "undefined" || !states.has(req.query.state)) return res.redirect("/status.html?code=0");
    const state = states.get(req.query.state);
    if (req.session.username && state.username === req.session.username) {
        state.ownerShip = true;
        state.method = req.session.method;
        serverClient.write(state.username + "\n");
        return res.redirect("/status.html");
    }

    res.sendFile(__dirname + "/public/login.html");
})

// API for mc server
app.get("/api/genState", (req, res) => {
    if (typeof req.query.username === "undefined") return res.redirect("/status.html?code=0");

    const username = req.query.username;
    const stateID = randomString(10);

    states.set(stateID, {
        username,
        ownerShip: null,
        method: null
    });

    return res.json({
        state: stateID,
        auth: `${configFile.base_uri}/login?state=${stateID}`
    })
});
app.get("/api/checkState", (req, res) => {
    if (typeof req.query.state === "undefined" || !states.has(req.query.state)) return res.redirect("/status.html?code=0");

    return res.json(states.get(req.query.state));
});

app.listen(PORT, () => {console.log(`App listening on port ${PORT}`)});