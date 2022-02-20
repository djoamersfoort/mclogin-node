const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const state = urlParams.get("state");

const djo = document.querySelector("#djo");
djo.addEventListener("click", () => {
    window.location.assign(`/auth?state=${state}`);
});

const invite = document.querySelector("#invite");
invite.addEventListener("click", () => {
    window.location.assign(`/invitecode.html?state=${state}`);
})