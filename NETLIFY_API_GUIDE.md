# Guia de Automação com Netlify API (`@netlify/api`)

Este documento reúne os métodos oficiais para gerenciar recursos do Netlify de forma programática (via código Node.js) utilizando o cliente oficial da API do Netlify.

Isso é útil caso o projeto precise criar sites dinamicamente, buscar listas de deploys ou deletar recursos diretamente por uma interface administrativa personalizada.

---

## 1. Inicialização e Configurações Avançadas

Você pode instanciar o cliente passando apenas o Token, ou passar um objeto de opções completo para customizar headers, proxy e parâmetros globais.

### Básico
```typescript
import { NetlifyAPI } from '@netlify/api'

// Instanciação simples com o token de acesso
const client = new NetlifyAPI('1234myAccessToken')
```

### Avançado (`opts`)
```typescript
const opts = {
  userAgent: 'netlify/js-client',
  scheme: 'https',
  host: 'api.netlify.com',
  pathPrefix: '/api/v1',
  accessToken: '1234myAccessToken',
  agent: undefined, // Ex: HttpsProxyAgent para uso atrás de VPN/Proxy corporativo
  globalParams: {}, // Parâmetros aplicados a todas as requisições (se a especificação OpenAPI aceitar).
}

const client = new NetlifyAPI(opts)
```

---

## 2. Gerenciamento do Ciclo de Vida do Site

Aqui estão os exemplos principais para listar, provisionar e excluir sites:

### Listar Sites (Fetch)
```typescript
// Retorna a lista de sites vinculados à conta autenticada
const sites = await client.listSites()
```

### Criar Site (Create)
Utilize a propriedade `body` para enviar as configurações (conforme a especificação OpenAPI do Netlify).
```typescript
const site = await client.createSite({
  body: {
    name: `meu-novo-site-gerado-automaticamente`,
    // Outros parâmetros podem ser consultados na documentação oficial
    // https://open-api.netlify.com/#/default/createSite
  },
})
```

### Deletar Site (Delete)
O ID do site (`site_id`) deve ser passado diretamente como um parâmetro de caminho (path parameter).
```typescript
// Exclui um site permanentemente. Cuidado!
await client.deleteSite({ site_id: site.id })
```
