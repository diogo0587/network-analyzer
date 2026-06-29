# Network Traffic Analyzer - Real Packet Capture Setup

## Visão Geral

Este guia ajuda você a configurar o Network Traffic Analyzer para capturar pacotes **reais** da sua rede usando `pcap`. O sistema funcionará em modo **híbrido**: tentará usar captura real e fará fallback para mock se não disponível.

## Pré-requisitos

### Dependências do Sistema

O pcap requer bibliotecas do sistema e permissões de root/admin:

#### macOS
\`\`\`bash
# Usando Homebrew
brew install libpcap

# Verificar instalação
pcap-config --version
\`\`\`

#### Ubuntu/Debian
\`\`\`bash
# Instalar dependências
sudo apt-get update
sudo apt-get install libpcap-dev build-essential

# Verificar instalação
dpkg -l | grep libpcap
\`\`\`

#### Windows
\`\`\`bash
# Baixar WinPcap ou Npcap
# https://npcap.com/

# Ou via Chocolatey
choco install npcap
\`\`\`

### Node.js

Versão mínima: Node.js 16.x

\`\`\`bash
node --version  # deve ser v16 ou superior
\`\`\`

## Instalação

### 1. Instalar Dependências npm

\`\`\`bash
npm install
# ou
yarn install
\`\`\`

A biblioteca `pcap` será instalada automaticamente.

### 2. Verificar Interfaces de Rede

\`\`\`bash
# macOS/Linux
ifconfig

# ou use este script para ver interfaces disponíveis
node -e "console.log(require('os').networkInterfaces())"
\`\`\`

### 3. Verificar Permissões

Para capturar pacotes, você precisa de permissões elevadas:

#### macOS
\`\`\`bash
# Dar permissões ao Node.js (uma vez)
sudo chmod +r /dev/bpf*
sudo chown $(whoami) /dev/bpf*
\`\`\`

#### Linux
\`\`\`bash
# Executar com sudo ou dar permissões CAP
sudo npm run dev

# OU (alternativa - sem sudo)
sudo setcap cap_net_raw=ep $(which node)
npm run dev
\`\`\`

#### Windows
Execute o terminal do PowerShell como **Administrator**

## Execução

### Desenvolvimento

\`\`\`bash
# Com sudo (Linux) ou permissões de admin (Windows/macOS)
npm run dev

# Ou em modo mock se não quiser permissões de root
npm run dev -- --mock-only
\`\`\`

### Produção

\`\`\`bash
# Build
npm run build

# Deploy no Vercel (recomendado)
vercel deploy

# Ou execute localmente com permissões
sudo npm run start
\`\`\`

## Como Funciona

### Modo Híbrido

1. **Inicialização**: Ao iniciar, o sistema tenta carregar e usar pcap
2. **Real Capture**: Se bem-sucedido, captura pacotes reais da rede
3. **Fallback**: Se falhar (ex: sem permissões), muda automaticamente para mock
4. **Status**: Acesse o painel para ver qual modo está ativo

### Componentes

- **`/lib/pcap-handler.ts`**: Interface com biblioteca pcap
- **`/lib/packet-capture-hybrid.ts`**: Sistema híbrido real/mock
- **`/app/api/packets/route.ts`**: API que gerencia captura

## Informações de Captura

### Endpoint: GET `/api/packets?action=status`

Retorna informações sobre captura ativa:

\`\`\`json
{
  "status": {
    "mode": "real",
    "isActive": true,
    "interface": "en0",
    "packetsCount": 15234,
    "uptime": 300000,
    "availableInterfaces": ["en0", "en1", "lo0"]
  },
  "timestamp": 1234567890
}
\`\`\`

### Modos

- **`"real"`**: Capturando pacotes reais via pcap
- **`"mock"`**: Usando gerador de pacotes simulado

## Dados Capturados

Cada pacote inclui:

\`\`\`typescript
{
  id: string                          // ID único do pacote
  sourceIp: string                    // IP de origem (ex: 192.168.1.100)
  destIp: string                      // IP de destino
  sourcePort: number                  // Porta de origem
  destPort: number                    // Porta de destino
  protocol: "TCP" | "UDP" | "Other"   // Protocolo
  size: number                        // Tamanho em bytes
  latency: number                     // Latência em ms
  timestamp: number                   // Timestamp Unix
  isSuspicious: boolean               // Flag de anomalia
  location: {                         // Localização geográfica
    country: string
    city: string
    latitude: number
    longitude: number
  }
}
\`\`\`

## Detecção de Anomalias

O sistema detecta automaticamente:

- Conexões em portas suspeitas (23, 21, 445, 135, 139)
- Tráfego fragmentado + portas incomuns
- Padrões de conexão anormais

## Troubleshooting

### Problema: "pcap library not available"

**Solução**: Instale as dependências do sistema (libpcap-dev, etc.)

\`\`\`bash
# Linux
sudo apt-get install libpcap-dev

# macOS
brew install libpcap
\`\`\`

### Problema: "Operation not permitted"

**Solução**: Permissões de root necessárias

\`\`\`bash
# Linux
sudo npm run dev
# ou
sudo setcap cap_net_raw=ep $(which node)
npm run dev

# macOS
sudo npm run dev

# Windows
# Execute o terminal como Administrator
npm run dev
\`\`\`

### Problema: Nenhum pacote sendo capturado

**Solução**: Interface de rede pode estar errada

\`\`\`bash
# Verifique interfaces disponíveis
node -e "const pcap = require('pcap'); console.log(pcap.findalldevs())"

# Ou use a interface "lo" para teste local
# Gere tráfego: curl http://localhost:3000
\`\`\`

### Problema: App rodando em modo mock

Verifique:
1. Permissões de root (execute com `sudo`)
2. Libpcap instalada (`pcap-config --version`)
3. Interface de rede disponível (`ifconfig`)

## Performance

- **Captura**: ~300-500 pacotes/segundo máximo
- **Buffer**: Máximo 1000 pacotes armazenados
- **Conexões**: Máximo 100 conexões ativas

Para aplicações em larga escala, considere:
- Database para persistência (PostgreSQL, MongoDB)
- Message queue (RabbitMQ, Kafka)
- Time-series DB (InfluxDB, Prometheus)

## Próximos Passos

1. **Integração com Database**: Persistir dados em PostgreSQL/MongoDB
2. **Alertas em Tempo Real**: WebSocket para notificações
3. **Análise com IA**: Detecção de ameaças com ML
4. **Export de Dados**: CSV, JSON, PCAP

## Referências

- [libpcap documentation](https://www.tcpdump.org/papers/sniffing-faq.html)
- [npm pcap package](https://www.npmjs.com/package/pcap)
- [Network packet structure](https://en.wikipedia.org/wiki/Network_packet)
- [IEEE 802.3 Ethernet](https://en.wikipedia.org/wiki/Ethernet_frame)
