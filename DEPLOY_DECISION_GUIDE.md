# Como Fazer Deploy - Guia de Decisão

## Qual é seu caso?

### Caso A: "Quero monitorar meu próprio computador / servidor local"

**Solução:** Rodar localmente sem Vercel

\`\`\`bash
npm install
npm run dev
# Acesso: http://localhost:3000
\`\`\`

**Vantagens:**
- Dados 100% reais
- Sem custo
- Funciona offline
- Rápido

**Desvantagens:**
- Só você acessa (localhost)
- Precisa manter seu computador ligado

**GitHub:** Apenas para versionamento, não é necessário deploy

---

### Caso B: "Quero publicar um dashboard público no Vercel + dados reais de um servidor"

**Solução:** Servidor local/próprio + Vercel frontend + Banco de Dados

\`\`\`
Arquitetura:
┌─────────────────┐
│ Seu Servidor    │
│ (netstat real)  │
└────────┬────────┘
         │ envia dados
         ↓
┌─────────────────┐
│ Banco de Dados  │ (Neon/Supabase)
│ (histórico)     │
└────────┬────────┘
         │ lê dados
         ↓
┌─────────────────┐
│ Vercel Frontend │ (público)
│ (dashboard)     │
└─────────────────┘
\`\`\`

**Setup:**

1. **Local (seu servidor)**
   \`\`\`bash
   git clone seu-repo
   npm install
   npm run build
   npm run start
   # Rodar em background: pm2 start npm -- start
   \`\`\`

2. **Vercel (frontend)**
   - Conectar GitHub
   - Adicionar `DATABASE_URL` em Env Variables
   - Deploy automático

**Vantagens:**
- Dados reais
- Acessível publicamente
- Histórico no banco de dados
- Escalável

**Desvantagens:**
- Precisa manter servidor rodando
- Custos de banco de dados ($50-100/mês)
- Mais complexo

---

### Caso C: "Quero apenas um dashboard público no Vercel (sem dados reais)"

**Solução:** Push para GitHub → Deploy no Vercel

\`\`\`bash
# 1. GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. Vercel
# https://vercel.com/new
# Conectar GitHub → Selecionar repo → Deploy
\`\`\`

**Vantagens:**
- Super simples
- Grátis no Vercel
- Automático (auto-deploy quando push)

**Desvantagens:**
- Dados vazios/mock no Vercel
- Dashboard não mostra tráfego real

---

## Tabela de Comparação

| Necessidade | Caso A (Local) | Caso B (Real) | Caso C (Demo) |
|---|---|---|---|
| Dados reais | ✅ | ✅ | ❌ |
| Público | ❌ | ✅ | ✅ |
| Custo | Grátis | $50-100/mês | Grátis |
| Complexidade | Baixa | Alta | Muito Baixa |
| GitHub | Opcional | Obrigatório | Obrigatório |
| Vercel | Não | Sim | Sim |
| Setup | 1 minuto | 30 minutos | 5 minutos |

---

## Instruções por Caso

### Caso A: Local

\`\`\`bash
# Pronto para usar!
npm install
npm run dev
\`\`\`

**Nenhuma configuração adicional necessária.**

---

### Caso B: Real + Vercel

#### Passo 1: Criar Banco de Dados

**Opção 1: Neon**
1. https://neon.tech
2. Criar novo projeto
3. Copiar `DATABASE_URL`

**Opção 2: Supabase**
1. https://supabase.com
2. Criar novo projeto
3. Copiar connection string

#### Passo 2: GitHub

\`\`\`bash
# Verificar que .env.local está em .gitignore
cat .gitignore  # Deve ter .env*

# Adicionar e commitar
git add .
git commit -m "Add network monitor"
git push origin main
\`\`\`

#### Passo 3: Vercel

1. https://vercel.com
2. Login com GitHub
3. "Add New..." → "Project"
4. Selecionar repositório
5. Environment Variables:
   - `DATABASE_URL` = sua connection string
6. Deploy

#### Passo 4: Servidor Local

\`\`\`bash
# No seu servidor
npm install
npm run build
npm run start

# Para manter rodando:
npm install -g pm2
pm2 start npm -- start
\`\`\`

---

### Caso C: Demo (Vercel apenas)

\`\`\`bash
# 1. GitHub
git add .
git commit -m "Add network traffic analyzer"
git push origin main

# 2. Vercel (vai fazer auto-deploy)
# https://vercel.com/new
\`\`\`

**Pronto em 5 minutos!** Dashboard roda no Vercel.

---

## Qual Escolher?

**Escolha A se:**
- Quer monitorar apenas seu computador/servidor
- Quer privacidade total
- Quer zero custo

**Escolha B se:**
- Quer compartilhar com equipe
- Quer dados reais e histórico
- Tem orçamento para banco de dados
- Quer disponibilidade 24/7

**Escolha C se:**
- Quer apenas demonstrar o dashboard
- Dados reais não importam
- Quer solução super simples

---

## Próximos Passos

1. Decidir qual caso se aplica a você
2. Seguir as instruções acima
3. Se der erro, consultar: `GITHUB_VERCEL_SETUP.md`

**Precisa de ajuda?** Leia `GITHUB_VERCEL_SETUP.md` para troubleshooting.
