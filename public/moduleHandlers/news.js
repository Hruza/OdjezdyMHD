export default async (container, data) => {
  const newsContainer = document.createElement("div");
  newsContainer.className = "news-list flex flex-col gap-4";

  if (!data || data.length === 0) {
    newsContainer.innerHTML = `<p>No news available.</p>`;
  } else {
    newsContainer.innerHTML = data
      .map(
        (item) => `
        <div class="news-item p-4 bg-gray-300/60 backdrop-blur-xs rounded-lg shadow-md">
          <h3 class="text-lg font-bold">
            <a href="${
              item.link
            }" target="_blank" class="text-blue-600 hover:underline">${
          item.title
        }</a>
          </h3>
          <p class="text-sm text-gray-700 mt-2">${item.description}</p>
          <small class="text-gray-500">${new Date(
            item.pubDate
          ).toLocaleString()}</small>
        </div>
      `
      )
      .join("");
  }

  container.appendChild(newsContainer);
};
