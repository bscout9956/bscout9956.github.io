import { LeafletMap, TileLayer, Marker, DefaultIcon, GeoJSON, DivIcon } from 'leaflet';

const mapOptions = {
    boxZoom: false,
    keyboard: false,
    punchZoom: false,
    zoomControl: false
}

const pcDate = new Date(Date.UTC(2027, 1, 15, 0, 0)); // Index 1 for February
const releaseDate = new Date(Date.UTC(2026, 10, 19, 0, 0)); // Index 10 for November
let speed;
let prevPosition;

let totalDayCount = (pcDate - releaseDate) / (1000 * 60 * 60 * 24);
let daysLeftCount;

const carIcon = new DivIcon({
    html: '<i class="bi bi-car-front-fill vi-car-style" style="font-size: 32px;"></i>',
    className: '',
    iconAnchor: [16, 26],
});

const map = await buildMap();

// We handle if the start date is in the future.
let daysLeftUi = (daysLeftCount > totalDayCount) ? totalDayCount : daysLeftCount;
let percentage;

let distances = await getLineDistances();
let totalDistance = await getTotalDistance();

let curDistance;
let carMarker;

setCarMarker();

let musicSrc = document.querySelector("#music-src");
let track;

const nowPlaying = document.querySelector("#now-playing");
nowPlaying.innerText = `No Music Playing`;

var bgMusic = document.querySelector("#bg-music");
bgMusic.volume = 0.2;

let playButton = document.querySelector("#play-button");
playButton.onclick = () => {
    if (bgMusic.paused) {
        bgMusic.play();
        console.log("Playing audio track");
    } else {
        console.log("Pausing audio track");
        bgMusic.pause();
    }
}
let stopButton = document.querySelector("#stop-button");
stopButton.onclick = () => {
    console.log("Stopping audio track");
    bgMusic.pause();
    bgMusic.currentTime = 0;
}

updateProgress();
setInterval(updateProgress, 1000);

function updateProgress() {
    const now = new Date();

    if (percentage >= 0.5) {
        // Pending release of GTA VI so I can put the VI Pause Menu theme
        musicSrc.setAttribute("src", "assets/WIP.mp3");
        track = "WIP";
    } else {
        musicSrc.setAttribute("src", "assets/lscm.mp3");
        track = "Tangerine Dreams - Los Santos City Map";
    }

    if (bgMusic.paused) {
        nowPlaying.innerText = `No Music Playing`;
    } else {
        nowPlaying.innerText = `Now Playing: ${track}`;
    }

    daysLeftCount = (pcDate - now) / (1000 * 60 * 60 * 24);

    const daysRemainingEl = document.querySelector("#days-remaining");
    daysRemainingEl.innerText = `${Math.floor(daysLeftCount)} days left...`;

    // We handle if the start date is in the future.
    daysLeftUi = (daysLeftCount > totalDayCount) ? totalDayCount : daysLeftCount;
    percentage = 1 - (daysLeftUi / totalDayCount);

    const percIndicator = document.querySelector("#percentage-value");
    const percUi = (percentage * 100).toFixed(2);

    percIndicator.innerText = `${percUi} % Traveled`;
    const percBar = document.querySelector(".progress-bar-fg");
    percBar.style.setProperty('width', `${percUi}%`);

    curDistance = totalDistance * percentage;
    speed = (curDistance - prevPosition) * 3.6;
    prevPosition = curDistance;

    const distanceProgress = document.querySelector("#distance-progress");
    distanceProgress.innerText = `${curDistance.toFixed(2)}m out of ${totalDistance.toFixed(2)} meters...`

    const travelSpeed = document.querySelector("#travel-speed");
    travelSpeed.innerText = `We're traveling at ${speed.toFixed(2)} km/h`

    setCarMarker();
}

function setCarMarker() {
    let markerCoords = getCarCoord(distances, curDistance);

    if (!carMarker) {
        carMarker = new Marker(markerCoords, { icon: carIcon }).addTo(map);
        carMarker.bindTooltip(``);
    } else {
        carMarker.setLatLng(markerCoords);
    }

    carMarker.setTooltipContent(`We're ${Math.floor(daysLeftCount)} days away from the PC Release!`);
}

async function buildMap() {
    const map = new LeafletMap('map', {
        center: [39.8283, -98.5795],
        zoom: 5,
        ...mapOptions,
    });

    // LA Marker
    new Marker([34.011429, -118.494938], { icon: new DefaultIcon({ color: 'crimson' }) }).addTo(map);
    // Miami Marker
    new Marker([25.7696637, -80.1330655], { icon: new DefaultIcon({ color: 'magenta' }) }).addTo(map);

    const geoJSONfeature = await getRouteDirections();
    new GeoJSON(geoJSONfeature).addTo(map);

    new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    return map;
}
