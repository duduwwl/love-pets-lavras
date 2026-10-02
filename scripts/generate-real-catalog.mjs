// Snapshot of the 23 photographs supplied by the Love Pets team on 2026-10-01.
// Prices are maintained in the catalog and should be confirmed with the team before purchase.
import { writeFileSync } from 'node:fs';

const labels = {
  higiene: 'Higiene e cuidados',
  petiscos: 'Petiscos',
  alimentacao: 'Alimentação',
  passeio: 'Passeio e transporte',
  descanso: 'Descanso',
  brinquedos: 'Brinquedos',
  gatos: 'Para gatos',
};

const items = [
  ['Escovas dentais para pets', 'higiene', 'escovas-dentais', 12.90, 'Escovas coloridas para a rotina de higiene bucal de cães e gatos.', 'Use com creme dental próprio para pets e introduza a escovação aos poucos.', 'Escolha o tamanho da escova conforme a boca do animal; cores sujeitas à disponibilidade.', 'Lave a escova após o uso e substitua quando as cerdas estiverem gastas.'],
  ['Pet Clean Creme Dental Tutti 90 g', 'higiene', 'creme-dental-tutti', 29.90, 'Creme dental Pet Clean sabor Tutti, embalagem de 90 g, indicado no rótulo para cães.', 'Para a escovação dos dentes com uma escova própria para pets.', 'Confira no rótulo a indicação de uso e peça orientação à equipe para introduzir a escovação.', 'Feche a embalagem após o uso e siga as instruções do fabricante.'],
  ['Pet Clean Hidrata Focinhos 60 g', 'higiene', 'hidratante-focinhos', 24.90, 'Hidratante de focinhos Pet Clean com D-pantenol e extrato de aveia, embalagem de 60 g.', 'Produto para o cuidado externo do focinho, conforme as instruções do fabricante.', 'Confira os ingredientes e a indicação no rótulo antes de usar.', 'Guarde bem fechado e suspenda o uso se houver irritação.'],
  ['Comedouro plástico com base', 'alimentacao', 'comedouros', 24.90, 'Comedouros plásticos em cores azul e laranja, com base larga.', 'Para servir água ou alimento no dia a dia do pet.', 'Confirme tamanho e cor disponíveis; escolha uma peça compatível com o porte do animal.', 'Lave com frequência e substitua se houver rachaduras ou desgaste.'],
  ['Pet Clean Creme Dental Carne 60 g', 'higiene', 'creme-dental-carne', 19.90, 'Creme dental Pet Clean sabor carne, embalagem de 60 g para cães e gatos.', 'Para compor a rotina de escovação com escova apropriada.', 'Veja a indicação de uso e a adaptação do seu pet antes de escolher.', 'Mantenha a bisnaga fechada e siga as orientações do fabricante.'],
  ['Pet Kiss Educador Pipi Não Pode 150 ml', 'higiene', 'educador', 29.90, 'Spray educador Pet Kiss Pipi Não Pode, frasco de 150 ml.', 'Produto de apoio à orientação do local onde o pet não deve urinar.', 'Leia as instruções do rótulo e teste o uso no ambiente indicado.', 'Mantenha fora do alcance dos animais quando não estiver em uso.'],
  ['Pet Clean Banho a Seco Maciez 240 ml', 'higiene', 'banho-seco', 34.90, 'Banho a seco Pet Clean Maciez com queratina e D-pantenol, frasco de 240 ml.', 'Para higienização a seco conforme o modo de uso da embalagem.', 'Confira a indicação do rótulo para o tipo de pelagem e idade do pet.', 'Evite olhos e mucosas; siga as instruções do fabricante.'],
  ['OneByOne Fit Maçã 50 g', 'petiscos', 'petiscos-fit', 9.90, 'Snack mastigável OneByOne Fit para cães, versão maçã com cenoura e quinoa, 50 g.', 'Ofereça como petisco, respeitando a porção indicada na embalagem.', 'Confira ingredientes, idade e porte recomendados no rótulo.', 'Conserve fechado em local seco e ofereça água fresca ao pet.'],
  ['OneByOne Fit Manga 50 g', 'petiscos', 'petiscos-fit', 9.90, 'Snack mastigável OneByOne Fit para cães, versão manga com beterraba e linhaça, 50 g.', 'Ofereça como petisco, respeitando a porção indicada na embalagem.', 'Confira ingredientes, idade e porte recomendados no rótulo.', 'Conserve fechado em local seco e ofereça água fresca ao pet.'],
  ['OneByOne Fit Morango 50 g', 'petiscos', 'petiscos-fit', 9.90, 'Snack mastigável OneByOne Fit para cães, versão morango com batata-doce e chia, 50 g.', 'Ofereça como petisco, respeitando a porção indicada na embalagem.', 'Confira ingredientes, idade e porte recomendados no rótulo.', 'Conserve fechado em local seco e ofereça água fresca ao pet.'],
  ['Pet Clean Hidratante de Patinhas 150 g', 'higiene', 'hidratante-patinhas', 39.90, 'Hidratante de patinhas Pet Clean Coxins, embalagem de 150 g.', 'Para o cuidado externo dos coxins conforme o modo de uso do rótulo.', 'Confira os ingredientes e a indicação antes da primeira aplicação.', 'Mantenha fechado e interrompa o uso se houver irritação.'],
  ['Coleiras com guizo para gatos', 'gatos', 'coleiras-gatos', 19.90, 'Coleiras estampadas para gatos, com guizo, em diferentes cores e padrões.', 'Acessório para uso supervisionado no dia a dia.', 'Confirme ajuste, tamanho e estampa; a coleira não deve apertar o pescoço.', 'Verifique fecho, tecido e guizo regularmente.'],
  ['Pet Clean Limpa Patas 120 ml', 'higiene', 'limpa-patas', 24.90, 'Spray higienizador de patinhas Pet Clean, frasco de 120 ml.', 'Para a limpeza das patinhas após os passeios, conforme o rótulo.', 'Leia a indicação de uso e confirme se é adequada ao seu pet.', 'Evite olhos e mucosas e siga as instruções da embalagem.'],
  ['Mantinhas de fleece Love Pets', 'descanso', 'mantinhas-enquadradas', 39.90, 'Mantinhas de fleece da Love Pets em estampas e cores variadas.', 'Para deixar caminhas e cantinhos de descanso mais aconchegantes.', 'Confirme medida, estampa e tecido disponíveis antes do pedido.', 'Lave de acordo com a etiqueta e seque completamente antes de guardar.'],
  ['Caixa de transporte rosa', 'passeio', 'caixa-transporte', 149.90, 'Caixa de transporte rígida rosa com porta frontal preta.', 'Para deslocamentos em que o pet precise de uma caixa apropriada.', 'Confira dimensões internas, porte do animal e travas antes de comprar.', 'Higienize após o uso e verifique as travas periodicamente.'],
  ['Arranhador vermelho para gatos', 'gatos', 'arranhador', 79.90, 'Arranhador para gatos com base de pelúcia vermelha e coluna revestida de sisal.', 'Ofereça um local próprio para arranhar e brincar.', 'Confira altura, estabilidade e espaço disponível em casa.', 'Inspecione a corda e a base; substitua peças muito desgastadas.'],
  ['Peitoral com guia verde', 'passeio', 'peitoral-guia', 59.90, 'Conjunto de peitoral e guia em tom verde, com fechos ajustáveis.', 'Para passeios com ajuste confortável ao corpo do pet.', 'Meça tórax e pescoço e confira o tamanho antes de pedir.', 'Verifique costuras, mosquetão e fechos antes de cada passeio.'],
  ['Benetto Tapetes Higiênicos 28 un.', 'higiene', 'tapete-higienico', 59.90, 'Pacote Benetto com 28 tapetes higiênicos de 75 x 60 cm, conforme a embalagem.', 'Para organizar o espaço de higiene do cão em casa.', 'Confira o tamanho do tapete e a área de absorção indicados no pacote.', 'Troque conforme a necessidade e descarte no lixo comum.'],
  ['Fraldas descartáveis para pets', 'higiene', 'fraldas', 24.90, 'Pacotes de fraldas para pets em tamanhos P e M, conforme as etiquetas fotografadas.', 'Para situações em que o pet precise de proteção descartável.', 'Confirme o tamanho, as medidas e o tipo de fralda com a equipe.', 'Troque com frequência e siga as instruções da embalagem.'],
  ['Brinquedos variados para pets', 'brinquedos', 'brinquedos', 14.90, 'Seleção de bolinhas, cordas e brinquedos de borracha em modelos variados.', 'Para momentos de brincadeira e interação supervisionada.', 'Escolha o tamanho e o material adequados ao porte e ao jeito de brincar.', 'Inspecione as peças e descarte brinquedos danificados.'],
  ['Petisco mastigável natural para cães', 'petiscos', 'petisco-natural', 19.90, 'Petiscos mastigáveis em embalagem verde com indicação 100% natural.', 'Ofereça como agrado, seguindo a porção indicada pelo fabricante.', 'Confira ingredientes, tamanho e adequação à idade do cão.', 'Supervisione a mastigação e mantenha água fresca disponível.'],
  ['Papaya Pets Cuidado Oral 45 g', 'petiscos', 'petisco-oral', 9.90, 'Snack mastigável Papaya Pets Cuidado Oral para cães adultos de pequeno porte, 45 g com 3 unidades.', 'Petisco de uso diário conforme a orientação da embalagem.', 'Confira ingredientes e indicação de porte no rótulo.', 'Supervisione a mastigação e armazene em local seco.'],
  ['Caminha xadrez Love Pets', 'descanso', 'caminha', 129.90, 'Caminha acolchoada da Love Pets em xadrez vermelho e azul, com laterais altas.', 'Para criar um cantinho confortável de descanso.', 'Confirme medidas da cama e compare com o porte e hábito de dormir do pet.', 'Siga a etiqueta de lavagem e deixe secar completamente.'],
  ['Pet Clean Shampoo Filhote 700 ml', 'higiene', 'shampoo-filhote', 34.90, 'Shampoo e condicionador Pet Clean Filhote, frasco verde de 700 ml.', 'Para o banho conforme a orientação do rótulo.', 'Confira idade, tipo de pelagem e ingredientes antes de escolher.', 'Evite contato com olhos e mucosas; enxágue bem.'],
  ['Pet Clean Shampoo 5 em 1 700 ml', 'higiene', 'shampoo-5-em-1', 34.90, 'Shampoo e condicionador Pet Clean 5 em 1, frasco roxo de 700 ml.', 'Para o banho conforme a orientação do rótulo.', 'Confira a indicação para a pelagem do pet antes de usar.', 'Evite contato com olhos e mucosas; enxágue bem.'],
  ['Pet Clean Shampoo Neutro 700 ml', 'higiene', 'shampoo-neutro', 34.90, 'Shampoo e condicionador Pet Clean Neutro, frasco azul de 700 ml.', 'Para o banho conforme a orientação do rótulo.', 'Confira a indicação para o tipo de pelo e pele do pet.', 'Evite contato com olhos e mucosas; enxágue bem.'],
  ['Pet Clean Condicionador 700 ml', 'higiene', 'condicionador', 32.90, 'Condicionador Pet Clean para cães e gatos, frasco laranja de 700 ml.', 'Use após o shampoo conforme o modo de uso da embalagem.', 'Confira a indicação para a pelagem e o porte do pet.', 'Evite contato com olhos e mucosas; enxágue bem.'],
];

const products = items.map(([name, category, image, amount, description, usage, selection, care], index) => ({
  id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  name, category, categoryLabel: labels[category],
  image: `/assets/products/${image}.jpg`,
  description, usage, selection, care,
  price: `R$ ${amount.toFixed(2).replace('.', ',')}`,
  stockQuantity: null,
  illustrative: false,
})).filter(item => !['10000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000010'].includes(item.id));
const oneByOne = products.find(item => item.id === '10000000-0000-4000-8000-000000000008');
oneByOne.name = 'OneByOne Fit 50 g';
oneByOne.description = 'Snack mastigável OneByOne Fit para cães, 50 g. Escolha entre Maçã com cenoura e quinoa, Manga com beterraba e linhaça ou Morango com batata-doce e chia.';
oneByOne.stockQuantity = 10;
oneByOne.flavors = ['Maçã', 'Manga', 'Morango'];
const priceOverrides = {
  'Escovas dentais para pets': 10, 'Pet Clean Creme Dental Tutti 90 g': 20, 'Pet Clean Hidrata Focinhos 60 g': 30,
  'Comedouro plástico com base': 20, 'Pet Clean Creme Dental Carne 60 g': 20, 'Pet Kiss Educador Pipi Não Pode 150 ml': 25,
  'Pet Clean Banho a Seco Maciez 240 ml': 40, 'OneByOne Fit 50 g': 15, 'Pet Clean Hidratante de Patinhas 150 g': 20,
  'Pet Clean Limpa Patas 120 ml': 30, 'Mantinhas de fleece Love Pets': 20, 'Caixa de transporte rosa': 40,
  'Arranhador vermelho para gatos': 60, 'Peitoral com guia verde': 60, 'Benetto Tapetes Higiênicos 28 un.': 5,
  'Fraldas descartáveis para pets': 15, 'Brinquedos variados para pets': 10, 'Petisco mastigável natural para cães': 20,
  'Papaya Pets Cuidado Oral 45 g': 25, 'Caminha xadrez Love Pets': 80, 'Pet Clean Shampoo Filhote 700 ml': 20,
  'Pet Clean Shampoo 5 em 1 700 ml': 20, 'Pet Clean Shampoo Neutro 700 ml': 20, 'Pet Clean Condicionador 700 ml': 20,
};
const nameOverrides = {
  'Mantinhas de fleece Love Pets': 'Mantinhas Love Pets',
  'Petisco mastigável natural para cães': 'Petiscos Variados',
  'Papaya Pets Cuidado Oral 45 g': 'Petisco Cuidado Oral',
};
for (const product of products) {
  if (priceOverrides[product.name] !== undefined) product.price = `R$ ${priceOverrides[product.name].toFixed(2).replace('.', ',')}`;
  if (nameOverrides[product.name]) product.name = nameOverrides[product.name];
}
const diapers = products.find(item => item.id === '10000000-0000-4000-8000-000000000019');
diapers.description = 'Pacotes de fraldas para pets nos tamanhos P, M e G, conforme a disponibilidade.';
diapers.sizes = ['P', 'M', 'G'];
writeFileSync('public/products.json', JSON.stringify(products, null, 2) + '\n');
console.log(`Prepared ${products.length} real catalog items from 23 photographs.`);
