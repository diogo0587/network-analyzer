# 📋 Quick Reference Card

## Instalação em 3 passos

\`\`\`bash
# 1. Instalar libpcap (uma vez)
brew install libpcap          # macOS
sudo apt-get install libpcap-dev  # Linux

# 2. Verificar setup
node scripts/check-pcap-env.js

# 3. Rodar
npm install
sudo npm run dev
# Abrir: http://localhost:3000
\`\`\`

## Comandos Principais

\`\`\`bash
npm run dev              # Rodar dev (sem captura real)
sudo npm run dev         # Rodar dev (COM captura real)
npm run build            # Build para produção
npm run start            # Rodar produção
npm run lint             # Verificar código

# Verificação
node scripts/check-pcap-env.js
\`\`\`

## Status de Captura

Acesse: `http://localhost:3000/api/packets?action=status`

\`\`\`json
{
  "status": {
    "mode": "real",           // "real" ou "mock"
    "isActive": true,
    "interface": "en0",       // Interface sendo monitorada
    "packetsCount": 5234,     // Total capturado
    "uptime": 3600000,        // Tempo rodando em ms
    "availableInterfaces": ["en0", "en1"]
  }
}
\`\`\`

## Endpoints da API

| Endpoint | Descrição |
|----------|-----------|
| `/api/packets?action=packets` | Lista de pacotes |
| `/api/packets?action=stats` | Estatísticas de tráfego |
| `/api/packets?action=status` | Status de captura |
| `/api/packets?action=connections` | Conexões ativas |

## Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| `pcap library not available` | `brew install libpcap` |
| `Operation not permitted` | Use `sudo npm run dev` |
| Modo mock quando deveria real | Instale libpcap + use sudo |
| Alto uso memória | Reduza maxBufferSize |
| Nenhum pacote capturado | Gere tráfego: `curl http://localhost:3000` |

## Modo Real vs Mock

\`\`\`
REAL MODE (Azul)
├─ Captura packets reais
├─ Requer libpcap
└─ Requer sudo

MOCK MODE (Âmbar)
├─ Simula packets
├─ Sempre funciona
└─ Sem permissões
\`\`\`

## Arquivos Importantes

\`\`\`
Captura: /lib/pcap-handler.ts (libpcap parsing)
Híbrido: /lib/packet-capture-hybrid.ts (real+mock)
API: /app/api/packets/route.ts
UI: /app/page.tsx
Status: /components/network/backend-status.tsx
\`\`\`

## Deploy

\`\`\`bash
# Vercel (mock mode)
git push origin main

# Servidor Próprio (real mode)
ssh root@seu-servidor
apt-get install -y libpcap-dev
npm install && npm run build
npm install -g pm2
pm2 start "npm start" --name analyzer
\`\`\`

## Performance

- Captura: 300-500 pkt/seg
- Buffer: 1000 pacotes máximo
- Conexões: 100 máximo
- API: <100ms response

## Permissões Necessárias

\`\`\`bash
# macOS
sudo chmod +r /dev/bpf*
sudo chown $(whoami) /dev/bpf*

# Linux
sudo setcap cap_net_raw=ep $(which node)

# Windows
# Execute PowerShell como Administrator
\`\`\`

## Estrutura de Um Pacote

\`\`\`javascript
{
  id: "pkt-1234...",
  sourceIp: "192.168.1.100",
  destIp: "8.8.8.8",
  sourcePort: 54321,
  destPort: 443,
  protocol: "TCP",        // TCP, UDP, Other
  size: 512,              // bytes
  latency: 25.3,          // milliseconds
  timestamp: 1704067200000,
  isSuspicious: false,
  location: {
    country: "Unknown",
    city: "Unknown",
    latitude: 0,
    longitude: 0
  }
}
\`\`\`

## Detecção de Anomalias

Detecta automaticamente:
- Portas suspeitas (23, 21, 445, 135, 139)
- Tráfego fragmentado + portas incomuns
- Padrões de conexão anormais

## Próximos Passos

1. **Hoje**: Rodar localmente `sudo npm run dev`
2. **Esta semana**: Testar em diferentes redes
3. **Próximo mês**: Deploy em servidor + database
4. **Futuro**: Alertas, ML, integração com ferramentas

## Links Úteis

- [START_HERE.md](./START_HERE.md) - Início rápido
- [README_PRODUCTION.md](./README_PRODUCTION.md) - Documentação
- [REAL_NETWORK_SETUP.md](./REAL_NETWORK_SETUP.md) - Setup detalhado
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Produção
- [VISUAL_GUIDE.md](./VISUAL_GUIDE.md) - Diagramas

## GitHub

\`\`\`bash
git add .
git commit -m "Add real packet capture with pcap"
git push origin main
\`\`\`

## Teste Rápido

\`\`\`bash
# Terminal 1
sudo npm run dev

# Terminal 2 - Gerar tráfego
curl http://localhost:3000
curl https://google.com

# Ver pacotes em http://localhost:3000
\`\`\`

## Status Esperado

✅ Dashboard carrega
✅ Badge azul "Real Capture" OU âmbar "Mock Mode"
✅ Pacotes listados em tempo real
✅ Estatísticas atualizando
✅ Sem erros no console

**Tudo funcionando? Parabéns!** 🎉

Para mais, consulte a documentação completa.
