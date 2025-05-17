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
      if (this.position) {
        resolve({
          latitude: this.position.coords.latitude,
          longitude: this.position.coords.longitude,
        });
        return;
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.position = position;
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
      console.time(`Iteration for key: ${key}`);
      if (Array.isArray(params[key])) {
        params[key] = await Promise.all(
          params[key].map((item) => this.replacePlaceholder(item, urlParams))
        );
      } else {
        params[key] = await this.replacePlaceholder(params[key], urlParams);
      }
      console.timeEnd(`Iteration for key: ${key}`);
    }

    const url = this.apiUrl.startsWith("http") 
      ? new URL(this.apiUrl) 
      : new URL(this.apiUrl, window.location.origin);
    Object.keys(params).forEach((key) => {
      if (Array.isArray(params[key])) {
        params[key].forEach((value) =>
          url.searchParams.append(`${key}[]`, value)
        );
      } else {
        url.searchParams.append(key, params[key]);
      }
    });

    console.log("Fetching data from URL:", url.toString());
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
    this.container.innerHTML = "";
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
    apiKey,
    apiKeyLabel,
    authorization,
    type,
    drawConfigs,
    refreshInterval,
    ...params
  } = config;

  var apiKeySelected = apiKey;
  if (!apiKeySelected && apiKeyLabel) {
    apiKeySelected = await fetchApiKey(apiKeyLabel);
    if (!apiKeySelected) {
      console.error(`API key not found for label: ${apiKeyLabel}`);
      element.innerHTML = `<p>API key not found for label: ${apiKeyLabel}</p>`;
      return;
    }
  }

  const dataFetcher = new DataFetcher(apiUrl, authorization, apiKeySelected);

  const renderer = new Renderer(element);

  const fetchAndRender = async () => {
    const data = await dataFetcher.fetchData(params);

    // Print the JSON response to the console
    console.log("Fetched data:", data);

    try{
      const handler = await import(`./moduleHandlers/${type}.js`);
      renderer.render(data, handler.default, drawConfigs); 
    } catch (error) {
      console.error(`Failed to load handler for type: ${type}`, error);
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

// Initialize the application
initialize();