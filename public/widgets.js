// DataFetcher class to handle API requests
class DataFetcher {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async fetchData(params = {}) {
    const url = new URL(this.apiUrl);
    Object.keys(params).forEach((key) =>
      url.searchParams.append(key, params[key])
    );

    try {
      const response = await fetch(url, {
        headers: {
          "x-access-token": this.apiKey,
        },
      });
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
  if (route in ["A", "B", "C", "D"]) {
    return "./img/travel-metro.svg";
  } else if (route < 100) {
    return "./img/travel-tram.svg";
  } else {
    return "./img/travel-bus.svg";
  }
}

// Module handlers for different types
const moduleHandlers = {
  departure: (container, data, configs) => {
    const groupedDepartures = data.departures.reduce((groups, departure) => {
      const platform = departure.stop.platform_code || "Unknown";
      if (!groups[platform]) {
        groups[platform] = [];
      }
      groups[platform].push(departure);
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
        configs.platforms.includes(platform)
      );
    }

    for (const platform of platforms) {
      const platformContainer = document.createElement("div");
      platformContainer.className =
        "platform-group max-w-150 my-4 p-4 bg-gray-100 rounded-lg text-center";
      platformContainer.innerHTML = `<h3>Platform <b>${platform}</b></h3>`;
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
        departureElement.innerHTML = `
        <div class="p-4 grid grid-cols-[1fr_1fr] grid-rows-2 gap-x-10 shadow-md rounded-lg border border-gray-200 m-2">
        <div class="flex items-center justify-center mb-1">
        <img src="${getPictogram(
          departure.route.short_name
        )}" alt="Pictogram" class="w-8 h-8 mr-2">
        <span class="text-gray-700 font-bold">${
          departure.route.short_name
        }</span>
        </div>
        <div class="text-gray-700 mt-2 text-left">
        ${new Date(departure.departure_timestamp.predicted).toLocaleTimeString(
          [],
          { hour: "2-digit", minute: "2-digit" }
        )}
        ${delay > 0 ? ` (+${delay} min)` : ""}
        </div>
        <div class="text-gray-700 mt-2 justify-center flex">
          ${departure.trip.headsign}
        </div>
        <div class="text-gray-700 mt-2 text-left">
        <span class="text-green-600 font-bold">in ${Math.ceil(
          (new Date(departure.departure_timestamp.predicted) - new Date()) /
            60000
        )} minutes</span>
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
  const { apiUrl, apiKeyLabel, type, drawConfigs, ...params } = config;

  const apiKey = await fetchApiKey(apiKeyLabel);
  if (!apiKey) {
    console.error(`API key not found for label: ${apiKeyLabel}`);
    element.innerHTML = `<p>API key not found for label: ${apiKeyLabel}</p>`;
    return;
  }

  const dataFetcher = new DataFetcher(apiUrl, apiKey);
  const renderer = new Renderer(element);

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
