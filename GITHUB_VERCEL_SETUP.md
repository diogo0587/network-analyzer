# GitHub + Vercel Setup Guide

## ⚠️ Limitação Importante: Vercel vs Local

**Seu aplicativo tem dois cenários diferentes:**

### 🔵 Local (seu computador ou servidor próprio)
- ✅ Monitora tráfego de rede **REAL** via netstat/ss
- ✅ Mostra conexões TCP ativas reais
- ✅ Funciona perfeitamente
- ✅ Recomendado para produção real

### 🟡 Vercel (serverless hosting)
- ❌ Não consegue acessar dados de rede do sistema
- ❌ Ambiente muito restrito (sandbox)
- ✅ Dashboard funciona
- ⚠️ Dados serão simulados/vazios

---

## Opção 1: Local + GitHub (RECOMENDADO para uso real)

Se você quer **monitoramento real**, hospede seu próprio servidor.

### GitHub Setup

\`\`\`bash
# 1. Criar repositório no GitHub
# https://github.com/new

# 2. Clonar seu repositório
git clone https://github.com/seu-usuario/network-traffic-analyzer.git
cd network-traffic-analyzer

# 3. Adicionar código local
git add .
git commit -m "Initial commit: Network Traffic Analyzer"
git push origin main
\`\`\`

### Arquivos Importantes

Certifique-se que estes arquivos estão no GitHub:

\`\`\`
.github/
  workflows/
    deploy.yml          # CI/CD para deploy
.gitignore             # ✅ Já existe
next.config.mjs        # ✅ Já existe
package.json           # ✅ Já existe
lib/
  real-network-monitor.ts  # ✅ Novo
app/api/
  packets/route.ts     # ✅ Atualizado
\`\`\`

### .env.local (NÃO COMMITAR)

Crie arquivo `.env.local` localmente:

\`\`\`bash
# Nenhuma variável é obrigatória para funcionamento local
# O monitor funciona sem configuração
\`\`\`

---

## Opção 2: Vercel (Dashboard apenas)

Se você quer apenas visualizar em Vercel, va para: **https://vercel.com/new**

### Passo 1: Conectar GitHub ao Vercel
1. Acesse https://vercel.com
2. Login com GitHub
3. Clique "Add New..." → "Project"
4. Selecione seu repositório
5. Clique "Import"

### Passo 2: Build Settings
Deixe as configurações padrão:
- **Framework**: Next.js ✅
- **Build Command**: `next build` ✅
- **Output Directory**: `.next` ✅

### Passo 3: Deploy
Clique "Deploy" - vai publicar automaticamente

### Resultado em Vercel
- ✅ Dashboard carrega
- ✅ UI funciona
- ❌ Dados de rede vazios (Vercel não acessa sistema)
- ✅ Pode usar para logs/histórico via banco de dados

---

## Opção 3: Vercel + Banco de Dados (Recomendado para Vercel)

Para ter dados reais no Vercel, você precisa capturar dados localmente e enviar para banco de dados.

### Arquitetura

\`\`\`
Seu Servidor Local
    ↓ (captura netstat)
API Backend (coleta dados)
    ↓ (envia para DB)
Banco de Dados (Vercel + Neon/Supabase)
    ↓ (lê histórico)
Vercel Frontend
    ↓ (exibe no dashboard)
Browser do Usuário
\`\`\`

### Setup

1. **Criar conta Neon/Supabase**
   - Neon: https://neon.tech
   - Supabase: https://supabase.com

2. **Adicionar variáveis no Vercel**
   - Ir a: Project Settings → Environment Variables
   - Adicionar `DATABASE_URL`

3. **Rodar coletor local**
   - Executar em seu servidor: `npm run dev` ou deploy em Render/Railway
   - Esse irá coletar dados reais
   - Enviar para o banco de dados

4. **Dashboard no Vercel**
   - Lê dados do banco de dados
   - Exibe histórico e gráficos

---

## Checklist Final

### Antes de Commitar no GitHub

- [ ] Remover `.env.local` (já está em `.gitignore`)
- [ ] Adicionar `vercel.json` (opcional, instruções abaixo)
- [ ] Remover arquivos de debug
- [ ] Atualizar README.md com instruções

\`\`\`bash
# Verificar o que vai ser commitado
git status

# Adicionar tudo
git add .

# Commitar
git commit -m "Add Network Traffic Analyzer"

# Push para GitHub
git push origin main
\`\`\`

### Arquivo vercel.json (Opcional)

Crie `/vercel.json` para configurações específicas do Vercel:

\`\`\`json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "env": {
    "NODE_ENV": "production"
  },
  "maxDuration": 60
}
\`\`\`

---

## Rodar Localmente

\`\`\`bash
# 1. Instalar dependências
npm install

# 2. Rodar em desenvolvimento
npm run dev

# 3. Abrir navegador
http://localhost:3000

# 4. Ver dados reais de rede
# Dashboard mostrará conexões TCP reais
\`\`\`

---

## Rodar em Servidor Próprio

Se você tiver um servidor Linux/macOS:

\`\`\`bash
# 1. SSH para servidor
ssh seu-usuario@seu-servidor.com

# 2. Clonar repositório
git clone https://github.com/seu-usuario/network-traffic-analyzer.git
cd network-traffic-analyzer

# 3. Instalar dependências
npm install

# 4. Build
npm run build

# 5. Rodar em produção
npm run start

# 6. Para manter rodando: usar PM2
npm install -g pm2
pm2 start npm -- start
pm2 save
\`\`\`

---

## Troubleshooting

### "Network monitor não mostra dados"
**Local:** Verifique se `netstat` ou `ss` estão disponíveis
\`\`\`bash
which netstat  # ou
which ss
\`\`\`

**Vercel:** Normal - Vercel não tem acesso a netstat. Use banco de dados.

### "Build falha no Vercel"
- Verificar logs: Vercel Dashboard → Deployments → Build Log
- Comum: falta de variáveis de ambiente
- Solução: Adicionar em Vercel → Project Settings → Environment Variables

### "Dados vagos/mock no local"
- Monitor não conseguiu executar netstat
- Rodar com: `sudo npm run dev` (em Linux/macOS)
- Ou verifique permissões do Node.js

---

## Resumo da Configuração

| Aspecto | Local | Vercel |
|--------|-------|--------|
| Dados Reais | ✅ Sim | ❌ Não |
| Setup | Simples | Automático |
| Custo | Grátis | $20-40/mês |
| Performance | Excelente | Bom |
| Recomendado para | Monitoramento Real | Demo/Dashboard |

**Melhor opção:** Use **Local para captura** + **Vercel para frontend** (com banco de dados)

---

## Links Úteis

- GitHub: https://github.com
- Vercel: https://vercel.com
- Neon: https://neon.tech
- Supabase: https://supabase.com
- PM2: https://pm2.keymetrics.io
