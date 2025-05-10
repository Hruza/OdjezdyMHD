// DataFetcher class to handle API requests
class DataFetcher {
  constructor(apiUrl, authorization = "", apiKey = "") {
    this.apiUrl = apiUrl;
    this.authorization = authorization;
    this.apiKey = apiKey;
  }

  async replacePlaceholder(item, urlParams) {
    if (typeof item === "string" && item.startsWith("$")) {
      const paramKey = item.substring(1);
      const [key, defaultValue] = paramKey.split("[");
      return (await urlParams.get(key)) || defaultValue?.slice(0, -1) || item;
    } else if (typeof item === "string" && item.startsWith("#")) {
      switch (item.substring(1).toLowerCase()) {
        case "lat":
          const latPosition = await this.getGeolocation();
          return latPosition?.latitude || null;
        case "lon":
          const lonPosition = await this.getGeolocation();
          return lonPosition?.longitude || null;
        case "apikey":
          return this.apiKey;
        default:
          // Undefined placeholder, return as is
          return item;
      }
    } else {
      return await item;
    }
  }

  getGeolocation() {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.error("Geolocation error:", error);
            resolve(null); // Resolve with null if geolocation fails
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
        resolve(null); // Resolve with null if geolocation is not supported
      }
    });
  }

  async fetchData(params = {}) {
    const urlParams = new URLSearchParams(window.location.search);

    // Replace placeholders in params with URL parameter values
    for (const key of Object.keys(params)) {
      if (Array.isArray(params[key])) {
        params[key] = await Promise.all(
          params[key].map((item) => this.replacePlaceholder(item, urlParams))
        );
      } else {
        params[key] = await this.replacePlaceholder(params[key], urlParams);
      }
    }

    const url = new URL(this.apiUrl);
    Object.keys(params).forEach((key) => {
      if (Array.isArray(params[key])) {
        params[key].forEach((value) =>
          url.searchParams.append(`${key}[]`, value)
        );
      } else {
        url.searchParams.append(key, params[key]);
      }
    });

    try {
      var response;
      if (this.authorization) {
        response = await fetch(url, {
          headers: {
            [this.authorization]: this.apiKey,
          },
        });
      } else {
        response = await fetch(url);
      }
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch data:", error);
      return null;
    }
  }
}

// Renderer class to handle DOM updates
class Renderer {
  constructor(container) {
    this.container = container;
    this.container.innerHTML = "Loading...";
  }

  render(data, renderCallback, drawConfigs) {
    this.container.innerHTML = ""; // Clear previous content
    if (!data) {
      this.container.innerHTML = "<p>No data available.</p>";
      return;
    }
    renderCallback(this.container, data, drawConfigs);
  }
}

function getPictogram(route) {
  if (["A", "B", "C", "D"].includes(route)) {
    return "./img/travel-metro.svg";
  } else if (route < 100) {
    return "./img/travel-tram.svg";
  } else {
    return "./img/travel-bus.svg";
  }
}

function getTimeColor(minutes) {
  if (minutes < 3) {
    return "text-red-700";
  } else if (minutes < 6) {
    return "text-yellow-600";
  } else if (minutes < 10) {
    return "text-green-600";
  } else if (minutes < 20) {
    return "text-yellow-600";
  } else {
    return "text-red-700";
  }
}

// Module handlers for different types
const moduleHandlers = {
  weather: (container, data) => {
    const weatherContainer = document.createElement("div");
    weatherContainer.className =
      "flex flex-wrap gap-4 flex-center justify-center";
    const weatherElement = document.createElement("div");
    weatherElement.className =
      "weather-item p-4 bg-gray-300/60 backdrop-blur-xs rounded-lg text-center mt-2";
    weatherElement.innerHTML = `
      <div class="text-center flex items-center justify-center gap-4">
      <div>
        <p class="text-2xl font-bold text-text-1">${
          data.main.temp.toFixed(1)}°C</p>
        <p class="text-sm text-gray-500">Feels like ${
          data.main.feels_like.toFixed(1)}°C</p>
      </div>
      <div class="flex flex-col text-sm">
        <div class="text-center">
        <span class="block text-gray-500">Min</span>
        <span class="text-blue-800">${data.main.temp_min.toFixed(
          1
        )}°C</span>
        </div>
        <div class="text-center mt-1">
        <span class="block text-gray-500">Max</span>
        <span class="text-red-700">${
          data.main.temp_max.toFixed(1)}°C</span>
        </div>
      </div>
      </div>
    `;
    weatherContainer.appendChild(weatherElement);
    container.appendChild(weatherContainer);
  },
  departure: (container, data, configs) => {
    const stopIdToNameMap = data.stops.reduce((map, stop) => {
      map[stop.stop_id] = stop.stop_name;
      return map;
    }, {});
    const groupedDepartures = data.departures.reduce((groups, departure) => {
      const key = `${stopIdToNameMap[departure.stop.id] || "Unknown"}|${
        departure.stop.platform_code || "Unknown"
      }`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(departure);
      return groups;
    }, {});

    const departuresContainer = document.createElement("div");
    departuresContainer.className =
      "flex flex-wrap gap-4 flex-center justify-center";
    var platforms = Object.keys(groupedDepartures).sort((a, b) =>
      a.localeCompare(b)
    );
    if (Object.keys(configs).includes("platforms")) {
      platforms = platforms.filter((platform) =>
        configs.platforms.includes(platform.split("|")[1])
      );
    }

    for (const platform of platforms) {
      const stopName = platform.split("|")[0];
      const platformCode = platform.split("|")[1];
      const platformContainer = document.createElement("div");
      platformContainer.className =
        "platform-group max-w-150 my-4 p-4 bg-gray-300/60 backdrop-blur-xs rounded-lg text-center";
      platformContainer.innerHTML = `
      <div class="p-1 bg-gray-100 gap-x-5 shadow-md rounded-lg border border-gray-200 m-2">
      <h3>${stopName} <b>${platformCode}</b></h3>
      </div>
      `;
      departuresContainer.appendChild(platformContainer);

      groupedDepartures[platform].forEach((departure) => {
        const departureElement = document.createElement("div");
        departureElement.className = "item";
        const delay = Math.max(
          Math.floor(
            (new Date(departure.departure_timestamp.predicted) -
              new Date(departure.departure_timestamp.scheduled)) /
              60000
          ),
          0
        );
        const minutes = Math.ceil(
          (new Date(departure.departure_timestamp.predicted) - new Date()) /
            60000
        );
        departureElement.innerHTML = `
        <div class="p-3 grid grid-flow-col bg-gray-100 gap-x-5 shadow-md rounded-lg border border-gray-200 m-2">
        <div class="w-35 flex flex-col items-center justify-center mb-1">
          <div class="mt-1 flex items-center justify-center mb-1">
            <img src="${getPictogram(
              departure.route.short_name
            )}" alt="Pictogram" class="w-8 h-8 mr-2">
            <span class="text-text-1 font-bold">${
              departure.route.short_name
            }</span>
          </div>
          <div class="h-10 text-text-1 mt-2 wrap-normal w-30 justify-center items-center flex">
            ${departure.trip.headsign}
          </div>
        </div>
        <div class="flex flex-col items-center justify-center mb-1 mr-3">
          <div class="text-text-1 mt-2 text-left">
          ${new Date(
            departure.departure_timestamp.predicted
          ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          ${delay > 0 ? ` (+${delay} min)` : ""}
          </div>
          <div class="text-text-1 mt-2 text-left">
          <span class="${getTimeColor(
            minutes
          )} font-bold">in ${minutes} minutes</span>
          </div>
        </div>
        </div>
        `;
        platformContainer.appendChild(departureElement);
      });
    }
    container.appendChild(departuresContainer);
  },
};

const apiKeys = {};

// Fetch API keys from external JSON file
async function fetchApiKey(type) {
  if (!apiKeys[type]) {
    try {
      const response = await fetch("./api/key?key=" + type);
      if (!response.ok) {
        throw new Error(`Failed to load API keys: ${response.statusText}`);
      }
      apiKeys[type] = await response.json().then((data) => data.apiKey);
    } catch (error) {
      console.error(error);
      return null;
    }
  }
  return await apiKeys[type];
}

// Utility function to initialize elements with attached configurations
async function initializeElement(element) {
  const config = JSON.parse(element.getAttribute("data-config"));
  const {
    apiUrl,
    apiKeyLabel,
    authorization,
    type,
    drawConfigs,
    refreshInterval,
    ...params
  } = config;

  var apiKey = null;
  if (apiKeyLabel) {
    apiKey = await fetchApiKey(apiKeyLabel);
    if (!apiKey) {
      console.error(`API key not found for label: ${apiKeyLabel}`);
      element.innerHTML = `<p>API key not found for label: ${apiKeyLabel}</p>`;
      return;
    }
  }

  const dataFetcher = new DataFetcher(apiUrl, authorization, apiKey);

  const renderer = new Renderer(element);

  const fetchAndRender = async () => {
    const data = await dataFetcher.fetchData(params);

    // Print the JSON response to the console
    console.log("Fetched data:", data);

    if (moduleHandlers[type]) {
      renderer.render(data, moduleHandlers[type], drawConfigs);
    } else {
      console.warn(`No handler defined for type: ${type}`);
      renderer.render(null, () => {
        element.innerHTML = `<p>Unsupported module type: ${type}</p>`;
      });
    }
  };

  // Initial fetch and render
  await fetchAndRender();

  if (refreshInterval) {
    // Set up interval for periodic updates
    setInterval(fetchAndRender, refreshInterval * 1000);
  }
}

// Initialize all elements with data-config
async function initialize() {
  if (!apiKeys) {
    console.error("Failed to load API keys.");
    return;
  }

  document.querySelectorAll("[data-config]").forEach((element) => {
    initializeElement(element, apiKeys);
  });
}

initialize();
