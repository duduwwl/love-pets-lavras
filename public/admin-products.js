const productDemo = !!window.LOVE_PETS_DEMO_API;
const productSection = document.createElement('section');
productSection.className = 'admin-panel';
productSection.id = 'produtos';
productSection.style.marginTop = '20px';
productSection.innerHTML = `<div class="panel-heading"><div><span class="panel-kicker">LOJA</span><h2>Produtos da loja</h2></div></div>
  <p class="panel-help">${productDemo
    ? 'Esta é uma demonstração: os produtos salvos aparecem apenas neste navegador. Para publicar para todos, use o painel protegido da equipe.'
    : 'Cadastre uma foto, detalhes e disponibilidade. Os produtos publicados aparecem na loja.'}</p>
  ${productDemo ? '<a class="return-link" href="https://love-pets-lavras.duduwwl.chatgpt.site/admin#produtos" target="_blank" rel="noopener">Abrir painel protegido para publicar</a>' : ''}
  <form id="product-form" class="product-form">
    <input type="hidden" name="id">
    <label>Nome do produto<input name="name" required maxlength="100"></label>
    <label>Categoria<select name="category"><option value="mantinhas">Mantinhas</option><option value="roupinhas">Roupinhas</option><option value="caminhas">Caminhas</option><option value="caes">Acessórios para cães</option><option value="gatos">Acessórios para gatos</option></select></label>
    <label class="full">Descrição<textarea name="description" required maxlength="450"></textarea></label>
    <label>Para o dia a dia<textarea name="usage" required maxlength="300"></textarea></label>
    <label>Como escolher<textarea name="selection" required maxlength="300"></textarea></label>
    <label class="full">Cuidados<textarea name="care" required maxlength="300"></textarea></label>
    <label>Preço ou faixa <small>(opcional)</small><input name="price" maxlength="40" placeholder="Ex.: Consulte a loja"></label>
    <label>Foto do produto<input name="photo" type="file" accept="image/jpeg,image/png,image/webp"><img id="product-preview" class="product-preview" hidden alt="Prévia da foto"></label>
    <label class="full"><input name="available" type="checkbox" checked style="display:inline;width:auto;min-height:0;margin:0 7px 0 0">Disponível para pedidos</label>
    <div class="full"><button class="admin-save" type="submit">${productDemo ? 'Salvar exemplo' : 'Publicar produto'}</button> <button id="cancel-product-edit" type="button" hidden>Cancelar edição</button></div>
  </form><div id="products-message" class="admin-message" role="status" aria-live="polite"></div><div id="managed-products" class="managed-products"></div>`;
document.querySelector('.admin-shell').append(productSection);

const productForm = productSection.querySelector('#product-form');
const productMessage = productSection.querySelector('#products-message');
const productList = productSection.querySelector('#managed-products');
const productPreview = productSection.querySelector('#product-preview');
const productPhoto = productForm.elements.photo;
let managedProducts = [];
let uploadedImage = '';
const productDemoKey = 'love-pets-demo-products-v1';

function productTell(message, success = false) {
  productMessage.textContent = message;
  productMessage.classList.toggle('success', success);
}

async function productsApi(path, options = {}) {
  if (productDemo) {
    let items;
    try { items = JSON.parse(localStorage.getItem(productDemoKey) || '[]'); } catch { items = []; }
    if (options.method === 'POST') items.unshift({ ...JSON.parse(options.body), id: crypto.randomUUID() });
    if (options.method === 'PUT') items = items.map(item => item.id === path.split('/').pop() ? { ...JSON.parse(options.body), id: item.id } : item);
    if (options.method === 'DELETE') items = items.filter(item => item.id !== path.split('/').pop());
    if (options.method) localStorage.setItem(productDemoKey, JSON.stringify(items));
    return { products: items };
  }
  const response = await fetch(path, { credentials: 'same-origin', ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Não foi possível salvar o produto.');
  return data;
}

function resetProductForm() {
  productForm.reset(); productForm.elements.id.value = ''; uploadedImage = '';
  productPreview.hidden = true; productPreview.removeAttribute('src');
  productSection.querySelector('#cancel-product-edit').hidden = true;
  productForm.querySelector('[type=submit]').textContent = productDemo ? 'Salvar exemplo' : 'Publicar produto';
}

function renderManagedProducts() {
  productList.replaceChildren();
  if (!managedProducts.length) { productList.textContent = 'Nenhum produto cadastrado ainda.'; return; }
  for (const product of managedProducts) {
    const row = document.createElement('article'); row.className = 'managed-product';
    const photo = document.createElement('img'); photo.src = product.image; photo.alt = '';
    const info = document.createElement('div');
    const name = document.createElement('strong'); name.textContent = product.name;
    const detail = document.createElement('span'); detail.textContent = `${product.category} · ${product.available ? 'Disponível' : 'Oculto'}${product.price ? ' · ' + product.price : ''}`;
    info.append(name, detail);
    const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Editar';
    edit.addEventListener('click', () => {
      for (const key of ['id','name','category','description','usage','selection','care','price']) productForm.elements[key].value = product[key] || '';
      productForm.elements.available.checked = product.available;
      uploadedImage = product.image; productPreview.src = product.image; productPreview.hidden = false;
      productSection.querySelector('#cancel-product-edit').hidden = false;
      productForm.querySelector('[type=submit]').textContent = 'Salvar alterações';
      productForm.scrollIntoView({ block: 'start' });
    });
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Excluir';
    remove.addEventListener('click', async () => {
      if (!confirm(`Excluir ${product.name} da loja?`)) return;
      remove.disabled = true;
      try { await productsApi(`/api/admin/products/${product.id}`, { method: 'DELETE' }); await loadManagedProducts(); productTell('Produto excluído.', true); }
      catch (error) { productTell(error.message); remove.disabled = false; }
    });
    row.append(photo, info, edit, remove); productList.append(row);
  }
}

async function loadManagedProducts() {
  const data = await productsApi('/api/admin/products');
  managedProducts = data.products || [];
  renderManagedProducts();
}

async function compressPhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8_000_000) throw new Error('Escolha uma foto JPG, PNG ou WebP de até 8 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    for (const [size, quality] of [[800,.78],[640,.65],[480,.55]]) {
      const scale = Math.min(1, size / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const image = canvas.toDataURL('image/webp', quality);
      if (image.length <= 350000) return image;
    }
  } finally { bitmap.close(); }
  throw new Error('A foto ficou grande demais. Escolha outra imagem.');
}

productPhoto.addEventListener('change', async () => {
  const file = productPhoto.files[0]; if (!file) return;
  try { uploadedImage = await compressPhoto(file); productPreview.src = uploadedImage; productPreview.hidden = false; productTell('Foto pronta para salvar.', true); }
  catch (error) { productPhoto.value = ''; productTell(error.message); }
});
productSection.querySelector('#cancel-product-edit').addEventListener('click', resetProductForm);
productForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!productForm.reportValidity()) return;
  if (!uploadedImage) { productTell('Escolha uma foto do produto.'); return; }
  const id = productForm.elements.id.value;
  const body = Object.fromEntries(['name','category','description','usage','selection','care','price'].map(key => [key, productForm.elements[key].value.trim()]));
  body.image = uploadedImage; body.available = productForm.elements.available.checked;
  const button = productForm.querySelector('[type=submit]'); button.disabled = true;
  try {
    await productsApi(id ? `/api/admin/products/${id}` : '/api/admin/products', { method: id ? 'PUT' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    resetProductForm(); await loadManagedProducts(); productTell(productDemo ? 'Exemplo salvo neste navegador.' : 'Produto publicado na loja.', true);
  } catch (error) { productTell(error.message); }
  finally { button.disabled = false; }
});
loadManagedProducts().catch(error => productTell(error.message));
