const TOKEN_KEY = "auth_token";

// --- Mostrar modal de login ---
function showLoginModal() {
  return new Promise(resolve => {
    const modalEl = document.getElementById("loginModal");
    const usernameInput = document.getElementById("usernameInput");
    const loginBtn = document.getElementById("loginBtn");
    const loginError = document.getElementById("loginError");

    // Reset
    usernameInput.value = "";
    loginError.style.display = "none";

    const bsModal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
    bsModal.show();

    loginBtn.onclick = async () => {
      const username = usernameInput.value.trim();
      if (!username) return;

      try {
        const res = await fetch(CONFIG.API_BASE_URL + "/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username })
        });

        if (!res.ok) {
          loginError.style.display = "block";
          return;
        }

        const { token } = await res.json();
        localStorage.setItem(TOKEN_KEY, token);
        bsModal.hide();
        resolve(token);

      } catch (err) {
        console.error("Error login:", err);
        loginError.style.display = "block";
      }
    };
  });
}

// --- Obtener token válido ---
async function getToken() {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = await showLoginModal();
  }
  return token;
}

// --- Fetch con autenticación automática ---
async function fetchWithAuth(url, options = {}) {
  let token = await getToken();
  if (!token) throw new Error("No autenticado");

  options.headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`
  };

  let res = await fetch(url, options);

  // Si el token expiró → pedir login otra vez
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem(TOKEN_KEY);
    token = await showLoginModal();
    if (!token) throw new Error("No autenticado");

    options.headers.Authorization = `Bearer ${token}`;
    res = await fetch(url, options);
  }

  return res;
}
