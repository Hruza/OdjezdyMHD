export default async (container, data) => {
  const newsContainer = document.createElement("div");
  newsContainer.className = "news-list flex flex-col gap-4";

  if (!data || !data.summary) {
    newsContainer.innerHTML = `<p>No news summary available.</p>`;
  } else {
    const summaryText = data.summary;
    newsContainer.innerHTML = `
      <div class="p-2 bg-gray-300/60 backdrop-blur-xs rounded-lg shadow-md">
      <div id="news-summary-panel" class="m-2 p-4 bg-gray-100 rounded-lg shadow-md relative overflow-hidden cursor-pointer">
        <p class="text-sm text-text-1">${summaryText}</p>
        <div id="speech-progress-bar-container" class="absolute bottom-0 left-0 right-0 h-1">
        <div id="speech-progress-bar" class="h-full bg-blue-500 transition-all duration-200" style="width:0%"></div>
        </div>
      </div>
      </div>
    `;

    // Append the container first
    container.appendChild(newsContainer);

    // Setup speech synthesis with progress bar
    setupSpeechSynthesisWithProgressBar(newsContainer, summaryText);
  }

  // Helper function for speech synthesis and progress bar
  function setupSpeechSynthesisWithProgressBar(newsContainer, summaryText) {
    const textPanel = newsContainer.querySelector("#news-summary-panel");
    const progressBarContainer = newsContainer.querySelector(
      "#speech-progress-bar-container"
    );
    const progressBar = newsContainer.querySelector("#speech-progress-bar");

    textPanel.addEventListener("click", () => {
      const synth = window.speechSynthesis;
      if (synth) {
        if (synth.speaking) {
          synth.cancel(); // Stop the current speech if it's already speaking
          progressBar.style.width = "0%";
          progressBarContainer.style.display = "none";
        } else {
          const cleanSummaryText = summaryText.replace(/<\/?[^>]+(>|$)/g, ""); // Remove HTML tags
          const utterance = new SpeechSynthesisUtterance(cleanSummaryText);
          utterance.lang = "cs-CZ"; // Set the language to Czech

          // Show progress bar and reset
          progressBar.style.width = "0%";
          progressBarContainer.style.display = "block";

          let startTime = null;
          // Try to estimate duration based on speech rate and text length
          let speechRate = utterance.rate || 1;
          let words = cleanSummaryText.trim().split(/\s+/).length;
          const wordsPerSecond = 2.3; // Average words per second for speech synthesis
          let estimatedDuration = Math.max(words / (speechRate * wordsPerSecond), 1);

          // Animate progress bar
          function animateProgressBar(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = (timestamp - startTime) / 1000;
            const percent = Math.min((elapsed / estimatedDuration) * 100, 100);
            progressBar.style.width = percent + "%";
            if (percent < 100 && synth.speaking) {
              requestAnimationFrame(animateProgressBar);
            }
          }

          utterance.onstart = () => {
            startTime = null;
            requestAnimationFrame(animateProgressBar);
          };

          utterance.onend = () => {
            progressBar.style.width = "100%";
            setTimeout(() => {
              progressBarContainer.style.display = "none";
              progressBar.style.width = "0%";
            }, 500);
          };

          utterance.onerror = () => {
            progressBarContainer.style.display = "none";
            progressBar.style.width = "0%";
          };

          synth.speak(utterance);
        }
      } else {
        console.warn("Speech Synthesis API is not supported in this browser.");
      }
    });
  }
};
