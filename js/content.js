/* exécutée sur la page à l'ouverture du site */

//chemin de stockage des données de l'extension
const DAT_PATH = "dev_stats_datas";
const elapsedTimeStep = 3;

//vérifie que la variable de stockage est présente dans le cache, sinon, la crée.
function initialize() {
    chrome.storage.local.get(DAT_PATH, function (result) {
        if (Object.keys(result).length === 0) {
            createDatas();
        }
    });
}

//crée et initialise le variable de stockage dans le cache
function createDatas() {
    let defaults = ["openclassrooms.com", "chat.openai.com", "stackoverflow.com"];
    let data = {};
    defaults.forEach(dfUrl => {
        data[dfUrl] = getDefaultValues();
    });
    data["Internal_last_clear_date"] = getDate();
    chrome.storage.local.set({ [DAT_PATH]: data });
}

//valeurs par défaut à l'ajout d'une nouvelle clé (url) dans le cache
function getDefaultValues() {
    return { "elapsed": 0, "counter": 0, "date": "--", "resetDate": getDate() };
}

/*chrome.storage.local.get(DAT_PATH, function (items) {
    console.log(items[DAT_PATH]);
});*/

//ajoute 1 au compteur d'un site, s'il est présent dans le cache
function incrementIfExists() {
    chrome.storage.local.get(DAT_PATH, function (result) {
        if (result[DAT_PATH] && result[DAT_PATH][location.hostname]) {
            console.log(location.hostname)
            const data = result[DAT_PATH];
            const urlData = data[location.hostname];
            const updatedUrlData = {
                ...urlData,
                counter: urlData.counter + 1,
                date: getDate(),
            };
            const updatedData = {
                ...data,
                [location.hostname]: updatedUrlData,
            };
            chrome.storage.local.set({ [DAT_PATH]: updatedData });
        }
    });
}

//détruit la variable de stockage de l'application (hard reset)
function removeDAT_PATH() {
    chrome.storage.local.remove(DAT_PATH, function () {
        console.log("DAT_PATH removed from storage.");
    });
}

//removeDAT_PATH();
initialize();
incrementIfExists();

//retourne la date actuelle sous le format jj/mm/aaaa
function getDate() {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return day + '/' + month + '/' + year;
}

//incrémenter timer toutes les 30sec en vérifiant si la fenêtre n'est pas fermée
var elapsedTimer = setInterval(countElapsedOnSite, elapsedTimeStep * 1000);

function countElapsedOnSite() {
    if (chrome && chrome.runtime && chrome.runtime.lastError) {
        clearInterval(elapsedTimer);
        return;
    }

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(DAT_PATH, function (items) {
            if (items[DAT_PATH][location.hostname] == null) return;
            items[DAT_PATH][location.hostname]["elapsed"] += elapsedTimeStep;
            chrome.storage.local.set({ [DAT_PATH]: items[DAT_PATH] });
        });
    } else {
        clearInterval(elapsedTimer);
    }
}

window.addEventListener('beforeunload', function () {
    clearInterval(elapsedTimer);
});





