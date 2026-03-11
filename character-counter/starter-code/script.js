const pageRoot = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const themeLogo = document.getElementById("theme-logo");
const themeIcon = document.getElementById("theme-icon");
const textInput = document.getElementById("text-input");
const excludeSpacesCheckbox = document.getElementById("exclude-spaces");
const setCharacterLimitCheckbox = document.getElementById("set-character-limit");
const characterLimitInput = document.getElementById("character-limit");
const characterCountElement = document.getElementById("character-count");
const wordCountElement = document.getElementById("word-count");
const sentenceCountElement = document.getElementById("sentence-count");
const readingTimeElement = document.getElementById("reading-time");
const feedbackMessageElement = document.getElementById("feedback-message");
const densityListElement = document.getElementById("density-list");
const seeMoreButton = document.getElementById("see-more-button");

const WORDS_PER_MINUTE = 200;
const DENSITY_PREVIEW_COUNT = 5;
const THEME_STORAGE_KEY = "character-counter-theme";

let showAllDensity = false;

function applyTheme(theme) {
  const isLightTheme = theme === "light";

  pageRoot.classList.toggle("dark", !isLightTheme);
  themeToggle.checked = isLightTheme;
  themeLogo.src = isLightTheme ? "./assets/images/logo-light-theme.svg" : "./assets/images/logo-dark-theme.svg";
  themeIcon.src = isLightTheme ? "./assets/images/icon-moon.svg" : "./assets/images/icon-sun.svg";
  themeIcon.alt = isLightTheme ? "Switch to dark mode" : "Switch to light mode";

  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function getInitialTheme() {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return pageRoot.classList.contains("dark") ? "dark" : "light";
}

function countCharacters(text, excludeSpaces) {
  return excludeSpaces ? text.replace(/\s/g, "").length : text.length;
}

function countWords(text) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return 0;
  }

  return trimmedText.split(/\s+/).length;
}

function countSentences(text) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return 0;
  }

  const matches = trimmedText.match(/[^.!?]+[.!?]+|[^.!?]+$/g);

  return matches ? matches.length : 0;
}

function getReadingTimeText(wordCount) {
  const minutes = wordCount === 0 ? 0 : Math.ceil(wordCount / WORDS_PER_MINUTE);
  const label = minutes === 1 ? "minute" : "minutes";

  return `Approx. reading time: ${minutes} ${label}`;
}

function getCharacterLimit() {
  const parsedLimit = Number.parseInt(characterLimitInput.value, 10);

  if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
    return 1;
  }

  return parsedLimit;
}

function getLetterDensity(text) {

  const letters = text.toUpperCase().match(/[A-Z]/g) || [];
  const totals = {};

  for (const letter of letters) {
    totals[letter] = (totals[letter] || 0) + 1;
  }

  return Object.entries(totals)
    .sort((firstEntry, secondEntry) => {
      const countDifference = secondEntry[1] - firstEntry[1];

      if (countDifference !== 0) {
        return countDifference;
      }

      return firstEntry[0].localeCompare(secondEntry[0]);
    })
    .map(([letter, count]) => ({
      letter,
      count,
      percentage: (count / letters.length) * 100,
    }));
}

function updateFeedback(characterCount) {
  const isLimitEnabled = setCharacterLimitCheckbox.checked;

  feedbackMessageElement.textContent = "";
  feedbackMessageElement.classList.remove("warning");
  textInput.classList.remove("limit-exceeded");

  if (!isLimitEnabled) {
    return;
  }

  const limit = getCharacterLimit();
  const remainingCharacters = limit - characterCount;

  if (remainingCharacters < 0) {
    feedbackMessageElement.textContent =
      `Character limit exceeded by ${Math.abs(remainingCharacters)} characters.`;
    feedbackMessageElement.classList.add("warning");
    textInput.classList.add("limit-exceeded");
    return;
  }

  feedbackMessageElement.textContent = `${remainingCharacters} characters remaining.`;
}

function createDensityItemMarkup(item) {
  const percentage = item.percentage.toFixed(2);

  return `
    <div class="density-item">
      <span class="letter">${item.letter}</span>
      <div class="bar-container">
        <div class="bar" style="width: ${percentage}%;"></div>
      </div>
      <span class="percent">${item.count} (${percentage}%)</span>
    </div>
  `;
}

function updateLetterDensity(text) {
  const densityItems = getLetterDensity(text);

  if (densityItems.length === 0) {
    densityListElement.innerHTML =
      '<p class="density-empty">No characters found. Start typing to see letter density.</p>';
    seeMoreButton.hidden = true;
    seeMoreButton.classList.remove("is-expanded");
    seeMoreButton.innerHTML = `See more
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
    return;
  }

  const visibleItems = showAllDensity
    ? densityItems
    : densityItems.slice(0, DENSITY_PREVIEW_COUNT);

  densityListElement.innerHTML = visibleItems.map(createDensityItemMarkup).join("");
  seeMoreButton.hidden = densityItems.length <= DENSITY_PREVIEW_COUNT;
  seeMoreButton.classList.toggle("is-expanded", showAllDensity);
  seeMoreButton.innerHTML = `${showAllDensity ? "See less" : "See more"}
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function updateCounts() {
  
  const text = textInput.value;
  const characterCount = countCharacters(text, excludeSpacesCheckbox.checked);
  const wordCount = countWords(text);
  const sentenceCount = countSentences(text);

  characterCountElement.textContent = characterCount.toString();
  wordCountElement.textContent = wordCount.toString();
  sentenceCountElement.textContent = sentenceCount.toString();
  readingTimeElement.textContent = getReadingTimeText(wordCount);

  updateFeedback(characterCount);
  updateLetterDensity(text);
}

function toggleCharacterLimitInput() {
  const isVisible = setCharacterLimitCheckbox.checked;

  characterLimitInput.classList.toggle("is-visible", isVisible);
  characterLimitInput.setAttribute("aria-hidden", String(!isVisible));

  updateCounts();
}

textInput.addEventListener("input", updateCounts);
excludeSpacesCheckbox.addEventListener("change", updateCounts);
setCharacterLimitCheckbox.addEventListener("change", toggleCharacterLimitInput);
characterLimitInput.addEventListener("input", updateCounts);
themeToggle.addEventListener("change", () => {
  applyTheme(themeToggle.checked ? "light" : "dark");
});

seeMoreButton.addEventListener("click", () => {
  showAllDensity = !showAllDensity;
  updateLetterDensity(textInput.value);
});

applyTheme(getInitialTheme());
toggleCharacterLimitInput();
updateCounts();
