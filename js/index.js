/* JS du tableau de bord */

//chemin de stockage des données de l'extension
const DAT_PATH = "dev_stats_datas";

//sites disponibles dans la liste de recherche
const disponibleSites = ["openclassrooms.com", "stackoverflow.com", "chat.openai.com", "github.com", "gitlab.com", "developer.mozilla.org", "www.udemy.com", "sourceforge.net", "codepen.io"
    , "uiverse.io", "developpez.com", "codes-sources.commentcamarche.net", "itch.io"];

// faire apparaitre le menu déroulant quand on cherche un site
function searchSites(input) {
    const siteListDiv = document.getElementById('site-list');
    siteListDiv.innerHTML = '';
    const value = input.value.toLowerCase();

    // Recherche de sites correspondants dans la liste
    const filteredSites = disponibleSites.filter(site => site.toLowerCase().includes(value));

    if (filteredSites.length == 0) {
        siteListContainer.style.display = "none";
    } else {
        siteListContainer.style.display = "block";
    }

    // Affichage des sites correspondants
    filteredSites.forEach(site => {
        const siteDiv = document.createElement('div');
        siteDiv.textContent = site;
        siteDiv.onclick = () => {
            input.value = site;
            siteListDiv.innerHTML = '';
            siteListContainer.style.display = "none";
        };
        siteListDiv.appendChild(siteDiv);
    });

    /*// Ajout d'un bouton pour ajouter un nouveau site
    if (value && !filteredSites.includes(value)) {
        const addSiteBtn = document.createElement('button');
        addSiteBtn.textContent = `Ajouter "${value}"`;
        addSiteBtn.classList.add("classic-button");
        addSiteBtn.onclick = () => {
            disponibleSites.push(value);
            input.value = value;
            siteListDiv.innerHTML = '';
        };
        siteListDiv.appendChild(addSiteBtn);
    }*/
}

const siteInput = document.getElementById("input");
const siteListContainer = document.getElementById("site-list-container");

siteInput.addEventListener("keyup", () => {
    searchSites(siteInput);
})

//enlever les suggestions quand on clique en dehors
document.addEventListener('mouseup', function (event) {
    if ((!siteListContainer.contains(event.target) && siteListContainer.style.display == "block")) {
        siteListContainer.style.display = "none";
    }
});

//appelée dans une fonciton asynchrone, permet de la mettre en pause
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/*bouton ajouter site*/
const addSiteBtn = document.getElementById("add-site-button");

addSiteBtn.addEventListener("click", () => {
    newValue = siteInput.value;
    if (newValue != "" && newValue) {
        chrome.storage.local.get(DAT_PATH, function (data) {
            if (!data[DAT_PATH].hasOwnProperty(newValue)) { //soit data.dev_stats_datas.hasOwnProperty() soit data[DAT_PATH].hasOwnProperty()
                /*checkDomainExists(newValue)
                    .then(exists => {
                        console.log(`Le domaine ${newValue} ${exists ? "existe" : "n'existe pas"}`);
                    });*/
                data[DAT_PATH][newValue] = getDefaultValues();
                chrome.storage.local.set({ [DAT_PATH]: data[DAT_PATH] });
                input.value = '';
                appearPopup("added", newValue);
                refreshPage();
            } else {
                appearPopup("already-exist", newValue);
            }
        });
        //disponibleSites.push(siteInput.value);
    }
    //console.log(disponibleSites)
});

//valeurs par défaut à l'ajout d'une nouvelle clé (url) dans le cache
function getDefaultValues() {
    return { "elapsed": 0, "counter": 0, "date": "--", "resetDate": getDate() };
}

/*chrome.storage.local.get(DAT_PATH, function (data) {
    console.log(data);
})*/

/*vérifie si un nom de domaine existe*/
async function checkDomainExists(domain) {
    try {
        const response = await fetch(`https://${domain}`, { method: 'HEAD' });
        return response.status === 200;
    } catch (e) {
        return false;
    }
}

const addedPopup = document.getElementById("added-popup");

//Fait apparaitre le message en haut du site quand una ction importante est effectuée
function appearPopup(type, url) {
    const messageParagraph = addedPopup.querySelector('p');
    const redRgb = "rgb(221, 21, 21)";
    const greenRgb = "rgb(38, 180, 133)";

    switch (type) {
        case "already-exist":
            addedPopup.style.backgroundColor = "rgb(221, 21, 21)";
            messageParagraph.innerHTML = `Website : <span class="website-url">${url}</span> was already in the list.`;
            break;
        case "added":
            addedPopup.style.backgroundColor = "rgb(38, 180, 133)";
            messageParagraph.innerHTML = `Website : <span class="website-url">${url}</span> was successfully added to the list.`;
            break;
        case "resetAll":
            addedPopup.style.backgroundColor = greenRgb;
            messageParagraph.innerText = "All extension data has been successfully reseted.";
            break;
        case "reset":
            addedPopup.style.backgroundColor = greenRgb;
            messageParagraph.innerText = "All counters have been successfully reseted to 0.";
            break;
        case "resetSite":
            addedPopup.style.backgroundColor = greenRgb;
            messageParagraph.innerHTML = `Website : <span class="website-url">${url}</span> have been reseted successfully.`;
            break;
        case "removeSite":
            addedPopup.style.backgroundColor = greenRgb;
            messageParagraph.innerHTML = `Website : <span class="website-url">${url}</span> have been removed from the list successfully.`;
            break;
        default:
            return;
    }

    addedPopup.style.display = "block";
    addedPopup.style.opacity = "1";
    /*setTimeout(() => {
        addedPopup.style.opacity = "1";
    }, 10);*/

    setTimeout(() => {
        addedPopup.style.opacity = "0";
    }, 3000);

    setTimeout(() => {
        addedPopup.style.display = "none";
    }, 3500);
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

const tableBody = document.querySelector("#stats-table tbody");

var csvString = `Website,Visits,Last visit,Elapsed time`;
var datasTab = {};
var allSitesTd;

//génère la tableau des données utilisateur
function generateTable() {
    getOrderedKeys().then(keys => {
        chrome.storage.local.get(DAT_PATH, function (result) {
            const data = result[DAT_PATH];
            tableBody.innerHTML = "";
            let iconPath;

            let nbVisitsTotal = 0;
            let dateTotal = "01/01/1970";
            let elapsedSecondsTotal = 0;

            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const urlData = data[key];
                //const counter = urlData.counter;
                //const valueSpan = visitedUl.children[i].querySelector('.value');
                //valueSpan.textContent = counter;
                disponibleSites.includes(key) ? iconPath = key : iconPath = "unknown";
                const tableCode = `
                <tr>
                    <td>
                        <div class="reset-site-btn interact-site-btn">O</div>
                        <div class="remove-site-btn interact-site-btn">-</div>
                    </td>
                    <td data-tooltip-content="Added on ${urlData.resetDate}">
                        <div class="flex-container">
                            <img src="../res/icons/${iconPath}.png" class="tiny-icon" alt="logo du site">${key}
                        </div>
                    </td>
                    <td>${urlData.counter}</td>
                    <td>${urlData.date}</td>
                    <td>${formatSeconds(urlData.elapsed)}</td>
                </tr>
                `;

                tableBody.insertAdjacentHTML('beforeend', tableCode);

                csvString += `\n${key},${urlData.counter},${urlData.date},${urlData.elapsed}`;
                datasTab[key] = { 'counter': urlData.counter, 'elapsed': urlData.elapsed };

                nbVisitsTotal += urlData.counter;
                elapsedSecondsTotal += urlData.elapsed;
                dateTotal = getMostRecentDate(dateTotal, urlData.date);
            }
            //console.log(datasTab)
            allSitesTd = document.querySelectorAll('#stats-table tbody tr td:nth-child(2)')
            setupSitesTooltips();
            createGraphics();
            setupRemoveSiteBtns();
            updateLastReset();

            createTotalLine(keys.length, nbVisitsTotal, dateTotal, elapsedSecondsTotal);
        });
    });
}

//crée la dernière ligne du tableau indiquant les totaux
function createTotalLine(nbSitesTotal, nbVisitsTotal, dateTotal, elapsedSecondsTotal) {
    let lineCode = `
    <tr>
        <td></td>
        <td>${nbSitesTotal}</td>
        <td>${nbVisitsTotal}</td>
        <td>${dateTotal}</td>
        <td>${formatSeconds(elapsedSecondsTotal)}</td>
    </tr>
    `;
    tableBody.insertAdjacentHTML('beforeend', lineCode);
}

/*Renvoie la date la plus récente des 2 qui lui sont passées en paramètres*/
function getMostRecentDate(date1, date2) {
    if (date2 == "--") return date1;
    const [jour1, mois1, annee1] = date1.split('/').map(Number);
    const [jour2, mois2, annee2] = date2.split('/').map(Number);
    const date1Obj = new Date(annee1, mois1 - 1, jour1);
    const date2Obj = new Date(annee2, mois2 - 1, jour2);

    if (date1Obj > date2Obj) {
        return date1;
    } else {
        return date2;
    }
}


//transforme des secondes au format hh:mm:ss
function formatSeconds(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds - hours * 3600) / 60);
    const seconds = totalSeconds - hours * 3600 - minutes * 60;

    let result = '';
    if (hours > 0) {
        result += hours + 'h';
    }
    if (minutes > 0) {
        result += ' ' + minutes + 'm';
    }
    if (seconds > 0 || result === '') {
        result += ' ' + seconds + 's';
    }

    return result.trim();
}

generateTable();

//convertir un chaine de caractères en tableau csv
function csvToArray(csvString) {
    let rows = csvString.split('\n');
    let headers = rows[0].split(',');
    let values = rows.slice(1).map(row => row.split(','));
    return [headers, ...values];
}

//génère un fichier csv à partir d'un tableau
function generateCsvFile(data) {
    let csvContent = '';
    data.forEach(row => {
        let rowContent = row.join(',');
        csvContent += rowContent + '\n';
    });
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement('a');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodedUri);
    link.setAttribute('download', 'data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

//à appeler pour télécharger le fichier csv
function downloadCsvFile(csvString) {
    let data = csvToArray(csvString);
    generateCsvFile(data);
}

const dlCsvBtn = document.getElementById('dl-csv-button');

dlCsvBtn.addEventListener('click', () => {
    downloadCsvFile(csvString);
})


const resetAllButton = document.getElementById('reset-all-button');
const resetButton = document.getElementById('reset-button');

resetAllButton.addEventListener('click', () => {
    resetAllData();
    appearPopup("resetAll", "none");
});

resetButton.addEventListener('click', () => {
    resetData();
    appearPopup("reset", "none");
});

function resetData() {
    chrome.storage.local.get(DAT_PATH, function (result) {
        const devStatsData = result[DAT_PATH];
        for (const key in devStatsData) {
            devStatsData[key] = getDefaultValues();
        }
        devStatsData["Internal_last_clear_date"] = getDate();
        chrome.storage.local.set({ [DAT_PATH]: devStatsData });
        refreshPage();
    });
}


function resetAllData() {
    removeDAT_PATH();
    initialize();
}

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
    chrome.storage.local.set({ [DAT_PATH]: data }, function () {
        refreshPage();
    });
}


//détruit la variable de stockage de l'application (hard reset)
function removeDAT_PATH() {
    chrome.storage.local.remove(DAT_PATH);
}

//renvoie une string de la data au format jj/mm/aaaa
function getDate() {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return day + '/' + month + '/' + year;
}

/*updater le last reset*/
const lastReset = document.getElementById('last-reset');

function updateLastReset() {
    chrome.storage.local.get(DAT_PATH, function (data) {
        lastReset.innerText = "Depuis le " + data[DAT_PATH]['Internal_last_clear_date'];
    });
}

/*retirer un site un par un*/
async function setupRemoveSiteBtns() {
    const removeSiteBtns = document.querySelectorAll('.remove-site-btn');
    const resetSiteBtns = document.querySelectorAll('.reset-site-btn');

    removeSiteBtns.forEach(rmBtn => {
        rmBtn.addEventListener("click", () => {
            removeSite(rmBtn);
        });
    });

    resetSiteBtns.forEach(rsBtn => {
        rsBtn.addEventListener("click", () => {
            resetSite(rsBtn);
        });
    });
}
setupRemoveSiteBtns();


function removeSite(rmBtn) {
    const url = rmBtn.parentNode.parentNode.children[1].innerText;

    chrome.storage.local.get(DAT_PATH, function (items) {
        delete items[DAT_PATH][url];
        chrome.storage.local.set({ [DAT_PATH]: items[DAT_PATH] });
        refreshPage();
        appearPopup("removeSite", url);
    });
}

function resetSite(rsBtn) {
    const url = rsBtn.parentNode.parentNode.children[1].innerText;

    chrome.storage.local.get(DAT_PATH, function (result) {
        const devStatsData = result[DAT_PATH];
        devStatsData[url] = getDefaultValues();
        chrome.storage.local.set({ [DAT_PATH]: devStatsData });
        refreshPage();
        appearPopup("resetSite", url);
    });
}

/*graphiques chart.js*/
const chart1 = document.getElementById('chart1').getContext('2d');
const chart2 = document.getElementById('chart2').getContext('2d');

function createGraphics() {
    // Définition des données du graphique
    const labels = Object.keys(datasTab); // Les noms des sites web
    var data = Object.values(datasTab).map((site) => site.counter); // Les nombres de visites
    const backgroundColors = [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#8B008B',
        '#00FF7F',
        '#D2691E',
        '#9400D3',
    ]; // Les couleurs pour chaque secteur du diagramme

    // Création du graphique

    if (chart1.theChart1) {
        // Destroy the previous chart instance
        chart1.theChart1.destroy();
    }
    chart1.theChart1 = new Chart(chart1, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
            }]
        },
        options: {
            animation: {
                duration: 0
            },
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                    position: 'right',
                },
                title: {
                    display: true,
                    text: 'Number of visits for each website'
                }
            },
            /*legend: {
                display: false,
                position: 'right',
                labels: {
                    fontSize: 14,
                    fontColor: 'black',
                },
            },*/
            tooltips: {
                callbacks: {
                    label: (tooltipItem, data) => {
                        const label = data.labels[tooltipItem.index];
                        const value = data.datasets[0].data[tooltipItem.index];
                        return `${label}: ${value} (${((value / data.datasets[0]._meta[0].total) * 100).toFixed(2)}%)`;
                    },
                },
            },
        },
    });

    // Définition des données du graphique
    const data2 = Object.values(datasTab).map((site) => site.elapsed); // Les nombres de visites

    const labelTooltip2 = (tooltipItem) => {
        return `${formatSeconds(tooltipItem.parsed)}`;
    }
    // Création du graphique
    if (chart2.theChart2) {
        // Destroy the previous chart instance
        chart2.theChart2.destroy();
    }
    chart2.theChart2 = new Chart(chart2, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data2,
                backgroundColor: backgroundColors,
            }]
        },
        options: {
            animation: {
                duration: 0
            },
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                    position: 'right',
                },
                title: {
                    display: true,
                    text: 'Time elapsed for each website'
                },
                tooltip: {
                    callbacks: {
                        label: labelTooltip2,
                    },
                },
            },
        },
    });
}

/*tooltip survol sites*/
const siteTooltip = document.getElementById('site-tooltip');

document.body.addEventListener("mousemove", function (event) {
    moveTooltip(event);
});

function moveTooltip(e) {
    siteTooltip.style.top = `${e.clientY + 15}px`;
    siteTooltip.style.left = `${e.clientX + 15}px`;
}

function setupSitesTooltips() {
    allSitesTd.forEach(siteTd => {
        siteTd.addEventListener('mouseenter', () => {
            siteTooltip.innerHTML = siteTd.getAttribute("data-tooltip-content");
            siteTooltip.style.display = 'block';
        });
        siteTd.addEventListener('mouseleave', () => {
            siteTooltip.style.display = 'none';
        });
    });
}

//permet de rafraichir la page sans faire un loc.reload()
function refreshPage() {
    generateTable();
    setupRemoveSiteBtns();
}

//télécharger les graphiques
const dlGraphicsBtn = document.getElementById("dl-graphics-btn");
const allCanvas = document.querySelectorAll("#graphics-container canvas");

dlGraphicsBtn.addEventListener('click', downloadAllGraphics);

function changeChartsLegendVisiblity(visibility) {
    new Promise(resolve => {
        chart1.theChart1.options.plugins.legend.display = visibility;
        chart1.theChart1.update();
        chart2.theChart2.options.plugins.legend.display = visibility;
        chart2.theChart2.update();
        /*allCanvas[0].style.width = "500px";
        allCanvas[0].style.height = "500px";
        allCanvas[1].style.width = "500px";
        allCanvas[1].style.height = "500px";

        allCanvas[0].width = 500;
        allCanvas[0].height = 500;

        allCanvas[1].width = 500;
        allCanvas[1].height = 500;*/
        chart1.width = 1000;
        chart1.theChart1.options.layout = { width: 50000, height: 540000 };

        chart1.theChart1.update()
        resolve();
    });
}

async function downloadAllGraphics() {
    await changeChartsLegendVisiblity(true);

    // Crée un nouveau canvas qui contiendra toutes les images fusionnées
    const mergedCanvas = document.createElement('canvas');
    //mergedCanvas.width = 500;
    //chart1.width = 1000;
    //chart1.height = 1000;
    //console.log(allCanvas[0].style.width)
    mergedCanvas.width = allCanvas[0].width;
    mergedCanvas.height = Array.from(allCanvas).reduce((acc, curr) => acc + curr.height, 0);
    const mergedContext = mergedCanvas.getContext('2d');

    // Ajouter un fond blanc à l'image
    mergedContext.fillStyle = '#ffffff';
    mergedContext.fillRect(0, 0, mergedCanvas.width, mergedCanvas.height);

    // Dessiner l'image sur le dessus du fond blanc
    mergedContext.drawImage(mergedCanvas, 0, 0);

    // Boucle à travers chaque canvas et dessine sur le canvas fusionné
    let currentY = 0;
    allCanvas.forEach(canvas => {
        mergedContext.drawImage(canvas, 0, currentY);
        currentY += canvas.height;
    });

    // Convertit le canvas fusionné en image jpg et télécharge le fichier
    const image = mergedCanvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = `devStats-graphics-${getDate()}.png`;
    link.href = image;
    link.click();

    changeChartsLegendVisiblity(false);
}