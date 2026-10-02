const categoryLabels = {
  higiene: 'Higiene e cuidados',
  petiscos: 'Petiscos',
  alimentacao: 'Alimentação',
  passeio: 'Passeio e transporte',
  descanso: 'Descanso',
  brinquedos: 'Brinquedos',
  gatos: 'Para gatos',
};
const controls = document.querySelector('#shop-controls');
const search = document.querySelector('#product-search');
const grid = document.querySelector('#product-grid');
const dialog = document.querySelector('#product-dialog');
let products = [];
let currentCategory = 'all';

function setProductImage(element, product) {
  element.style.backgroundImage = `url("${product.image}")`;
  element.style.backgroundSize = 'cover';
  element.style.backgroundPosition = 'center';
  element.style.backgroundRepeat = 'no-repeat';
  element.setAttribute('aria-label', `Foto de ${product.name} com fundo branco`);
}

function setFlavorImage(element, product, flavor) {
  setProductImage(element, product);
  if (!product.flavors?.length || !product.name.startsWith('OneByOne Fit')) return;
  const positions = { Maçã: 'left center', Manga: 'center center', Morango: 'right center' };
  element.style.backgroundSize = '300% auto';
  element.style.backgroundPosition = positions[flavor] || positions.Maçã;
  element.setAttribute('aria-label', `Foto de ${product.name}, sabor ${flavor}`);
}

function openProduct(product) {
  dialog.querySelector('.dialog-category').textContent = categoryLabels[product.category] || product.categoryLabel || product.category;
  dialog.querySelector('#product-title').textContent = product.name;
  dialog.querySelector('.dialog-description').textContent = product.description;
  const flavorField = dialog.querySelector('.dialog-flavor-field');
  const flavorSelect = dialog.querySelector('#dialog-flavor');
  const flavors = Array.isArray(product.flavors) ? product.flavors : [];
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const choices = flavors.length ? flavors : sizes;
  flavorField.hidden = choices.length === 0;
  flavorField.querySelector('label').textContent = flavors.length ? 'Escolha o sabor' : 'Escolha o tamanho';
  flavorSelect.replaceChildren();
  for (const choice of choices) {
    const option = document.createElement('option');
    option.value = choice;
    option.textContent = choice;
    flavorSelect.append(option);
  }
  const details = dialog.querySelector('.dialog-details');
  details.replaceChildren();
  for (const [label, value] of [
    ['Para o dia a dia', product.usage],
    ['Como escolher', product.selection],
    ['Cuidados', product.care],
    ['Preço', product.price],
    ['Estoque', product.stockQuantity == null ? 'Confirme com a loja' : product.stockQuantity ? `${product.stockQuantity} unidade${product.stockQuantity === 1 ? '' : 's'}` : 'Esgotado'],
  ]) {
    if (!value) continue;
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    row.append(term, description);
    details.append(row);
  }
  dialog.querySelector('.dialog-note').textContent = 'Foto do produto enviada pela loja, com fundo padronizado. Confirme variações e disponibilidade.';
  const dialogVisual = dialog.querySelector('.dialog-visual');
  function updateWhatsApp() {
    setFlavorImage(dialogVisual, product, flavorSelect.value);
    const choiceLabel = flavors.length ? 'sabor' : 'tamanho';
    const requestedProduct = `${product.name}${choices.length ? `, ${choiceLabel} ${flavorSelect.value}` : ''}`;
    const message = product.stockQuantity === 0
      ? `Olá! Gostaria de saber quando ${requestedProduct} estará disponível novamente na Love Pets.`
      : `Olá, Love Pets! Tenho interesse em ${requestedProduct}. Podem confirmar o preço atual, a disponibilidade e como retirar?`;
    dialog.querySelector('.dialog-whatsapp').href = `https://wa.me/5535999146809?text=${encodeURIComponent(message)}`;
  }
  flavorSelect.onchange = updateWhatsApp;
  updateWhatsApp();
  dialog.showModal();
}

function matchingProducts() {
  const query = search.value.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return products.filter(product => {
    if (currentCategory !== 'all' && product.category !== currentCategory) return false;
    if (!query) return true;
    const text = [product.name, product.description, ...(product.flavors || []), ...(product.sizes || []), categoryLabels[product.category] || product.category]
      .join(' ').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return text.includes(query);
  });
}

function renderProducts() {
  const visible = matchingProducts();
  document.querySelector('#current-category').textContent = currentCategory === 'all' ? 'Todos os produtos' : categoryLabels[currentCategory] || currentCategory;
  document.querySelector('#product-count').textContent = `${visible.length} produto${visible.length === 1 ? '' : 's'}`;
  for (const button of controls.querySelectorAll('.shop-tab')) {
    const active = button.dataset.category === currentCategory;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  grid.replaceChildren();
  if (!visible.length) {
    const empty = document.createElement('p');
    empty.className = 'shop-empty';
    empty.textContent = 'Nenhum produto encontrado. Tente outro termo ou categoria.';
    grid.append(empty);
    return;
  }
  for (const product of visible) {
    const card = document.createElement('article');
    card.className = 'product-card';
    const photo = document.createElement('div');
    photo.className = 'product-photo';
    photo.setAttribute('role', 'img');
    setProductImage(photo, product);
    const info = document.createElement('div');
    info.className = 'product-info';
    const label = document.createElement('small');
    label.textContent = categoryLabels[product.category] || product.categoryLabel || product.category;
    const title = document.createElement('h3');
    title.textContent = product.name;
    const summary = document.createElement('p');
    summary.className = 'product-summary';
    summary.textContent = product.description;
    if (product.flavors?.length) {
      const flavors = document.createElement('p');
      flavors.className = 'product-flavor-count';
      flavors.textContent = `${product.flavors.length} sabores · escolha nos detalhes`;
      info.append(label, title, summary, flavors);
    } else if (product.sizes?.length) {
      const sizes = document.createElement('p');
      sizes.className = 'product-flavor-count';
      sizes.textContent = `${product.sizes.length} tamanhos · escolha nos detalhes`;
      info.append(label, title, summary, sizes);
    }
    const price = document.createElement('strong');
    price.className = 'product-price';
    price.textContent = product.price || 'Preço sob consulta';
    const stock = document.createElement('small');
    stock.className = 'product-stock';
    stock.textContent = product.stockQuantity == null ? 'Disponibilidade a confirmar' : product.stockQuantity === 0 ? 'Esgotado' : `${product.stockQuantity} em estoque`;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Ver detalhes';
    button.setAttribute('aria-label', `Ver detalhes: ${product.name}`);
    button.addEventListener('click', () => openProduct(product));
    if (!product.flavors?.length && !product.sizes?.length) info.append(label, title, summary);
    info.append(price, stock, button);
    card.append(photo, info);
    grid.append(card);
  }
}

function renderCategories() {
  controls.replaceChildren();
  const activeCategories = Object.keys(categoryLabels).filter(category => products.some(product => product.category === category));
  for (const category of [...new Set(['all', ...activeCategories, ...products.map(product => product.category)])]) {
    const button = document.createElement('button');
    button.className = 'shop-tab';
    button.type = 'button';
    button.dataset.category = category;
    const label = category === 'all' ? 'Todos' : categoryLabels[category] || category;
    const count = category === 'all' ? products.length : products.filter(product => product.category === category).length;
    button.append(document.createTextNode(label + ' '));
    const small = document.createElement('small');
    small.textContent = String(count).padStart(2, '0');
    button.append(small);
    button.addEventListener('click', () => { currentCategory = category; renderProducts(); });
    controls.append(button);
  }
}

search.addEventListener('input', renderProducts);
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

const loadStaticCatalog = () => fetch(`${window.LOVE_PETS_PUBLIC_BASE || '/' }products.json`, { cache: 'no-store' })
  .then(response => response.ok ? response.json() : [])
  .catch(() => []);

function mergeCatalog(items, localItems = items) {
  const localById = new Map(localItems.map(item => [item.id, item]));
  return items.map(item => {
    const local = localById.get(item.id) || {};
    const merged = { ...item, ...local, categoryLabel: categoryLabels[item.category] || local.categoryLabel || item.categoryLabel };
    if (item.stockQuantity != null) merged.stockQuantity = item.stockQuantity;
    else if (local.stockQuantity != null) merged.stockQuantity = local.stockQuantity;
    if (!merged.sizes?.length && merged.name.startsWith('Fraldas')) merged.sizes = ['P', 'M', 'G'];
    return merged;
  });
}

function showCatalog(items, localItems = items) {
  products = mergeCatalog(items, localItems);
  if (!products.length) { grid.textContent = 'Nenhum produto disponível no momento. Fale com a Love Pets pelo WhatsApp.'; return; }
  renderCategories();
  renderProducts();
}

async function loadCatalog() {
  const localItems = await loadStaticCatalog();
  if (localItems.length) showCatalog(localItems, localItems);
  try {
    const response = await fetch(`${window.LOVE_PETS_API_ORIGIN || ''}/api/products`, { signal: AbortSignal.timeout(4000), cache: 'no-store' });
    if (!response.ok) throw new Error('live products');
    const data = await response.json();
    if (Array.isArray(data.products) && data.products.length) showCatalog(data.products, localItems);
  } catch {
    if (!localItems.length) throw new Error('products unavailable');
  }
}

loadCatalog().catch(() => { grid.textContent = 'Não foi possível carregar os produtos. Recarregue a página ou fale com a Love Pets pelo WhatsApp.'; });
