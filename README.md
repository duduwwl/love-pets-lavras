# Love Pets Lavras

Site institucional estático com catálogo por categorias. Os dados comerciais conhecidos estão no conteúdo da página. Produtos individuais ainda não foram fornecidos; por isso `dist/products.json` começa vazio e nenhuma oferta, preço ou estoque é exibido sem dados reais.

Para adicionar um produto, inclua um objeto em `dist/products.json`:

```json
{
  "name": "Nome real do produto",
  "category": "mantinhas",
  "categoryLabel": "Mantinhas",
  "price": "R$ 00,00",
  "description": "Descrição confirmada pela loja.",
  "images": ["/assets/foto-do-produto.jpg"],
  "variants": ["P", "M"]
}
```

Categorias aceitas: `mantinhas`, `roupinhas`, `caminhas`, `caes`, `gatos`. `price`, `description` e `variants` são opcionais. A foto, o nome e a categoria são necessários. A página exibe os produtos e abre detalhes com galeria, variação e mensagem personalizada para o WhatsApp.
