# 📊 Visual Guide - Network Traffic Analyzer

## Como Tudo Se Conecta

### 1. O Que Acontece Quando Você Abre http://localhost:3000

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│  1. Browser carrega página                                      │
│     http://localhost:3000                                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
         ┌─────────────────────────────┐
         │  Next.js renderiza app      │
         │  /app/page.tsx              │
         └────────┬────────────────────┘
                  │
                  ▼
      ┌───────────────────────────────┐
      │  Componentes carregam hooks   │
      │  use-packet-stream.ts         │
      │  use-backend-packets.ts       │
      └────────┬────────────────────┘
               │
               ▼
    ┌────────────────────────────────┐
    │  Fazem polling à API           │
    │  GET /api/packets              │
    │  GET /api/packets?action=stats │
    └────────┬─────────────────────┘
             │
             ▼
   ┌──────────────────────────────────┐
   │  Backend inicializa captura      │
   │  app/api/packets/route.ts        │
   │  - Carrega libpcap               │
   │  - Tenta modo real               │
   │  - Fallback para mock            │
   └────────┬──────────────────────┘
            │
            ▼
  ┌────────────────────────────────────┐
  │  Retorna pacotes capturados        │
  │  Frontend renderiza dashboard      │
  └────────┬─────────────────────────┘
           │
           ▼
┌───────────────────────────────────────┐
│  Dashboard atualizado a cada 500ms    │
│  - Lista de pacotes                   │
│  - Gráficos                           │
│  - Estatísticas                       │
└───────────────────────────────────────┘
\`\`\`

## 2. Fluxo de Captura de Pacotes

\`\`\`
SISTEMA OPERACIONAL
        │
        ▼ (tráfego de rede real)
   ┌─────────────────────────────┐
   │  /dev/bpf* (macOS/Linux)    │
   │  ou Npcap (Windows)         │
   └──────────┬──────────────────┘
              │
              ▼ (requires libpcap)
   ┌─────────────────────────────────────┐
   │  lib/pcap-handler.ts                │
   │  ├─ parseEthernet()                 │
   │  ├─ parseIPv4()                     │
   │  ├─ parseTCP()                      │
   │  ├─ parseUDP()                      │
   │  └─ detectAnomalies()               │
   └──────────┬──────────────────────────┘
              │
              ▼
   ┌──────────────────────────────────────────┐
   │  lib/packet-capture-hybrid.ts           │
   │  ├─ Armazena em buffer (max 1000)       │
   │  ├─ Alterna real ↔ mock se necessário   │
   │  └─ Fornece API para dados             │
   └──────────┬───────────────────────────┘
              │
              ▼
   ┌──────────────────────────────────────────┐
   │  app/api/packets/route.ts               │
   │  ├─ GET ?action=packets                 │
   │  ├─ GET ?action=stats                   │
   │  ├─ GET ?action=status                  │
   │  └─ GET ?action=connections             │
   └──────────┬───────────────────────────┘
              │
              ▼
   ┌──────────────────────────────────────────┐
   │  JSON Response                          │
   │  {                                      │
   │    "packets": [...],                    │
   │    "mode": "real",                      │
   │    "timestamp": 1234567890              │
   │  }                                      │
   └──────────┬───────────────────────────┘
              │
              ▼
   ┌──────────────────────────────────────────┐
   │  Frontend                               │
   │  ├─ PacketStream (lista de pacotes)     │
   │  ├─ StatisticsChart (gráficos)          │
   │  ├─ ThreatAlerts (alertas)              │
   │  └─ BackendStatus (modo real/mock)      │
   └──────────────────────────────────────────┘
\`\`\`

## 3. Estrutura de um Pacote Capturado

\`\`\`
┌─ Raw Buffer (from network) ─┐
│                              │
├─ Ethernet Frame [14 bytes]   │
│  ├─ Dest MAC (6 bytes)       │
│  ├─ Src MAC (6 bytes)        │
│  └─ Type = 0x0800 (2 bytes)  │
│                              │
├─ IPv4 Header [20+ bytes]     │
│  ├─ Version (4 bits)         │
│  ├─ Header Length (4 bits)   │
│  ├─ Total Length (2 bytes)   │
│  ├─ TTL (1 byte)             │
│  ├─ Protocol (1 byte)        │
│  │  ├─ 6 = TCP              │
│  │  └─ 17 = UDP             │
│  ├─ Src IP (4 bytes)         │
│  └─ Dst IP (4 bytes)         │
│                              │
├─ TCP/UDP Header [8+ bytes]   │
│  ├─ Src Port (2 bytes)       │
│  ├─ Dst Port (2 bytes)       │
│  └─ (more...)                │
│                              │
└─ Payload ─────────────────┘

         ▼ (parsed by lib/pcap-handler.ts)

┌─────────────────────────────────────┐
│  PacketHeader Object:               │
│  {                                  │
│    id: "pkt-123...",                │
│    sourceIp: "192.168.1.100",       │
│    destIp: "8.8.8.8",               │
│    sourcePort: 54321,               │
│    destPort: 443,                   │
│    protocol: "TCP",                 │
│    size: 512,                       │
│    latency: 25.3,                   │
│    timestamp: 1704067200000,        │
│    isSuspicious: false,             │
│    location: {...}                  │
│  }                                  │
└─────────────────────────────────────┘
\`\`\`

## 4. Decisão de Modo (Real vs Mock)

\`\`\`
┌─────────────────────────────────────┐
│  initializeCaptureOnce()            │
│  (em /app/api/packets/route.ts)    │
└────────────┬────────────────────────┘
             │
             ▼
    ┌────────────────────────┐
    │  Tenta importar pcap   │
    │  require("pcap")       │
    └────────┬───────────────┘
             │
       ┌─────┴─────┐
       │           │
       ▼           ▼
   Sucesso     Falha
      │           │
      ▼           ▼
┌─────────┐   ┌──────────────┐
│ REAL    │   │ Tenta criar  │
│ MODE    │   │ session pcap │
│         │   └────┬────────┘
│ Usa     │        │
│ pcap    │   ┌────┴──────┐
│para     │   │           │
│capturar │   ▼           ▼
│packets  │ Sucesso  Falha (sem permissão)
│reais    │   │           │
└─────────┘   ▼           ▼
          Real Mode    ┌──────────────┐
          continua     │ MOCK MODE    │
                       │              │
                       │ Usa          │
                       │ generatePkt()│
                       │ para simular │
                       │ pacotes      │
                       └──────────────┘

    RESULT: Sempre funciona! ✅
    - Real captura: dados verdadeiros
    - Mock fallback: dados simulados
\`\`\`

## 5. Dashboard em Tempo Real

\`\`\`
┌────────────────────────────────────────────────────┐
│  Network Traffic Analyzer Dashboard                │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────┐  [Real Capture] Status: OK  │
│  │ Stats Overview   │                             │
│  │                  │  ─────────────────────────  │
│  │ Total Packets: 5234 Pkt/s: 15.2                │
│  │ Total Bytes: 2MB  Bytes/s: 102KB               │
│  │ Connections: 45   Suspicious: 12               │
│  └──────────────────┘                             │
│                                                    │
│  ┌────────────────────────────────────────────┐   │
│  │ Packet Stream (Live)                       │   │
│  ├────────────────────────────────────────────┤   │
│  │ TCP  192.168.1.100:54321 → 8.8.8.8:443     │   │
│  │      ↳ 512 bytes | 25ms latency            │   │
│  │                                             │   │
│  │ UDP  10.0.0.5:5353 → 224.0.0.251:5353      │   │
│  │      ↳ 64 bytes | 2ms latency              │   │
│  │                                             │   │
│  │ TCP  192.168.1.100:443 → 140.82.114.4:443  │   │
│  │      ↳ Suspicious! 1024 bytes | 30ms       │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  ┌──────────────┐  ┌─────────────────────────┐   │
│  │ Protocols    │  │ Statistics Chart        │   │
│  │              │  │                         │   │
│  │ TCP:  3421   │  │ ├─ TCP 65%             │   │
│  │ UDP:  1813   │  │ ├─ UDP 35%             │   │
│  │              │  │ └─ Other 0%            │   │
│  └──────────────┘  └─────────────────────────┘   │
│                                                    │
└────────────────────────────────────────────────────┘
\`\`\`

## 6. Fluxo de Dados - Polling

\`\`\`
Frontend                        Backend
   │                               │
   │─── fetch(/api/packets) ──────>│
   │    (a cada 500ms)             │ Pacotes capturados
   │                               │ desde última chamada
   │                               │
   │<─ JSON response ───────────────│
   │    {                           │
   │      packets: [...]           │
   │      mode: "real"             │
   │      timestamp: 1234567890    │
   │    }                          │
   │                               │
   │ Atualiza estado              │
   │ (re-render)                  │
   │                               │
   │─── fetch(/api/packets) ──────>│ (repetir)
   │    (próxima chamada)          │
   │                               │
\`\`\`

## 7. Componentes e Hierarquia

\`\`\`
<Page> (app/page.tsx)
  │
  ├─ <Header>
  │  └─ <BackendStatus>         ← Mostra Real/Mock
  │  └─ Buttons (Pause, Clear)
  │
  ├─ <Tabs>
  │  ├─ "Packets" Tab
  │  │  └─ <PacketStream>       ← Lista de pacotes
  │  │     └─ <PacketDetailModal>
  │  │
  │  ├─ "Statistics" Tab
  │  │  └─ <AdvancedStatsDashboard>
  │  │     ├─ <StatisticsChart> ← Gráficos
  │  │     ├─ <BandwidthMeter>
  │  │     └─ <ThreatAlerts>
  │  │
  │  └─ "Map" Tab
  │     └─ <TrafficMap>         ← Mapa do mundo
  │
  └─ Hooks
     ├─ usePacketStream()       ← Gerencia dados
     ├─ useTrafficStats()       ← Calcula estatísticas
     └─ useThreatDetection()    ← Detecta anomalias
\`\`\`

## 8. Arquivos Importantes

\`\`\`
Project Structure:

/app
  ├── page.tsx                    ← Main dashboard
  ├── layout.tsx                  ← Layout root
  ├── globals.css                 ← Tailwind config
  └── api/
      └── packets/
          └── route.ts            ← API que captura pacotes

/lib
  ├── pcap-handler.ts            ← Parsing de pacotes
  ├── packet-capture-hybrid.ts   ← Real/Mock inteligente
  ├── packet-generator.ts         ← Mock data generator
  └── types.ts                    ← TypeScript tipos

/hooks
  ├── use-packet-stream.ts        ← Gerencia stream
  ├── use-backend-packets.ts      ← Busca de API
  ├── use-traffic-stats.ts        ← Estatísticas
  └── use-threat-detection.ts     ← Detecção

/components/network
  ├── backend-status.tsx          ← Status real/mock
  ├── packet-stream.tsx           ← Lista de pacotes
  ├── statistics-chart.tsx        ← Gráficos
  ├── threat-alerts.tsx           ← Alertas
  └── (+ 10 outros componentes)

/scripts
  └── check-pcap-env.js          ← Verificação setup
\`\`\`

## 9. Estados da Aplicação

\`\`\`
Inicialização
    │
    ▼
┌─────────────────────────┐
│ Verifica libpcap        │
│ Carrega pcap npm module │
└────┬────────────────────┘
     │
     ├─ Sucesso ──────┐
     │                ▼
     │            ┌────────────────┐
     │            │ REAL MODE      │
     │            │ Captura real   │
     │            │ libpcap        │
     │            └────────────────┘
     │
     └─ Falha ────┐
                  ▼
              ┌────────────────┐
              │ MOCK MODE      │
              │ Simulado       │
              │ generatePkt()  │
              └────────────────┘

Status Runtime:
  - isActive: boolean
  - packetCount: number
  - uptime: number
  - interface: string
  - availableInterfaces: string[]
\`\`\`

## 10. Diagrama de Erro e Recovery

\`\`\`
┌──────────────────────────────┐
│  Erro ao capturar pacotes    │
│  (ex: sem libpcap)           │
└────────┬─────────────────────┘
         │
         ▼
   ┌──────────────────┐
   │  Log erro        │
   │  [v0] Failed to  │
   │  initialize pcap │
   └────┬─────────────┘
        │
        ▼
   ┌─────────────────┐
   │  Fallback       │
   │  para mock      │
   └────┬────────────┘
        │
        ▼
   ┌───────────────────────────────┐
   │  Aplicação continua rodando   │
   │  Com dados simulados          │
   │  Sem interrupção ✅           │
   └───────────────────────────────┘

Resultado: Sistema é robusto!
- Falha gradualmente
- Sempre tem fallback
- Usuário não vê erro
\`\`\`

---

**Isso é um resumo visual de como tudo funciona!** 

Para detalhes técnicos, veja:
- [README_PRODUCTION.md](./README_PRODUCTION.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [REAL_NETWORK_SETUP.md](./REAL_NETWORK_SETUP.md)
