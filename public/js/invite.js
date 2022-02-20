const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const state = urlParams.get("state");

const code = document.querySelector("#code");
const button = document.querySelector("#button");

button.addEventListener("click", () => {
    window.location.assign(`/inviteLogin?state=${state}&code=${code.value}`)
})