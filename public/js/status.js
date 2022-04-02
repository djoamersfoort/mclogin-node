const params = new URLSearchParams(location.search);
const code = params.get("code");
const extraInfo = params.get("info");
const title = document.querySelector("h1");
const description = document.querySelector("p");
if (code != null) {
    title.innerText = "Oei!";
    title.classList.add("error");
    description.innerHTML = codes[code].replace("%info", extraInfo);
}