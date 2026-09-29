const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
menuButton?.addEventListener('click', () => {
  const next = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(next));
  menuButton.setAttribute('aria-label', next ? 'Fechar menu' : 'Abrir menu');
  mobileMenu.hidden = !next;
});
mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mobileMenu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menu');
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobileMenu && !mobileMenu.hidden) {
    mobileMenu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.focus();
  }
});
document.querySelector('#year').textContent = new Date().getFullYear();

const categoryLabels = { mantinhas: 'Mantinhas', roupinhas: 'Roupinhas', caminhas: 'Caminhas', caes: 'Acessórios para cães', gatos: 'Acessórios para gatos' };
const tabs = [...document.querySelectorAll('.shop-tab')];
const grid = document.querySelector('#product-grid');
const dialog = document.querySelector('#product-dialog');
let products = [];
let currentCategory = 'mantinhas';

function setProductImage(element, product) {
  element.style.backgroundImage = `url("${product.image}")`;
  element.style.backgroundSize = `${product.cols * 100}% ${product.rows * 100}%`;
  element.style.backgroundPosition = `${product.col / (product.cols - 1) * 100}% ${product.row / (product.rows - 1) * 100}%`;
  element.setAttribute('aria-label', `Imagem ilustrativa de ${product.name}`);
}

function whatsappFor(product) {
  const message = `Olá! Vi a referência visual de ${product.name} no site da Love Pets. Vocês têm alguma opção parecida? Gostaria de saber preço, tamanhos e disponibilidade.`;
  return `https://wa.me/5535999146809?text=${encodeURIComponent(message)}`;
}

function openProduct(product) {
  dialog.querySelector('.dialog-category').textContent = product.categoryLabel;
  dialog.querySelector('#product-title').textContent = product.name;
  setProductImage(dialog.querySelector('.dialog-visual'), product);
  dialog.querySelector('.dialog-whatsapp').href = whatsappFor(product);
  dialog.showModal();
}

function renderProducts() {
  grid.replaceChildren();
  document.querySelector('#current-category').textContent = categoryLabels[currentCategory];
  for (const product of products.filter(item => item.category === currentCategory)) {
    const card = document.createElement('article');
    card.className = 'product-card';
    const photo = document.createElement('div');
    photo.className = 'product-photo';
    photo.setAttribute('role', 'img');
    setProductImage(photo, product);
    const info = document.createElement('div');
    info.className = 'product-info';
    const label = document.createElement('small');
    label.textContent = product.categoryLabel;
    const title = document.createElement('h3');
    title.textContent = product.name;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Ver opção ↗';
    button.addEventListener('click', () => openProduct(product));
    info.append(label, title, button);
    card.append(photo, info);
    grid.append(card);
  }
}

function selectTab(tab) {
  currentCategory = tab.dataset.category;
  tabs.forEach(item => {
    const selected = item === tab;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  renderProducts();
}
tabs.forEach((tab, index) => {
  tab.tabIndex = index === 0 ? 0 : -1;
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    selectTab(tabs[next]);
    tabs[next].focus();
  });
});
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
fetch('/products.json')
  .then(response => { if (!response.ok) throw new Error('products'); return response.json(); })
  .then(data => { products = Array.isArray(data) ? data : []; renderProducts(); })
  .catch(() => { grid.textContent = 'As opções estão indisponíveis no momento. Fale com a Love Pets pelo WhatsApp.'; });
