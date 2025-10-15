const map = L.map('map').setView([12.9716, 77.5946], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

let stops = [];
let markers = [];
let routeLine = null;
const info = document.getElementById('info');

map.on('click', (e) => {
  const { lat, lng } = e.latlng;
  const marker = L.marker([lat, lng]).addTo(map);
  markers.push(marker);
  stops.push([lat, lng]);
  info.hidden = false;
  info.innerText = `Stops added: ${stops.length}`;
});

document.getElementById('clear-btn').addEventListener('click', () => {
  markers.forEach((m) => map.removeLayer(m));
  markers = [];
  stops = [];
  if (routeLine) map.removeLayer(routeLine);
  routeLine = null;
  info.hidden = true;
});

document.getElementById('optimize-btn').addEventListener('click', () => {
  if (stops.length < 2) {
    info.hidden = false;
    info.innerText = 'Add at least two stops to run optimization.';
    return;
  }
  const unvisited = [...stops];
  const route = [unvisited.shift()];
  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < unvisited.length; i++) {
      const d = distance(route[route.length - 1], unvisited[i]);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIndex = i;
      }
    }
    route.push(unvisited.splice(nearestIndex, 1)[0]);
  }
  if (routeLine) map.removeLayer(routeLine);
  routeLine = L.polyline(route, { color: '#2563eb', weight: 4 }).addTo(map);
  map.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
  const total = routeDistance(route).toFixed(2);
  const time = (total / 0.4).toFixed(1);
  const co2 = (total * 0.18).toFixed(2);
  info.hidden = false;
  info.innerHTML = `🛣 Total Distance: <b>${total} km</b><br>⏱ Estimated Time: <b>${time} min</b><br>🌱 Estimated CO₂: <b>${co2} kg</b>`;
});

function distance(a, b) {
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function routeDistance(route) {
  let total = 0;
  for (let i = 1; i < route.length; i++) total += distance(route[i-1], route[i]);
  return total;
}
