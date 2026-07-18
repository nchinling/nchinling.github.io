const username = "nchinling";
const maxRepos = 8;

const repoGrid = document.getElementById("repo-grid");
const repoTemplate = document.getElementById("repo-card-template");
const languageFilter = document.getElementById("language-filter");
const languageTicker = document.getElementById("language-ticker");
const themeToggle = document.getElementById("theme-toggle");

const repoCount = document.getElementById("repo-count");
const followers = document.getElementById("followers");
const totalStars = document.getElementById("total-stars");

let allRepos = [];
const THEME_STORAGE_KEY = "portfolio-theme";

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

function daysAgo(dateInput) {
  const updatedDate = new Date(dateInput);
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.max(1, Math.round((now - updatedDate) / dayMs));

  if (days < 30) {
    return `${days}d ago`;
  }

  const months = Math.round(days / 30);
  if (months < 12) {
    return `${months}mo ago`;
  }

  const years = Math.round(months / 12);
  return `${years}y ago`;
}

function elapsedDays(dateInput) {
  const updatedDate = new Date(dateInput);
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((now - updatedDate) / dayMs));
}

function populateLanguageFilter(repos) {
  const languages = [
    ...new Set(repos.map((repo) => repo.language).filter(Boolean)),
  ].sort();

  for (const language of languages) {
    const option = document.createElement("option");
    option.value = language;
    option.textContent = language;
    languageFilter.append(option);
  }
}

function renderLanguageTicker(repos) {
  if (!languageTicker) {
    return;
  }

  const counts = new Map();
  repos.forEach((repo) => {
    if (!repo.language) {
      return;
    }

    counts.set(repo.language, (counts.get(repo.language) || 0) + 1);
  });

  const topLanguages = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  languageTicker.innerHTML = "";
  if (!topLanguages.length) {
    return;
  }

  topLanguages.forEach(([language, count]) => {
    const pill = document.createElement("span");
    pill.className = "ticker-pill";
    pill.textContent = `${language} x${count}`;
    languageTicker.append(pill);
  });
}

function renderRepos(repos) {
  repoGrid.innerHTML = "";

  if (!repos.length) {
    repoGrid.innerHTML = "<p>No repositories found for this filter.</p>";
    return;
  }

  repos.slice(0, maxRepos).forEach((repo) => {
    const fragment = repoTemplate.content.cloneNode(true);

    const link = fragment.querySelector(".repo-link");
    link.href = repo.html_url;
    link.textContent = repo.name;

    const language = fragment.querySelector(".repo-language");
    language.textContent = repo.language ?? "Mixed";

    const desc = fragment.querySelector(".repo-desc");
    desc.textContent =
      repo.description ||
      "No description yet. Click to explore the project details.";

    const starsEl = fragment.querySelector(".repo-stars");
    starsEl.textContent = `Star ${repo.stargazers_count}`;
    starsEl.classList.add("repo-metric");
    starsEl.classList.add(
      repo.stargazers_count > 0
        ? "repo-metric-positive"
        : "repo-metric-neutral",
    );

    const updatedEl = fragment.querySelector(".repo-updated");
    const days = elapsedDays(repo.pushed_at);
    updatedEl.textContent = `Updated ${daysAgo(repo.pushed_at)}`;
    updatedEl.classList.add("repo-metric");

    if (days <= 45) {
      updatedEl.classList.add("repo-metric-recent");
    } else if (days > 180) {
      updatedEl.classList.add("repo-metric-stale");
    } else {
      updatedEl.classList.add("repo-metric-neutral");
    }

    repoGrid.append(fragment);
  });
}

function updateStats(profile, repos) {
  repoCount.textContent = formatNumber(profile.public_repos);
  followers.textContent = formatNumber(profile.followers);

  const starCount = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  totalStars.textContent = formatNumber(starCount);
}

function bindEvents() {
  languageFilter.addEventListener("change", (event) => {
    const chosen = event.target.value;

    if (chosen === "all") {
      renderRepos(allRepos);
      return;
    }

    renderRepos(allRepos.filter((repo) => repo.language === chosen));
  });

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const root = document.documentElement;
      const current = root.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem(THEME_STORAGE_KEY, next);
      updateThemeToggleLabel(next);
    });
  }
}

function updateThemeToggleLabel(themeName) {
  if (!themeToggle) {
    return;
  }

  themeToggle.textContent = themeName === "dark" ? "Light Mode" : "Dark Mode";
}

function applySavedTheme() {
  const root = document.documentElement;
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  const preferredDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (preferredDark ? "dark" : "light");

  root.setAttribute("data-theme", theme);
  updateThemeToggleLabel(theme);
}

async function loadGitHubData() {
  try {
    const [profileRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`),
      fetch(
        `https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`,
      ),
    ]);

    if (!profileRes.ok || !reposRes.ok) {
      throw new Error("GitHub API request failed");
    }

    const profile = await profileRes.json();
    const repos = await reposRes.json();

    allRepos = repos
      .filter((repo) => !repo.fork)
      .sort((a, b) => {
        const scoreA =
          a.stargazers_count * 3 + new Date(a.pushed_at).getTime() / 1e12;
        const scoreB =
          b.stargazers_count * 3 + new Date(b.pushed_at).getTime() / 1e12;
        return scoreB - scoreA;
      });

    updateStats(profile, allRepos);
    populateLanguageFilter(allRepos);
    renderLanguageTicker(allRepos);
    renderRepos(allRepos);
  } catch (error) {
    repoGrid.innerHTML =
      "<p>Could not load repositories right now. You can still view everything directly on GitHub.</p>";
    console.error(error);
  }
}

applySavedTheme();
bindEvents();
loadGitHubData();
