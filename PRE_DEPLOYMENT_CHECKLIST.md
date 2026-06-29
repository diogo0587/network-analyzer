# Pre-Deployment Checklist

Antes de fazer push para GitHub e Vercel, verifique tudo isso.

## Local Testing

### Instalação
- [ ] `npm install` completou sem erros
- [ ] Nenhuma mensagem de `npm ERR!`
- [ ] Node.js versão 18+ (`node -v`)

### Desenvolvimento
- [ ] `npm run dev` inicia sem erros
- [ ] Dashboard abre em `http://localhost:3000`
- [ ] Página carrega com UI correta
- [ ] Badge azul "Real Monitoring" aparece

### Funcionalidade
- [ ] Dashboard mostra "Real Monitoring"
- [ ] Dados atualizam em tempo real
- [ ] Filtros funcionam
- [ ] Busca funciona
- [ ] Nenhum erro no console do browser

### Build
- [ ] `npm run build` passa
- [ ] Nenhum erro de TypeScript
- [ ] Pasta `.next` foi criada
- [ ] `npm run start` funciona

---

## GitHub

### Preparação
- [ ] Criar repositório em https://github.com/new
- [ ] `.gitignore` contém `.env*` ✅
- [ ] `.gitignore` contém `node_modules` ✅
- [ ] `.gitignore` contém `.next` ✅

### Verificação
\`\`\`bash
# Verificar o que vai ser commitado
git status

# Não deve incluir:
# - .env.local
# - node_modules
# - .next
# - .vercel
\`\`\`

### Commit
- [ ] `git add .` adicionou os arquivos corretos
- [ ] `git commit -m "descriptive message"` criou commit
- [ ] `git push origin main` enviou para GitHub

### Verificação Final
- [ ] Repositório visível em GitHub
- [ ] Todos os arquivos estão lá
- [ ] `.env.example` está presente
- [ ] README.md está atualizado

---

## Vercel

### Configuração
- [ ] Conectar GitHub em https://vercel.com/new
- [ ] Selecionar repositório correto
- [ ] Framework detectado como "Next.js" ✅
- [ ] Build command: `next build` ✅

### Environment Variables (se necessário)
Se está usando banco de dados:
- [ ] `DATABASE_URL` adicionada
- [ ] Testada localmente primeiro
- [ ] Não contém senha em plain text

### Deploy
- [ ] Clique "Deploy"
- [ ] Aguardar build completar
- [ ] Verificar build logs sem erros
- [ ] Domínio automaticamente atribuído

### Teste em Vercel
- [ ] Abrir URL do Vercel
- [ ] Dashboard carrega
- [ ] Nenhuma erro 500
- [ ] Badge "Real Monitoring" aparece

---

## Decisão de Ambiente

Escolha **UMA** das opções:

### Opção 1: Local Only (Recomendado para Teste)
- [ ] Código está em GitHub
- [ ] Não precisa de Vercel
- [ ] Roda com: `npm run dev` no seu computador
- [ ] Acesso: `http://localhost:3000`
- [ ] ✅ Dados reais da sua rede

### Opção 2: Vercel (Dashboard Demo)
- [ ] Código está em GitHub
- [ ] Deploy feito no Vercel
- [ ] Funciona publicamente
- [ ] ❌ Dados vazios (Vercel é sandbox)
- [ ] ✅ Ótimo para demonstração

### Opção 3: Local + Vercel + Banco de Dados (Produção)
- [ ] [ ] Código em GitHub
- [ ] [ ] Banco de Dados criado (Neon/Supabase)
- [ ] [ ] DATABASE_URL adicionada no Vercel
- [ ] [ ] Servidor local rodando
- [ ] [ ] Dados fluindo de Local → DB → Vercel
- [ ] ✅ Dados reais em ambiente de produção

---

## Troubleshooting Pré-Deploy

### Erro: "Module not found"
\`\`\`bash
npm install
npm run build
\`\`\`

### Erro: "Build failed on Vercel"
- [ ] Verificar Vercel Deploy Logs
- [ ] Verificar variáveis de ambiente
- [ ] Rodar `npm run build` localmente

### Dados vazios no Vercel
- [ ] Normal - Vercel não tem acesso a netstat
- [ ] Use banco de dados para histórico
- [ ] Ou use apenas local

### Dashboard não carrega
- [ ] Verificar console do browser (F12)
- [ ] Verificar Vercel logs
- [ ] Verificar se `.env.local` está em `.gitignore`

---

## Após Deploy

### GitHub
- [ ] Repositório é público (se desejado)
- [ ] Adicionar `.gitkeep` em pastas vazias (se necessário)
- [ ] Adicionar bom README.md

### Vercel
- [ ] URL funciona publicamente
- [ ] Auto-deployments estão ligados
- [ ] Monitoramento de erro configurado (opcional)

### Manutenção
- [ ] Testar após cada push
- [ ] Monitorar Vercel logs
- [ ] Manter server local rodando (se aplicável)

---

## Resumo

\`\`\`bash
# Local
npm install
npm run dev
# ✅ Funciona?

# GitHub
git add .
git commit -m "msg"
git push origin main
# ✅ Enviou?

# Vercel (opcional)
# https://vercel.com/new
# ✅ Publicado?
\`\`\`

**Se tudo acima passou, está pronto para produção!** 🚀
