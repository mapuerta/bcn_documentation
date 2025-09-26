/**
 * Configuración central de la GitHub Page
 * Modifica API_BASE_URL según tu entorno:
 * - Desarrollo: localhost
 * - Producción: tu servidor real
 */

window.CONFIG = {
  // URL base de la API que sirve los repos y readmes
  API_BASE_URL: "https://liquid-geometry-devices-rows.trycloudflare.com",

  // Opcional: secciones amigables para mostrar en la UI
  SECTION_NAMES: {
    GENERAL: "General",
    CL: "Chile",
    PE: "Perú",
    CO: "Colombia",
    MX: "México"
  },

  // Si quieres añadir opciones extra en el futuro
  SETTINGS: {
    // ejemplo: número máximo de branches a mostrar
    MAX_BRANCHES_PER_MODULE: 10
  }
};

