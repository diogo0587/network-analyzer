# Network Traffic Analyzer - Versão Real com Captura de Pacotes

Analyzer profissional de tráfego de rede em tempo real com captura **real de pacotes** usando libpcap.

## 🎯 Características

- ✅ **Captura Real de Pacotes**: Usa libpcap para capturar pacotes reais do sistema
- ✅ **Modo Híbrido**: Fallback automático para mock se captura real não disponível
- ✅ **Detecção de Anomalias**: Identifica padrões suspeitos automaticamente
- ✅ **Interface em Tempo Real**: Dashboard com estatísticas live
- ✅ **Multi-protocolo**: TCP, UDP e outros protocolos
- ✅ **Histórico**: Armazena até 1000 pacotes em memória

## 🚀 Quick Start (5 minutos)

### 1. Pré-requisitos

\`\`\`bash
# Verificar Node.js
node --version  # deve ser v16+

# Instalar libpcap (uma vez)
# macOS:
brew install libpcap

# Linux:
sudo apt-get install libpcap-dev

# Windows:
# Baixar de https://npcap.com/
\`\`\`

### 2. Verificar Ambiente

\`\`\`bash
# Executar verificação de ambiente
node scripts/check-pcap-env.js
\`\`\`

### 3. Setup e Execução

\`\`\`bash
# Instalar dependências
npm install

# Desenvolvimento com real packet capture:
sudo npm run dev

# Ou apenas mock (sem sudo):
npm run dev

# Abrir navegador
# http://localhost:3000
\`\`\`

## 📋 Como Funciona

### Arquitetura

\`\`\`
┌─────────────────────────────────────────┐
│         Navegador (Frontend)            │
│    Network Traffic Analyzer UI          │
└────────────────┬────────────────────────┘
                 │ fetch()
┌────────────────▼────────────────────────┐
│    Next.js API (/api/packets)           │
│         Route Handlers                  │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
┌───▼──────────────┐  ┌──────▼────────────┐
│  Real Capture    │  │   Mock Generator  │
│  (libpcap)       │  │   (Fallback)      │
│  ✓ Pacotes reais │  │   ✓ Sempre        │
│  ✗ Requer sudo   │  │   ✓ Sem permiss.  │
└─────────────────┘  └───────────────────┘
         │                     │
         └────────────┬────────┘
              ┌──────▼──────┐
              │   Buffer    │
              │ 1000 pkt máx│
              └─────────────┘
\`\`\`

### Componentes Principais

| Arquivo | Função |
|---------|--------|
| `/lib/pcap-handler.ts` | Interface com libpcap (parsing de pacotes) |
| `/lib/packet-capture-hybrid.ts` | Sistema híbrido real/mock com fallback |
| `/app/api/packets/route.ts` | API que expõe dados de captura |
| `/components/network/backend-status.tsx` | Indicador de status (real/mock) |

### Fluxo de Dados

1. **Captura**: Sistema captura pacotes (real ou mock)
2. **Parse**: Extrai headers IPv4/TCP/UDP
3. **Buffer**: Armazena em memória (máx 1000)
4. **API**: Expõe via GET /api/packets
5. **Frontend**: Exibe em dashboard

## 🔧 Configuração

### Modo Híbrido

O sistema tenta usar captura real primeiro:

\`\`\`typescript
// Inicialização automática
await initializeCapture(true)  // true = prefere real
\`\`\`

**Resultado**:
- ✅ Se libpcap disponível + permissões → **REAL MODE**
- ⚠️ Se libpcap ausente ou sem permissões → **MOCK MODE**

### Forçar Modo

\`\`\`typescript
// Para força mock (sem lipcap)
const capture = getPacketCapture()
capture.forceMode("mock")
\`\`\`

## 📊 API Endpoints

### GET `/api/packets?action=packets`

Retorna pacotes capturados:

\`\`\`json
{
  "packets": [
    {
      "id": "pkt-1234567890-abc123",
      "sourceIp": "192.168.1.100",
      "destIp": "8.8.8.8",
      "sourcePort": 54321,
      "destPort": 443,
      "protocol": "TCP",
      "size": 512,
      "latency": 25.3,
      "timestamp": 1704067200000,
      "isSuspicious": false
    }
  ],
  "total": 145,
  "mode": "real",
  "timestamp": 1704067300000
}
\`\`\`

### GET `/api/packets?action=stats`

Estatísticas de tráfego:

\`\`\`json
{
  "stats": {
    "totalPackets": 5234,
    "totalBytes": 2048576,
    "packetsPerSecond": 15.2,
    "bytesPerSecond": 102400,
    "protocolDistribution": {
      "TCP": 3421,
      "UDP": 1813
    },
    "suspiciousCount": 12,
    "activeConnections": 45,
    "captureMode": "real"
  },
  "timestamp": 1704067300000
}
\`\`\`

### GET `/api/packets?action=status`

Status de captura em tempo real:

\`\`\`json
{
  "status": {
    "mode": "real",
    "isActive": true,
    "interface": "en0",
    "packetsCount": 5234,
    "uptime": 3600000,
    "availableInterfaces": ["en0", "en1", "lo0"]
  },
  "timestamp": 1704067300000
}
\`\`\`

## 🔐 Permissões Necessárias

### macOS

\`\`\`bash
# Dar permissão permanente
sudo chmod +r /dev/bpf*
sudo chown $(whoami) /dev/bpf*

# Ou rodar com sudo
sudo npm run dev
\`\`\`

### Linux

\`\`\`bash
# Opção 1: Com sudo (mais fácil)
sudo npm run dev

# Opção 2: Com capabilities (sem sudo)
sudo setcap cap_net_raw=ep $(which node)
npm run dev
\`\`\`

### Windows

Execute PowerShell como **Administrator**

## 📈 Produção

### Vercel (Limitado)

\`\`\`bash
# Deploy no Vercel (usa mock mode)
git push origin main
# ou
vercel deploy
\`\`\`

⚠️ **Limitação**: Vercel é sandboxed, rodará em mock mode

### Servidor Próprio (Recomendado)

Para captura **real** em produção, hospede em servidor próprio:

\`\`\`bash
# DigitalOcean/AWS/Linode
ssh root@seu-servidor

# Setup
apt-get update
apt-get install -y libpcap-dev nodejs npm

# Deploy
git clone seu-repo
cd seu-repo
npm install
npm run build

# PM2 para rodar continuamente
npm install -g pm2
pm2 start "npm run start" --name "analyzer"
pm2 startup
pm2 save
\`\`\`

Veja [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) para detalhes.

## 🐛 Troubleshooting

### Problema: "pcap library not available"

\`\`\`bash
# Instalar libpcap
# macOS:
brew install libpcap

# Linux:
sudo apt-get install libpcap-dev
\`\`\`

### Problema: "Operation not permitted"

\`\`\`bash
# Executar com sudo
sudo npm run dev

# Ou dar permissões
sudo setcap cap_net_raw=ep $(which node)
\`\`\`

### Problema: Rodando em mock quando deveria ser real

\`\`\`bash
# Verificar status
curl http://localhost:3000/api/packets?action=status

# Instalar libpcap + dar permissões + reiniciar
sudo npm run dev
\`\`\`

### Problema: Alto uso de memória

Reduzir buffer em `/lib/packet-capture-hybrid.ts`:

\`\`\`typescript
private maxBufferSize = 500  // de 1000
\`\`\`

## 📖 Documentação Completa

- [REAL_NETWORK_SETUP.md](./REAL_NETWORK_SETUP.md) - Setup detalhado
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Deploy em produção
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Referência de API
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura do sistema

## 🎓 Próximos Passos

1. **Executar verificação**: `node scripts/check-pcap-env.js`
2. **Instalar**: `npm install`
3. **Testar**: `sudo npm run dev`
4. **Deploy**: Seguir [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
5. **Customizar**: Adicionar database, alertas, export

## 📝 Licença

MIT

## 💬 Suporte

- Documentação: Ver arquivos `.md` no root
- Issues: GitHub
- Deployment: Vercel ou servidor próprio (recomendado para real capture)
