/* exécuté sur le popup*/

//chemin de stockage des données de l'extension
const DAT_PATH = "dev_stats_datas";

//éléments du popup
const clearData = document.getElementById('clear-data');
const visitedUl = document.getElementById("visited-ul");
const lastClear = document.getElementById("last-clear");
const body = document.body;
const doubleCheck = document.getElementById('double-check')

clearData.addEventListener('click', () => {
    if (doubleCheck.style.display == "block") {
        resetData();
        window.close();
    } else {
        doubleCheckReset();
    }
});

async function doubleCheckReset() {
    doubleCheck.style.display = "block";
    await sleep(3000);
    doubleCheck.style.display = "none";
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function resetData() {
    chrome.storage.local.get(DAT_PATH, function (result) {
        const devStatsData = result[DAT_PATH];
        for (const key in devStatsData) {
            devStatsData[key] = getDefaultValues();
        }
        devStatsData["Internal_last_clear_date"] = getDate();
        chrome.storage.local.set({ [DAT_PATH]: devStatsData }, function () {
            location.reload();
        });
    });
}

/*function resetData() {
    removeDAT_PATH();
    initialize();
}*/

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

//détruit la variable de stockage de l'application (hard reset)
function removeDAT_PATH() {
    chrome.storage.local.remove(DAT_PATH, function () {
        updatePopup();
    });
}

//fonction qui renvoie un tableau par ordre croissant des sites (clés) qui ont été le plus visités (stockés dans la cache)
function getOrderedKeys() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(DAT_PATH, function (result) {
            const data = result[DAT_PATH];
            if (typeof data === "undefined" || data === null) return;
            const keys = Object.keys(data);

            const filteredKeys = keys.filter(key => !key.startsWith("Internal_"));

            filteredKeys.sort((a, b) => {
                const counterA = data[a].counter;
                const counterB = data[b].counter;
                return counterB - counterA;
            });

            resolve(filteredKeys);
        });
    });
}

//fonction qui met à jour le ul en triant par ordre décroissant les sites les plus visités
function updatePopup() {
    getOrderedKeys().then(keys => {
        chrome.storage.local.get(DAT_PATH, function (result) {
            const data = result[DAT_PATH];
            const visitedUl = document.getElementById("visited-ul");
            let topLength; (keys.length < 3) ? topLength = keys.length : topLength = 3;
            for (let i = 0; i < 3; i++) { //keys.length
                if (i >= topLength) {
                    visitedUl.children[i].style.display = "none";
                } else {
                    const key = keys[i];
                    const urlData = data[key];
                    const counter = urlData.counter;
                    const valueSpan = visitedUl.children[i].querySelector('.value');
                    valueSpan.textContent = counter;

                    // update the image of the site
                    const iconImg = visitedUl.children[i].querySelector('.tiny-icon');
                    var iconUrl = "../res/icons/" + key + ".png";
                    checkFileExists(iconUrl).then(newUrl => {
                        iconImg.src = newUrl;
                    });

                    //update title on mouseover
                    iconImg.title = key;
                }
            }
        });
    });
}

function checkFileExists(fileUrl) {
    return new Promise(resolve => {
        var http = new XMLHttpRequest();
        http.open('HEAD', fileUrl);
        http.onreadystatechange = function () {
            if (this.readyState == this.DONE && this.status != 404) {
                resolve("../res/icons/unknown.png");
            } else {
                resolve(fileUrl);
            }
        };
        http.send();
    });
}


initialize();
updatePopup();

function clearDatas() {
    chrome.storage.local.set({ ["openclassrooms.com"]: 0 });
    chrome.storage.local.set({ ["stackoverflow.com"]: 0 });
    chrome.storage.local.set({ ["chat.openai.com"]: 0 });

    updateVisitedUl();
    lastClear.querySelector(".date").innerText = getDate();
    chrome.storage.local.set({ ["dev_stats_last_clear"]: getDate() });
}

//renvoie une string de la data au format jj/mm/aaaa
function getDate() {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return day + '/' + month + '/' + year;
}

function getValue(tkey, callback) {
    chrome.storage.local.get(tkey, function (items) {
        var value = items[tkey];
        callback(value);
    });
}

function updateVisitedUl() {
    getValue("openclassrooms.com", function (value) {
        visitedUl.querySelector(".openclassrroms .value").innerHTML = value;
    });

    getValue("stackoverflow.com", function (value) {
        visitedUl.querySelector(".stackoverflow .value").innerHTML = value;
    });

    getValue("chat.openai.com", function (value) {
        visitedUl.querySelector(".chatgpt .value").innerHTML = + value;
    });
}

chrome.storage.local.get(DAT_PATH, function (data) {
    lastClear.querySelector(".date").innerText = data.dev_stats_datas.Internal_last_clear_date;
});

document.getElementById("open-full").addEventListener("click", function () {
    chrome.tabs.create({ url: "../html/index.html" });
});
