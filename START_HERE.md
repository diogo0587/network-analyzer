# 🚀 START HERE - Network Traffic Analyzer com Pacap Real

## 5 Minutos para Começar

### Passo 1: Instalar Libpcap

\`\`\`bash
# macOS
brew install libpcap

# Ubuntu/Debian
sudo apt-get install libpcap-dev

# Windows
# Baixar: https://npcap.com/dist/npcap-1.13.1.exe
\`\`\`

### Passo 2: Verificar Ambiente

\`\`\`bash
node scripts/check-pcap-env.js
\`\`\`

Você verá algo como:

\`\`\`
═══════════════════════════════════════════════════════════════
       Network Traffic Analyzer - Environment Check
═══════════════════════════════════════════════════════════════

1️⃣  Node.js Environment
   ✓ Node.js v18.12.0
   ✓ npm 8.19.2
   ✓ OS: LINUX

2️⃣  Libpcap System Library
   ✓ libpcap installed: libpcap version 1.10.1

3️⃣  npm Dependencies
   ✓ next@16.0.10
   ✓ react@19.2.3
   ✓ react-dom@19.2.3

4️⃣  Network Interfaces
   ✓ Found 2 active interface(s):
     - eth0
     - eth1

5️⃣  System Permissions
   ⚠ Not running as root (may need sudo for real packet capture)
     Run with: sudo npm run dev
\`\`\`

### Passo 3: Instalar e Rodar

\`\`\`bash
# Instalar dependências
npm install

# Rodar com permissões para captura real
sudo npm run dev

# Abrir navegador
# http://localhost:3000
\`\`\`

## ✅ Pronto!

Você deve ver:

1. **Dashboard** com tráfego de rede em tempo real
2. **Badge azul "Real Capture"** no canto superior direito (significa captura real)
3. **Pacotes sendo listados** com IPs, portas e protocolos
4. **Estatísticas** atualizando em tempo real

## 🎯 Próximos Passos

### Opção A: Testar Localmente
Continue desenvolvendo localmente com `sudo npm run dev`

### Opção B: Deploy em Produção
1. Leia [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
2. Escolha opção (DigitalOcean, AWS, etc)
3. Siga instruções de setup

### Opção C: Customizar Aplicação
1. Edite componentes em `/components/network/`
2. Customize captura em `/lib/pcap-handler.ts`
3. Adicione banco de dados para persistência

## ❓ FAQ Rápido

**P: Como saber se está usando captura real?**
R: Clique no badge no canto superior direito. Será azul para real, âmbar para mock.

**P: Por que preciso de `sudo`?**
R: Captura de pacotes requer acesso a dispositivos de rede (permissão de root).

**P: Posso usar no Vercel?**
R: Sim, mas rodará em mock mode (não real). Veja [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).

**P: Como escalar para muitos pacotes?**
R: Adicione database (PostgreSQL) e message queue (Redis/Kafka). Veja exemplos em [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md).

**P: Funciona em Docker?**
R: Sim! Veja [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) para Dockerfile.

## 📚 Documentação

| Arquivo | Para Quem |
|---------|-----------|
| [README_PRODUCTION.md](./README_PRODUCTION.md) | Visão geral completa |
| [REAL_NETWORK_SETUP.md](./REAL_NETWORK_SETUP.md) | Setup detalhado com troubleshooting |
| [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) | Deploy em produção |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Referência técnica de API |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Como o sistema funciona |

## 🔥 Comandos Úteis

\`\`\`bash
# Verificar environment
node scripts/check-pcap-env.js

# Rodar em desenvolvimento
npm run dev

# Rodar em desenvolvimento COM captura real
sudo npm run dev

# Build para produção
npm run build

# Rodar em produção
npm start

# Rodar em produção COM captura real
sudo npm start

# Lint
npm run lint

# Verificar interfaces de rede
node -e "console.log(require('os').networkInterfaces())"
\`\`\`

## ⚡ Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| `pcap library not available` | `brew install libpcap` (macOS) ou `sudo apt-get install libpcap-dev` (Linux) |
| `Operation not permitted` | Use `sudo npm run dev` |
| Nenhum pacote capturado | Tente gerar tráfego: `curl http://localhost:3000` |
| Rodando em mock quando deveria ser real | Instale libpcap + use sudo + reinicie |
| Alto uso de memória | Reduza `maxBufferSize` em `/lib/packet-capture-hybrid.ts` |

## 🎓 Para Entender o Código

Arquitetura simplificada:

\`\`\`
Sistema Híbrido (Inteligente)
         ↓
    ┌────┴────┐
    ↓         ↓
[Real]    [Mock]
 pcap     Generator
    ↓         ↓
    └────┬────┘
         ↓
  PacketCapture
  (1000 pkt buffer)
         ↓
    API (/api/packets)
         ↓
    Frontend (Dashboard)
\`\`\`

Arquivos principais:
- `lib/pcap-handler.ts` → Captura real com libpcap
- `lib/packet-capture-hybrid.ts` → Lógica de fallback
- `lib/packet-generator.ts` → Gerador mock (fallback)
- `app/api/packets/route.ts` → API que expõe dados
- `components/network/*.tsx` → UI

## 🚀 Resumo

1. ✅ Libpcap instalado
2. ✅ Ambiente verificado
3. ✅ Dependências instaladas
4. ✅ App rodando: `sudo npm run dev`
5. ✅ Navegador: `http://localhost:3000`
6. ✅ Vendo pacotes reais!

**Tudo funcionando? Parabéns! 🎉**

Próximo: Deploy em produção ou customizar aplicação.
