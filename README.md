# Love Pets Lavras

Landing page estática da Love Pets, com banho e tosa, contato e catálogo visual. A interface é responsiva e usa HTML, CSS e JavaScript sem dependência de build.

O catálogo em `dist/products.json` reúne 22 **referências ilustrativas**: quatro mantinhas, quatro roupinhas, quatro caminhas, cinco acessórios para cães e cinco para gatos. As imagens são composições geradas para representar estilos, não fotografias de estoque confirmado. O site informa que modelos, tamanhos, cores, preços e disponibilidade devem ser consultados com a loja pelo WhatsApp.

Cada produto aponta para uma folha de imagens em `dist/assets/`. `col` e `row` indicam a célula, começando em zero; `cols` e `rows` indicam as dimensões da grade. Para substituir uma referência por foto real, atualize a imagem e os campos correspondentes. Não publique preço ou disponibilidade sem confirmação da Love Pets.

Para pré-visualização local, sirva a pasta `dist` com um servidor HTTP. O arquivo `preview-server.mjs` já está configurado para isso. O deploy usa o diretório estático `dist` definido em `.openai/hosting.json`.
