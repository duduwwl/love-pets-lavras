const categoryLabels = { mantinhas: 'Mantinhas', roupinhas: 'Roupinhas', caminhas: 'Caminhas', caes: 'Acessórios para cães', gatos: 'Acessórios para gatos' };
const tabs = [...document.querySelectorAll('.shop-tab')];
const grid = document.querySelector('#product-grid');
const dialog = document.querySelector('#product-dialog');
let products = [];
let currentCategory = 'mantinhas';

function setProductImage(element, product) {
  element.style.backgroundImage = `url("${product.image}")`;
  element.style.backgroundSize = product.cols ? `${product.cols * 100}% ${product.rows * 100}%` : 'cover';
  element.style.backgroundPosition = product.cols ? `${product.col / (product.cols - 1) * 100}% ${product.row / (product.rows - 1) * 100}%` : 'center';
  element.setAttribute('aria-label', `${product.illustrative !== false ? 'Imagem ilustrativa' : 'Foto'} de ${product.name}`);
}

function openProduct(product) {
  dialog.querySelector('.dialog-category').textContent = product.categoryLabel;
  dialog.querySelector('#product-title').textContent = product.name;
  dialog.querySelector('.dialog-description').textContent = product.description;
  const details = dialog.querySelector('.dialog-details');
  details.replaceChildren();
  for(const [label, text] of [['Para o dia a dia',product.usage],['Como escolher',product.selection],['Cuidados',product.care]]) {
    if (!text) continue;
    const row = document.createElement('div');
    const term = document.createElement('dt'); term.textContent = label;
    const value = document.createElement('dd'); value.textContent = text;
    row.append(term,value); details.append(row);
  }
  if (product.price) { const row = document.createElement('div'); const term = document.createElement('dt'); term.textContent = 'Preço'; const value = document.createElement('dd'); value.textContent = product.price; row.append(term, value); details.append(row); }
  if (product.stockQuantity != null) { const row = document.createElement('div'); const term = document.createElement('dt'); term.textContent = 'Estoque'; const value = document.createElement('dd'); value.textContent = product.stockQuantity ? `${product.stockQuantity} unidade${product.stockQuantity === 1 ? '' : 's'}` : 'Esgotado'; row.append(term, value); details.append(row); }
  dialog.querySelector('.dialog-note').textContent = product.illustrative !== false ? 'Imagem ilustrativa de referência. Confirme modelo, medidas e cores com a equipe.' : 'Foto enviada pela loja. Confirme tamanhos e cores antes de concluir o pedido.';
  setProductImage(dialog.querySelector('.dialog-visual'), product);
  const message = product.stockQuantity === 0 ? `Olá! Gostaria de saber quando ${product.name} estará disponível novamente na Love Pets.` : `Olá! Quero pedir ${product.name} na Love Pets. Podem confirmar os modelos disponíveis, as medidas ou tamanhos, as cores, o preço e como retirar?`;
  dialog.querySelector('.dialog-whatsapp').href = `https://wa.me/5535999146809?text=${encodeURIComponent(message)}`;
  dialog.showModal();
}

function renderProducts() {
  grid.replaceChildren();
  document.querySelector('#current-category').textContent = categoryLabels[currentCategory];
  for(const product of products.filter(item=>item.category===currentCategory)) {
    const card=document.createElement('article'); card.className='product-card';
    const photo=document.createElement('div'); photo.className='product-photo'; photo.setAttribute('role','img'); setProductImage(photo,product);
    const info=document.createElement('div'); info.className='product-info';
    const label=document.createElement('small'); label.textContent=product.categoryLabel;
    const title=document.createElement('h3'); title.textContent=product.name;
    const summary=document.createElement('p'); summary.className='product-summary'; summary.textContent=product.description;
    const stock=document.createElement('small'); stock.className='product-stock'; stock.textContent=product.stockQuantity == null ? 'Disponibilidade a confirmar' : product.stockQuantity === 0 ? 'Esgotado' : `${product.stockQuantity} em estoque`;
    const button=document.createElement('button'); button.type='button'; button.textContent='Ver opção';
    button.setAttribute('aria-label',`Ver opção: ${product.name}`); button.addEventListener('click',()=>openProduct(product));
    info.append(label,title,summary,stock,button); card.append(photo,info); grid.append(card);
  }
}

function selectTab(tab) {
 currentCategory=tab.dataset.category;
 tabs.forEach(item=>{const selected=item===tab;item.classList.toggle('active',selected);item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;});
 renderProducts();
 tab.scrollIntoView({block:'nearest',inline:'nearest'});
}
tabs.forEach((tab,index)=>{
 tab.tabIndex=index===0?0:-1;
 tab.addEventListener('click',()=>selectTab(tab));
 tab.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();
  const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
  selectTab(tabs[next]);tabs[next].focus();
 });
});
dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
fetch(`${window.LOVE_PETS_API_ORIGIN || ''}/api/products`, { signal: AbortSignal.timeout(10000) })
  .then(response => { if (!response.ok) throw new Error('live products'); return response.json(); })
  .then(data => { if (!Array.isArray(data.products)) throw new Error('live products'); return data.products; })
  .catch(() => fetch(`${window.LOVE_PETS_PUBLIC_BASE || '/'}products.json`).then(response => { if (!response.ok) throw new Error('products'); return response.json(); }))
  .then(items => {
  products = items.map(item => ({ ...item, categoryLabel: categoryLabels[item.category] }));
  if (!products.length) { grid.textContent = 'Não foi possível carregar os produtos. Recarregue a página ou fale com a Love Pets pelo WhatsApp.'; return; }
  tabs.forEach(tab => { const count = products.filter(item => item.category === tab.dataset.category).length; tab.querySelector('small').textContent = String(count).padStart(2, '0'); });
  renderProducts();
}).catch(() => { grid.textContent = 'Não foi possível carregar os produtos. Recarregue a página ou fale com a Love Pets pelo WhatsApp.'; });
