/** Codes overview:
 * 0 = 'No'
 * 1 = No multiple accounts [REQUIRES EXTRA INFO]
 * 2 = Someone else uses <name> [REQUIRES EXTRA INFO]
 * 3 = Error while fetching data
 * 4 = Error while handling login
 * 5 = Invite key doesn't exist
 * When omitted, the login succeeded.
 */

const codes = [
    "Ergens ging iets niet helemaal lekker...",
    "Je mag niet meer Minecraft-accounts hebben. Probeer <b>%info </b>te gebruiken.<br><br>Neem contact op met een admin als je je username gewijzigd hebt.",
    "<b>%info </b>wordt al door iemand anders gebruikt...",
    "Er ging iets mis bij het ophalen van je gegevens...",
    "Er ging iets mis bij het verwerken van die login...",
    "De invite key die je gebruikte bestaat niet..."
]