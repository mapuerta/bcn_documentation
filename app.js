const sectionsContainer = document.getElementById("sections");
const inputRepoSearch = document.getElementById("repoSearch");
const BtnClear = document.getElementById("btnClear");

// Caché de README
const readmeCache = {};

// Guardar los datos originales para filtrar
let allRepos = {};

// Inicializar la carga de secciones
async function loadSections() {
  try {
    //~ const res = await fetch(CONFIG.API_BASE_URL + "/repos");
    const res = await fetchWithAuth(CONFIG.API_BASE_URL + "/api/repos");
    if (!res.ok) throw new Error("Error al obtener repositorios");
    allRepos = await res.json();

    renderSections(allRepos);
    initSelect2(allRepos);
  } catch (err) {
    console.error("Error cargando secciones:", err);
  }
}

function customMatcher(params, data) {
  if ($.trim(params.term) === "") {
    return data;
  }

  if (typeof data.text === "undefined") {
    return null;
  }

  // Normalizar input y separarlo en tokens (palabras)
  const terms = params.term.toLowerCase().split(/\s+/).filter(Boolean);

  // Extraer el texto del option y los atributos extra
  const haystack = (data.element.dataset.search || data.text).toLowerCase();

  // Verificar que TODAS las palabras estén presentes en el texto
  const matches = terms.every(term => haystack.includes(term));

  return matches ? data : null;
}

function initSelect2(data) {
  //~ select = $("#repoSearch");
  select = $(inputRepoSearch);
  select.empty();

  for (const [section, repos] of Object.entries(data)) {
    const group = document.createElement("optgroup");
    group.label = CONFIG.SECTION_NAMES[section] || section;

    repos.forEach(repo => {
      const searchText = [
        repo.name,
        repo.branch,
        repo.description || "",
        ...(repo.tags || [])
      ].join(" ").toLowerCase();

      const option = new Option(
        `${repo.name} (${repo.branch}) - ${repo.description || ""}`,
        `${repo.name}::${repo.branch}`
      );
      option.dataset.search = searchText;
      group.appendChild(option);
    });

    select.append(group);
  }

  select.select2({
    placeholder: "Busca módulos por nombre, descripción o tags...",
    //~ allowClear: true,
    //~ matcher: customMatcher,
    multiple: true, // Selección múltiple
    tags: true,
    width: "100%",
    tokenSeparators: [" ", ","],
  });

  select.on("change", () => {
    const selected = select.val();
    if (!selected || selected.length === 0) {
      loadSections();
      return;
    }
    let result = filterMultipleRepos(allRepos, selected);
    renderSections(result);
  });
}

function filterMultipleRepos(allRepos, filters) {
  // Normalizar filtros a minúsculas y quitar vacíos
  //~ debugger
  //~ const terms = filters.map(f => f.toLowerCase()).filter(Boolean);
  const terms = filters.map((el)=>el.toLowerCase().split("::")).flat().filter(Boolean)

  // Crear nuevo objeto con misma estructura de secciones
  const filteredRepos = {};

  for (const section in allRepos) {
    filteredRepos[section] = allRepos[section].filter(repo => {
      // Concatenar todos los campos relevantes
      const repoFields = [
        repo.name || "",
        repo.branch || "",
        repo.description || "",
        ...(repo.tags || [])
      ].map(f => f.toLowerCase());

      const haystack = repoFields.join(" ");

      // AND → todos los términos deben aparecer
      return terms.every(term => haystack.includes(term));
    });
  }

  return filteredRepos;
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
      
       // Descripción (muted)
      if (repo.description) {
        const repoDesc = document.createElement("p");
        repoDesc.textContent = repo.description;
        repoDesc.classList.add("repo-desc", "muted"); // estilo en CSS
        repoEl.appendChild(repoDesc);
      }

      // Tags (como #tag1 #tag2 ...)
      if (repo.tags && Array.isArray(repo.tags) && repo.tags.length > 0) {
        const tagsContainer = document.createElement("div");
        tagsContainer.classList.add("tags-container");

        repo.tags.forEach(tag => {
          const tagEl = document.createElement("span");
          tagEl.textContent = `#${tag}`;
          tagEl.classList.add("tag");
          tagsContainer.appendChild(tagEl);
        });

        repoEl.appendChild(tagsContainer);
      }


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
    //~ const res = await fetch(`${CONFIG.API_BASE_URL}/repos/${repoName}/readme?branch=${branch}`);
    let url = `${CONFIG.API_BASE_URL}/api/repos/${repoName}/readme?branch=${branch}`
    console.log(url);
    
    const res = await fetchWithAuth(url);
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

BtnClear.addEventListener('click', function (ev) {
    $(inputRepoSearch).val(null).trigger('change');
    renderSections(allRepos);
})

// Inicializar
loadSections();
