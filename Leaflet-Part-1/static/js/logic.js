// Define the API URL for fetching earthquake data
var queryURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

// Perform a GET request to fetch earthquake data
d3.json(queryURL).then(function(data) {
});

// Function to calculate marker size based on magnitude
function calculateRadius(magnitude) {
    return magnitude > 0 ? magnitude * 4 : 1;
}

// Function to determine marker color based on depth
function getDepthColor(depth) {
    if (depth <= 10) return "#98ee00";
    if (depth <= 30) return "#d4ee00";
    if (depth <= 50) return "#eecc00";
    if (depth <= 70) return "#ee9c00";
    if (depth <= 90) return "#ea822c";
    return "#ea2c2c";
}

// Initialize the map with a center and zoom level
const map = L.map("map", {
    center: [37.09, -95.71],
    zoom: 4
});

// Define tile layers for different map views
const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
});

const greyMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; OpenStreetMap contributors, SRTM | Style: OpenTopoMap'
});

const satelliteMap = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
});

// Group tile layers into an object for the layer control
const baseMaps = {
    "Satellite": satelliteMap,
    "Greyscale": greyMap,
    "Outdoors": streetMap,
};

// Add the default base layer to the map
streetMap.addTo(map);

// Create layer groups for earthquakes and tectonic plates
const earthquakeLayer = L.layerGroup();
const tectonicLayer = L.layerGroup();

// Add overlays to a control layer
const overlays = {
    "Tectonic Plates": tectonicLayer,
    "Earthquakes": earthquakeLayer
};

// Add the control to the map
L.control.layers(baseMaps, overlays, { collapsed: false }).addTo(map);

// Define the earthquake data source
const earthquakeDataUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

// Fetch and process earthquake data
fetch(earthquakeDataUrl)
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            pointToLayer: (feature, latlng) => L.circleMarker(latlng),
            style: feature => ({
                radius: calculateRadius(feature.properties.mag),
                fillColor: getDepthColor(feature.geometry.coordinates[2]),
                color: "#000",
                weight: 0.5,
                opacity: 1,
                fillOpacity: 0.7
            }),
            onEachFeature: (feature, layer) => {
                layer.bindPopup(`
                    <h3>${feature.properties.place}</h3>
                    <hr>
                    <p><strong>Date & Time:</strong> ${new Date(feature.properties.time)}</p>
                    <p><strong>Magnitude:</strong> ${feature.properties.mag}</p>
                    <p><strong>Depth:</strong> ${feature.geometry.coordinates[2]} km</p>
                `);
            }
        }).addTo(earthquakeLayer);

        // Add the earthquake layer to the map by default
        earthquakeLayer.addTo(map);
    });

// Define the tectonic plate data source
const tectonicDataUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json";

// Fetch and process tectonic plate data
fetch(tectonicDataUrl)
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: {
                color: "#ff7800",
                weight: 2
            }
        }).addTo(tectonicLayer);
    });

// Add a legend to the map for depth ranges
const legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
    const div = L.DomUtil.create("div", "info legend");
    const depth = [-10, 10, 30, 50, 70, 90];
    const colors = ["#98ee00", "#d4ee00", "#eecc00", "#ee9c00", "#ea822c", "#ea2c2c"];

    // Add legend title
    div.innerHTML = "<h4>Depth (km)</h4>";

    // Loop through depth intervals and generate a label with a colored square
    for (let i = 0; i < depth.length; i++) {
        div.innerHTML += `
            <i style="background: ${colors[i]}"></i>
            ${depth[i]}${depth[i + 1] ? "&ndash;" + depth[i + 1] : "+"}<br>
        `;
    }

    return div;
};

legend.addTo(map);
