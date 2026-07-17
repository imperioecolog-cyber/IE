# 📘 Guia Completo — Netlify CLI + Database

## Império Ecolog Logística — Sistema de Gestão

---

## Índice

1. [Instalação da CLI](#1-instalação-da-cli)
2. [Autenticação](#2-autenticação)
3. [Implantação (Deploy)](#3-implantação-deploy)
4. [Implantação Contínua (CI/CD)](#4-implantação-contínua-cicd)
5. [Variáveis de Ambiente](#5-variáveis-de-ambiente)
6. [Desenvolvimento Local](#6-desenvolvimento-local)
7. [Netlify Functions (Serverless)](#7-netlify-functions-serverless)
8. [Banco de Dados](#8-banco-de-dados)
9. [Monitoramento e Debug](#9-monitoramento-e-debug)
10. [Referência Rápida de Comandos](#10-referência-rápida-de-comandos)

---

## 1. Instalação da CLI

### Instalação Global (Desenvolvimento Local)

```bash
# Requisito: Node.js >= 18.14.0
npm install -g netlify-cli

# Verificar instalação
netlify --version
```

### Instalação Local (CI/CD — Recomendado)

```bash
# Instalar como dependência de desenvolvimento
npm install netlify-cli --save-dev

# Executar via npx
npx netlify deploy
```

> [!TIP]
> Para CI/CD, sempre use instalação local + arquivo de lock para builds reproduzíveis.

---

## 2. Autenticação

### Via Linha de Comando

```bash
# Abre o navegador para login
netlify login

# Verificar status da autenticação
netlify status
```

### Via Token de Acesso Pessoal (PAT)

1. Acesse **Netlify > User Settings > Applications > Personal Access Tokens**
2. Gere um novo token
3. Configure como variável de ambiente:

```powershell
# PowerShell (Windows)
$env:NETLIFY_AUTH_TOKEN = "seu-token-aqui"

# Ou salvar permanentemente
[System.Environment]::SetEnvironmentVariable("NETLIFY_AUTH_TOKEN", "seu-token", "User")
```

### Para CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
env:
  NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
  NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### Localização do config.json

| SO | Caminho |
|---|---|
| **Windows** | `%AppData%\netlify\Config\config.json` |
| **macOS** | `~/Library/Preferences/netlify/config.json` |
| **Linux** | `~/.config/netlify/config.json` |

### Revogar Acesso

- **Token CLI**: Netlify > User Settings > Authorized Applications > Revogar
- **PAT**: Netlify > User Settings > Personal Access Tokens > Excluir

---

## 3. Implantação (Deploy)

### Deploy de Rascunho (Preview)

```bash
# Deploy para URL temporária de preview
netlify deploy

# Com pasta específica
netlify deploy --dir=dist --functions=netlify/functions

# Com alias personalizado para o URL de preview
netlify deploy --alias=staging-v2
```

### Deploy de Produção

```bash
# Deploy para o URL principal do site
netlify deploy --prod

# Ou abreviado
netlify deploy -p
```

### Deploy Anônimo (sem login)

```bash
# Cria um projeto temporário (1h para reivindicar)
netlify deploy --allow-anonymous
```

> [!WARNING]
> Projetos anônimos não reivindicados em 1 hora são removidos automaticamente.

### Build + Deploy Combinados

```bash
# Compilar e implantar em um único comando
netlify build && netlify deploy --prod

# Simulação de build (dry run)
netlify build --dry
```

### Build para Contextos Específicos

```bash
# Build como se fosse uma Deploy Preview
netlify build --context deploy-preview

# Build como produção (padrão)
netlify build --context production
```

---

## 4. Implantação Contínua (CI/CD)

### Configuração Automática (GitHub)

```bash
# Inicializar CI/CD a partir do repositório local
netlify init
```

A CLI vai:
1. Pedir login no GitHub
2. Criar uma chave de deploy no repositório
3. Configurar um webhook para deploys automáticos

### Configuração Manual (GitLab, Bitbucket, Azure DevOps)

```bash
netlify init --manual
```

Você receberá:
- **Chave de Deploy SSH** → Adicionar ao provedor Git
- **URL do Webhook** → Configurar no provedor Git

#### Eventos de Webhook por Provedor

| Provedor | Eventos |
|---|---|
| **GitHub** | Push (produção), Pull Request (preview) |
| **GitLab** | Push, Merge Request |
| **Bitbucket** | Push, Pull Request |
| **Azure DevOps** | Code pushed, PR created, PR merge attempted, PR updated |

### Clonar e Vincular Projetos Existentes

```bash
# Clonar repo + vincular ao Netlify automaticamente
netlify clone owner/repo

# Com diretório de destino
netlify clone owner/repo meu-projeto

# Com site específico
netlify clone owner/repo --name meu-site

# Vincular repositório existente ao Netlify
netlify link

# Desvincular
netlify unlink
```

### GitHub Actions — Workflow Completo

```yaml
# .github/workflows/netlify-deploy.yml
name: Deploy to Netlify

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      
      - run: npm run build:netlify
      
      # Deploy Preview para PRs
      - name: Deploy Preview
        if: github.event_name == 'pull_request'
        run: npx netlify deploy --dir=dist --functions=netlify/functions
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
      
      # Deploy Produção para main
      - name: Deploy Production
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        run: npx netlify deploy --prod --dir=dist --functions=netlify/functions
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## 5. Variáveis de Ambiente

### Criar/Atualizar

```bash
# Definir variável (todos os contextos e escopos)
netlify env:set GEMINI_API_KEY "sua-chave"

# Com contexto e escopo específicos
netlify env:set GEMINI_API_KEY "sua-chave" --scope functions --context production

# Múltiplos contextos
netlify env:set API_KEY "valor" --context production deploy-preview

# Valor diferente por branch
netlify env:set API_KEY "valor-staging" --context branch:staging

# Marcar como segredo
netlify env:set GEMINI_API_KEY "chave-secreta" --context production --secret
```

### Listar Variáveis

```bash
# Listar todas as variáveis (contexto dev por padrão)
netlify env:list

# Contexto específico
netlify env:list --context production

# Filtrar por escopo
netlify env:list --scope functions

# Formato JSON
netlify env:list --json

# Formato texto plano (útil para copiar para .env)
netlify env:list --plain
```

### Obter Valor Individual

```bash
netlify env:get GEMINI_API_KEY
netlify env:get GEMINI_API_KEY --context production
```

### Importar/Exportar

```bash
# Importar de arquivo .env
netlify env:import .env

# Copiar variáveis entre sites
netlify env:clone --from siteIdOrigem --to siteIdDestino
```

### Excluir

```bash
# Excluir variável de todos os contextos
netlify env:unset API_KEY

# Excluir de um contexto específico
netlify env:unset API_KEY --context dev
```

### Variáveis do Nosso Projeto

```bash
# === Configurar todas as variáveis necessárias ===

# Gemini AI (OCR)
netlify env:set GEMINI_API_KEY "sua-chave-gemini" --scope functions --secret

# Firebase
netlify env:set FIREBASE_PROJECT_ID "seu-project-id"
netlify env:set FIREBASE_APP_ID "seu-app-id"
netlify env:set FIREBASE_API_KEY "sua-api-key"
netlify env:set FIREBASE_AUTH_DOMAIN "seu-projeto.firebaseapp.com"
netlify env:set FIREBASE_STORAGE_BUCKET "seu-projeto.appspot.com"
netlify env:set FIREBASE_MESSAGING_SENDER_ID "seu-sender-id"
netlify env:set FIREBASE_MEASUREMENT_ID "G-XXXXXXXXXX"

# App URL (será preenchido automaticamente pelo Netlify na maioria dos casos)
netlify env:set APP_URL "https://seu-site.netlify.app" --context production
```

---

## 6. Desenvolvimento Local

### Netlify Dev

```bash
# Iniciar servidor de desenvolvimento com functions
netlify dev

# Porta específica
netlify dev --port 8888

# Com edgehandlers
netlify dev --edgeInspect
```

O `netlify dev` faz:
- Serve o frontend via Vite (porta 5173)
- Proxy das Functions em `/.netlify/functions/`
- Carrega variáveis de ambiente do Netlify
- Simula redirects do `netlify.toml`

### Testar Functions Localmente

```bash
# Invocar uma function diretamente
netlify functions:invoke ocr --payload '{"fileBase64":"...","mimeType":"image/png"}'

# Listar functions disponíveis
netlify functions:list

# Criar nova function a partir de template
netlify functions:create minha-funcao
```

---

## 7. Netlify Functions (Serverless)

### Estrutura do Projeto

```
d:\B\
├── netlify/
│   └── functions/
│       ├── ocr.ts          ← OCR com Gemini AI
│       └── firebase-config.ts ← Configuração Firebase
├── netlify.toml            ← Configuração Netlify
├── dist/                   ← Build do Vite (publicado)
└── src/                    ← Código-fonte React
```

### Como as Functions São Acessadas

| Rota Original | Rota Netlify | Function |
|---|---|---|
| `POST /api/ocr` | `POST /.netlify/functions/ocr` | `netlify/functions/ocr.ts` |
| `GET /api/firebase-config` | `GET /.netlify/functions/firebase-config` | `netlify/functions/firebase-config.ts` |

> [!NOTE]
> O redirect no `netlify.toml` mapeia `/api/*` → `/.netlify/functions/*`, então o frontend continua usando `/api/ocr` normalmente.

### Limites das Functions (Plano Gratuito)

| Recurso | Limite |
|---|---|
| Invocações/mês | 125.000 |
| Tempo de execução | 10s (nível 1) / 26s (nível 2) |
| Tamanho do payload | 6 MB |
| Memória | 1024 MB |
| Deploy bundle size | 50 MB |

---

## 8. Banco de Dados

### Arquitetura de Dados do Projeto

O projeto suporta **3 modos de armazenamento**:

#### 8.1. Google Sheets (Modo Atual — Client-Side)

O módulo `sheetsDB.ts` usa Google Sheets API como banco:

| Planilha | Dados |
|---|---|
| `Processos` | Registros de processos logísticos |
| `Clientes` | Cadastro de clientes |
| `Prestadores` | Motoristas/prestadores |
| `Transportadoras` | Empresas de transporte |
| `Armadores` | Companhias marítimas |
| `Terminais` | Terminais portuários |
| `ModelosOCR` | Modelos de extração OCR |
| `Logs` | Registro de auditoria |

**Compatível com Netlify** ✅ — Roda no navegador do cliente.

#### 8.2. Firebase (Autenticação + Firestore)

- **Auth**: Login de usuários via Firebase Authentication
- **Firestore**: Possibilidade de migrar dados do Google Sheets para Firestore

**Compatível com Netlify** ✅ — Roda no navegador do cliente.

#### 8.3. PostgreSQL + Prisma (Backend NestJS)

Schema completo em `backend/prisma/schema.prisma`:

| Tabela | Descrição |
|---|---|
| `User` | Usuários com RBAC |
| `Profile` | Perfis de acesso |
| `Permission` | Permissões granulares |
| `Customer` | Clientes |
| `Driver` | Motoristas |
| `Carrier` | Transportadoras |
| `Shipowner` | Armadores |
| `Terminal` | Terminais |
| `Process` | Processos logísticos |
| `Container` | Containers |
| `Freight` | Fretes e pagamentos |
| `Payment` | Pagamentos |
| `ReturnFlow` | Devoluções |
| `Upload` | Uploads/OCR |
| `OCRRule` | Regras de OCR |
| `WebhookEvent` | Eventos webhook |
| `Notification` | Notificações |
| `AuditLog` | Auditoria |

**Não compatível com Netlify diretamente** ⚠️ — Precisa de servidor separado.

### Opções de Hospedagem para PostgreSQL

| Serviço | Plano Gratuito | Conexão |
|---|---|---|
| **Supabase** | 500 MB, 2 projetos | `postgresql://...@db.xxx.supabase.co:5432/postgres` |
| **Neon** | 0.5 GB, branching | `postgresql://...@ep-xxx.us-east-2.aws.neon.tech/neondb` |
| **Railway** | $5 crédito/mês | `postgresql://...@containers.railway.app:xxxx/railway` |
| **Render** | 1 GB, 90 dias | `postgresql://...@dpg-xxx.render.com/imperio_ecolog` |
| **PlanetScale** | MySQL, 5 GB | (MySQL, não PostgreSQL) |

### Configuração do Banco no Netlify

Se usar PostgreSQL externo:

```bash
# Configurar URL do banco
netlify env:set DATABASE_URL "postgresql://user:pass@host:5432/dbname" --scope functions --secret

# Se o backend NestJS rodar em outro serviço, configurar URL
netlify env:set BACKEND_API_URL "https://seu-backend.railway.app" --context production
```

---

## 9. Monitoramento e Debug

### Debug de Comandos

```powershell
# PowerShell — Ativar debug completo
$env:DEBUG='*'; netlify deploy

# Cmd.exe
set DEBUG=* & netlify deploy
```

### Logs de Functions

```bash
# Ver logs em tempo real
netlify functions:log ocr

# Ver logs no painel web
netlify open:admin
```

### Status e Informações

```bash
# Status do site vinculado
netlify status

# Abrir admin do site no navegador
netlify open:admin

# Abrir o site no navegador
netlify open:site

# Ver informações do deploy mais recente
netlify deploy --json | jq '.deploy_url'
```

### Telemetria

```bash
# Desativar coleta de dados de uso
netlify --telemetry-disable

# Reativar
netlify --telemetry-enable
```

---

## 10. Referência Rápida de Comandos

### Essenciais

| Comando | Descrição |
|---|---|
| `netlify login` | Autenticar com Netlify |
| `netlify status` | Status da autenticação e site |
| `netlify init` | Configurar CI/CD para o repo |
| `netlify dev` | Servidor de desenvolvimento local |
| `netlify build` | Compilar projeto localmente |
| `netlify deploy` | Deploy de rascunho (preview) |
| `netlify deploy --prod` | Deploy de produção |
| `netlify open` | Abrir site ou admin no navegador |

### Sites e Projetos

| Comando | Descrição |
|---|---|
| `netlify sites:list` | Listar todos os sites |
| `netlify sites:create` | Criar novo site |
| `netlify sites:delete` | Excluir site |
| `netlify link` | Vincular diretório a um site |
| `netlify unlink` | Desvincular diretório |
| `netlify clone owner/repo` | Clonar repo + vincular |

### Variáveis de Ambiente

| Comando | Descrição |
|---|---|
| `netlify env:set KEY valor` | Criar/atualizar variável |
| `netlify env:get KEY` | Obter valor de variável |
| `netlify env:list` | Listar todas as variáveis |
| `netlify env:unset KEY` | Excluir variável |
| `netlify env:import .env` | Importar de arquivo .env |
| `netlify env:clone --from A --to B` | Copiar entre sites |

### Functions (Serverless)

| Comando | Descrição |
|---|---|
| `netlify functions:list` | Listar functions |
| `netlify functions:create nome` | Criar nova function |
| `netlify functions:invoke nome` | Executar function localmente |
| `netlify functions:log nome` | Ver logs de uma function |

### Build e Deploy

| Comando | Descrição |
|---|---|
| `netlify build` | Build local |
| `netlify build --dry` | Simulação de build |
| `netlify build --context X` | Build para contexto específico |
| `netlify deploy --dir=dist` | Deploy com pasta específica |
| `netlify deploy --alias=X` | Deploy com URL personalizado |
| `netlify deploy --allow-anonymous` | Deploy anônimo |

### Monorepos

| Comando | Descrição |
|---|---|
| `netlify dev --filter website` | Dev para pacote específico |
| `netlify dev --filter packages/website` | Dev com caminho do pacote |

### Ajuda

| Comando | Descrição |
|---|---|
| `netlify help` | Ajuda geral |
| `netlify help deploy` | Ajuda sobre deploy |
| `netlify help sites:create` | Ajuda sobre subcomando |

---

## Fluxo Completo — Do Zero ao Deploy

```bash
# 1. Instalar CLI
npm install -g netlify-cli

# 2. Autenticar
netlify login

# 3. Ir para o diretório do projeto
cd d:\B

# 4. Build do projeto
npm run build:netlify

# 5. Primeiro deploy (preview)
netlify deploy --dir=dist --functions=netlify/functions

# 6. Verificar no URL de preview

# 7. Configurar variáveis de ambiente
netlify env:set GEMINI_API_KEY "sua-chave" --secret
netlify env:set FIREBASE_PROJECT_ID "seu-id"
# ... (demais variáveis)

# 8. Deploy de produção
netlify deploy --prod --dir=dist --functions=netlify/functions

# 9. (Opcional) Configurar CI/CD
netlify init

# 10. Abrir site
netlify open:site
```

---

> [!TIP]
> **Dica**: Use `netlify dev` para desenvolvimento local — ele simula todo o ambiente Netlify incluindo Functions e redirects, sem precisar fazer deploy.
