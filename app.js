const sectionsContainer = document.getElementById("sections");
const config = window.CONFIG;
// Caché de README
const readmeCache = new Map();

// Función para renderizar las secciones
function renderSections(data) {
  sectionsContainer.innerHTML = ""; // limpiar

  for (const [sectionKey, repos] of Object.entries(data)) {
    const sectionName = config.SECTION_NAMES[sectionKey] || sectionKey;

    const sectionEl = document.createElement("div");
    sectionEl.classList.add("section");

    // Título de la sección plegable
    const title = document.createElement("h2");
    title.textContent = sectionName;
    title.classList.add("section-title");
    sectionEl.appendChild(title);

    // Contenedor de repositorios, oculto por defecto
    const reposContainer = document.createElement("div");
    reposContainer.classList.add("repos-container");
    reposContainer.style.display = "none";
    sectionEl.appendChild(reposContainer);

    // Toggle al hacer click en el título
    title.addEventListener("click", () => {
      reposContainer.style.display =
        reposContainer.style.display === "none" ? "block" : "none";
    });

    // Renderizar repositorios por sección
    repos.forEach(repo => {
      const repoEl = document.createElement("div");
      repoEl.classList.add("repo");

      const repoTitle = document.createElement("h3");
      repoTitle.textContent = `${repo.name} [${repo.branch}]`;
      repoTitle.classList.add("repo-title");

      // Contenedor del README, oculto por defecto
      const readmeEl = document.createElement("div");
      readmeEl.classList.add("readme");
      readmeEl.style.display = "none";

      repoTitle.addEventListener("click", () => toggleReadme(repo.name, repo.branch, readmeEl));

      repoEl.appendChild(repoTitle);
      repoEl.appendChild(readmeEl);
      reposContainer.appendChild(repoEl);
    });

    sectionsContainer.appendChild(sectionEl);
  }
}

// Función para cargar README
async function toggleReadme(repoName, branch, container) {
  if (container.style.display === "block") {
    container.style.display = "none";
    return;
  }

  const cacheKey = `${repoName}@${branch}`;
  if (readmeCache.has(cacheKey)) {
    container.innerHTML = readmeCache.get(cacheKey);
    container.style.display = "block";
    return;
  }

  try {
    const res = await fetch(`${config.API_BASE_URL}/repos/${repoName}/readme?branch=${branch}`);
    if (!res.ok) {
      container.innerHTML = "<p>Error al cargar README</p>";
      container.style.display = "block";
      return;
    }

    const html = await res.text();
    readmeCache.set(cacheKey, html);
    container.innerHTML = html;
    container.style.display = "block";
  } catch (err) {
    container.innerHTML = `<p>Error al cargar README: ${err.message}</p>`;
    container.style.display = "block";
  }
}

// Inicializar
async function loadSections() {
  try {
      debugger
    const res = await fetch(`${config.API_BASE_URL}/repos`);
    if (!res.ok) {
      sectionsContainer.innerHTML = "<p>Error cargando secciones</p>";
      return;
    }
    const data = await res.json();
    renderSections(data);
  } catch (err) {
    sectionsContainer.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

// Ejecutar
loadSections();
