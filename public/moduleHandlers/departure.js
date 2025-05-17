export default (container, data, configs) => {
  const stopIdToNameMap = data.stops.reduce((map, stop) => {
    map[stop.stop_id] = stop.stop_name;
    return map;
  }, {});
  const groupedDepartures = data.departures.reduce((groups, departure) => {
    const key = `${stopIdToNameMap[departure.stop.id] || "Unknown"}|${
      departure.stop.platform_code || ""
    }`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(departure);
    return groups;
  }, {});
  const departuresContainer = document.createElement("div");
  departuresContainer.className =
    "flex flex-wrap gap-x-4 flex-center justify-center mb-4";
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
      "platform-group max-w-150 mt-4 p-4 bg-gray-300/60 backdrop-blur-xs rounded-lg text-center";
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
        (new Date(departure.departure_timestamp.predicted) - new Date()) / 60000
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
};

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
