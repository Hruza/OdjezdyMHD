export default async (container, data) => {
  const newsContainer = document.createElement("div");
  newsContainer.className = "news-list flex flex-col gap-4";

if (!data || !data.summary) {
    newsContainer.innerHTML = `<p>No news summary available.</p>`;
} else {
    newsContainer.innerHTML = `
    <div class="p-2 bg-gray-300/60 backdrop-blur-xs rounded-lg shadow-md">
        <div class="m-2 p-4 bg-gray-100 rounded-lg shadow-md">
            <p class="text-sm text-text-1">${data.summary}</p>
        </div>
    </div>
    `;
}

  container.appendChild(newsContainer);
};
