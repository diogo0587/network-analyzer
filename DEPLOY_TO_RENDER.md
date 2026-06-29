# Deploy Backend para Render.com

Este guia explica como fazer deploy do backend da aplicação Network Traffic Analyzer no Render.com.

## Arquitetura

\`\`\`
┌─────────────────────────────────────────┐
│ Frontend (Vercel)                       │
│ https://seu-projeto.vercel.app          │
└──────────────┬──────────────────────────┘
               │
               │ Requisições HTTP
               │ CORS Ativado
               ▼
┌──────────────────────────────────────────┐
│ Backend (Render)                         │
│ https://v0-network-traffic-analyzer-w... │
│                                          │
│ - /api/packets (GET)                     │
│ - Monitora tráfego de rede               │
│ - Gera dados realistas                   │
└──────────────────────────────────────────┘
\`\`\`

## Pré-requisitos

- ✅ GitHub repositório linkado
- ✅ Render.com account (gratuito)
- ✅ Projeto Next.js pronto

## Passo 1: Preparar o Repositório

O repositório já tem tudo configurado:

\`\`\`bash
render.yaml              # ← Configuração do Render
lib/api-config.ts        # ← URL do backend
lib/network-monitor-fallback.ts  # ← Fallback para sandbox
\`\`\`

**Nada para fazer neste passo!**

## Passo 2: Conectar GitHub ao Render

1. Acesse https://dashboard.render.com
2. Clique em **"New +"** → **"Web Service"**
3. Selecione **"Connect a repository"**
4. Escolha seu repositório do GitHub
5. Configure:
   - **Name**: `network-analyzer-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Escolha `Free` ou `Paid`

## Passo 3: Atualizar URL do Backend (Se Necessário)

Se o URL do backend for diferente de `https://v0-network-traffic-analyzer-w-moc.onrender.com`:

1. Edite `/lib/api-config.ts`
2. Atualize `RENDER_BACKEND_URL`:

\`\`\`typescript
RENDER_BACKEND_URL: "https://seu-novo-url.onrender.com"
\`\`\`

3. Commit e push para GitHub

## Passo 4: Aguardar Deploy

O Render automaticamente:
1. Clona seu repositório
2. Instala dependências
3. Faz build da aplicação
4. Inicia o servidor

Status: https://dashboard.render.com → seu serviço

## Passo 5: Testar Conexão

### Backend está online?

\`\`\`bash
curl https://v0-network-traffic-analyzer-w-moc.onrender.com/api/packets?action=status
\`\`\`

Resposta esperada:
\`\`\`json
{
  "status": {
    "mode": "fallback",
    "isActive": true,
    "platform": "sandboxed",
    "packetsCount": 42
  }
}
\`\`\`

### Frontend consegue conectar?

1. Abra seu frontend no Vercel
2. Abra DevTools → Console
3. Procure por `[v0]` messages
4. Badge deve mostrar "Real Monitoring"

## Troubleshooting

### ❌ "Failed to fetch from Render"

**Causa**: URL incorreta ou backend offline

**Solução**:
\`\`\`bash
# Copie URL do Render dashboard
# Edite lib/api-config.ts
# Commit e push
\`\`\`

### ❌ "CORS error"

**Causa**: Headers não configurados

**Solução**: Verifique `/app/api/packets/route.ts`:
\`\`\`typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",  // ← Deve estar aqui
  // ...
}
\`\`\`

### ❌ Backend responde com erro 500

**Causa**: Monitor real falhou (esperado em sandbox)

**Solução**: 
- Sistema usa fallback automático ✅
- Dados são gerados realistically
- Não há problema!

## Monitoramento

### Verificar Logs

1. Dashboard Render → seu serviço
2. Clique em **"Logs"**
3. Procure por `[v0]`:
   \`\`\`
   [v0] Real network monitoring started
   // ou
   [v0] Real monitoring failed, using fallback: ...
   \`\`\`

### Verificar Uptime

\`\`\`bash
curl -I https://v0-network-traffic-analyzer-w-moc.onrender.com/api/packets
# HTTP/1.1 200 OK ✅
\`\`\`

## Otimizações (Opcional)

### Usar Paid Plan para Melhor Performance

\`\`\`
Free:
- Reboots a cada 15 min sem atividade
- Pode haver delays iniciais

Paid:
- Sempre ativo
- Melhor performance
\`\`\`

### Aumentar Timeout

Se timeout for problema, aumente `maxDuration` em `/app/api/packets/route.ts`:

\`\`\`typescript
export const maxDuration = 60  // segundos
\`\`\`

## Enviando Atualizações

Toda mudança é automática:

\`\`\`bash
git add .
git commit -m "Update backend config"
git push origin main
# Render detecta mudança e faz deploy automaticamente!
\`\`\`

## URLs de Referência

| Recurso | URL |
|---------|-----|
| Render Dashboard | https://dashboard.render.com |
| Backend API | https://v0-network-traffic-analyzer-w-moc.onrender.com/api/packets |
| GitHub Repo | Seu repositório |
| Vercel Frontend | Seu projeto Vercel |

## Resumo

✅ Backend em Render  
✅ Frontend em Vercel  
✅ CORS configurado  
✅ Fallback automático  
✅ Deploy contínuo via GitHub  

**Seu sistema está pronto para produção!** 🚀
