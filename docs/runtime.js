// Public connection settings; no secrets.
window.LOVE_PETS_PUBLIC_BASE = "/love-pets-lavras/";
window.LOVE_PETS_API_ORIGIN = "https://love-pets-lavras.duduwwl.chatgpt.site";
// Only the explicitly named demo panel uses browser-local examples. Public pages always use the shared API.
window.LOVE_PETS_DEMO_MODE = document.body?.classList.contains('admin-page') && location.pathname.includes('/demo-admin/');
