const sectionsContainer = document.getElementById("sections");
const searchInput = document.getElementById("searchInput");

// Caché de README
const readmeCache = {};

// Guardar los datos originales para filtrar
let allData = {};

// Inicializar la carga de secciones
async function loadSections() {
  try {
    const res = await fetch(CONFIG.API_BASE_URL + "/repos");
    if (!res.ok) throw new Error("Error al obtener repositorios");
    allData = await res.json();

    renderSections(allData);
  } catch (err) {
    console.error("Error cargando secciones:", err);
  }
}

// Función para renderizar secciones según un dataset
function renderSections(data) {
  sectionsContainer.innerHTML = "";

  for (const [sectionCode, repos] of Object.entries(data)) {
    const sectionEl = document.createElement("div");
    sectionEl.classList.add("section");

    const sectionTitle = document.createElement("h2");
    sectionTitle.textContent = CONFIG.SECTION_NAMES[sectionCode] || sectionCode;
    sectionTitle.classList.add("section-title");
    sectionTitle.onclick = () => sectionEl.classList.toggle("open");
    sectionEl.appendChild(sectionTitle);

    const reposContainer = document.createElement("div");
    reposContainer.classList.add("repos-container");

    repos.forEach(repo => {
      const repoEl = document.createElement("div");
      repoEl.classList.add("repo");

      const repoTitle = document.createElement("h3");
      repoTitle.textContent = repo.name;
      repoTitle.classList.add("repo-title");
      repoEl.appendChild(repoTitle);

      const branchesList = document.createElement("ul");
      branchesList.classList.add("branches-list");

      const branchItem = document.createElement("li");
      const branchBtn = document.createElement("button");
      branchBtn.textContent = repo.branch;
      branchBtn.classList.add("branch-btn");

      const readmeEl = document.createElement("div");
      readmeEl.classList.add("readme");

      branchBtn.onclick = () => toggleReadme(repo.name, repo.branch, readmeEl);

      branchItem.appendChild(branchBtn);
      branchItem.appendChild(readmeEl);
      branchesList.appendChild(branchItem);

      repoEl.appendChild(branchesList);
      reposContainer.appendChild(repoEl);
    });

    sectionEl.appendChild(reposContainer);
    sectionsContainer.appendChild(sectionEl);
  }
}

// Función para mostrar/ocultar README
async function toggleReadme(repoName, branch, container) {
  if (container.style.display === "block") {
    container.style.display = "none";
    return;
  }

  const cacheKey = `${repoName}:${branch}`;
  if (readmeCache[cacheKey]) {
    container.innerHTML = readmeCache[cacheKey];
    container.style.display = "block";
    return;
  }

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/repos/${repoName}/readme?branch=${branch}`);
    if (!res.ok) throw new Error("Error al cargar README");

    const html = await res.text();
    readmeCache[cacheKey] = html;
    container.innerHTML = html;
    container.style.display = "block";
  } catch (err) {
    container.innerHTML = "<p>Error al cargar README</p>";
    container.style.display = "block";
  }
}

// Filtrar por búsqueda
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filteredData = {};

  for (const [section, repos] of Object.entries(allData)) {
    const filteredRepos = repos.filter(repo => repo.name.toLowerCase().includes(query));
    if (filteredRepos.length > 0) filteredData[section] = filteredRepos;
  }

  renderSections(filteredData);
});

// Inicializar
loadSections();
