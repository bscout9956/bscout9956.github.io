// Welcome to a lot of handcoded TRASH.

function getCarCoord(distances, curDistance) {
    // Clamp to boundaries
    curDistance = Math.max(0, Math.min(curDistance, distances[distances.length - 1].distance));

    let bestCandidate = coordBinSearch(distances, curDistance);

    if (bestCandidate === 0) {
        let coord = distances[0].coord;
        return [coord[1], coord[0]];
    }

    if (bestCandidate === -1) {
        console.error("Unable to find a candidate coordinate pair");
        return [0, 0];
    }

    let prevPoint = distances[bestCandidate - 1];
    let nextPoint = distances[bestCandidate];

    let prevDistance = curDistance - prevPoint.distance;
    let nextDistance = nextPoint.distance - curDistance;

    let fracDistance = prevDistance / (prevDistance + nextDistance);
    let lerpCoord = [
        prevPoint.coord[0] + (nextPoint.coord[0] - prevPoint.coord[0]) * fracDistance,
        prevPoint.coord[1] + (nextPoint.coord[1] - prevPoint.coord[1]) * fracDistance
    ]

    return [lerpCoord[1], lerpCoord[0]];
}

// No idea, but we want it.
// Already lon, lat for the geojson format
function haversineDistance(c1, c2) {
    const R = 6371000; // Earth radius in meters ig

    const toRad = degrees => degrees * Math.PI / 180;

    const [lon1, lat1] = c1.map(toRad);
    const [lon2, lat2] = c2.map(toRad);

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Meters
}

function coordBinSearch(arr, value) {
    let start = 0, end = arr.length - 1;
    let bestCandidate = -1;

    while (start <= end) {
        let mid = Math.floor((start + end) / 2);

        if (arr[mid].distance < value) {
            start = mid + 1;
        } else {
            bestCandidate = mid;
            end = mid - 1;
        }
    }

    return bestCandidate;
}

async function getRouteDirections() {
    const routeResponse = await fetch("./route_data.json");
    const routeData = await routeResponse.json();
    return routeData.routes[0].geometry;
}

async function getTotalDistance() {
    const routeResponse = await fetch("./route_data.json");
    const routeData = await routeResponse.json();
    return routeData.routes[0].legs[0].distance;
}

async function getLineDistances() {
    const routeResponse = await fetch("./route_data.json");
    const routeData = await routeResponse.json();
    let points = routeData.routes[0].geometry.coordinates;

    let prevCoord = points[0];
    let distDelta = 0;
    let distances = [];

    points.forEach(coord => {
        let distance = haversineDistance(prevCoord, coord);
        distDelta += distance;

        distances.push({
            coord: coord,
            distance: distDelta
        });

        prevCoord = coord;
    });

    return distances;
}