export default (container, data) => {
  const weatherContainer = document.createElement("div");
  weatherContainer.className =
    "flex flex-wrap gap-4 flex-center justify-center";
  const weatherElement = document.createElement("div");
  weatherElement.className =
    "weather-item p-4 bg-gray-300/60 backdrop-blur-xs rounded-lg text-center mt-2";
  weatherElement.innerHTML = `
      <div class="text-center flex items-center justify-center gap-4">
      <div>
        <p class="text-2xl font-bold text-text-1">${data.main.temp.toFixed(
          1
        )}°C</p>
        <p class="text-sm text-gray-500">Feels like ${data.main.feels_like.toFixed(
          1
        )}°C</p>
      </div>
      <div class="flex flex-col text-sm">
        <div class="text-center">
        <span class="block text-gray-500">Min</span>
        <span class="text-blue-800">${data.main.temp_min.toFixed(1)}°C</span>
        </div>
        <div class="text-center mt-1">
        <span class="block text-gray-500">Max</span>
        <span class="text-red-700">${data.main.temp_max.toFixed(1)}°C</span>
        </div>
      </div>
      </div>
    `;
  weatherContainer.appendChild(weatherElement);
  container.appendChild(weatherContainer);
};
