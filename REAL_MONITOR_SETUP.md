# Real Network Monitor Setup

## O Que Mudou

Agora você tem um **monitor de rede real** que funciona em qualquer servidor sem precisar de pcap. Em vez disso, usa ferramentas nativas do sistema:

- **Linux/macOS**: `ss` ou `netstat`
- **Windows**: `netstat`

## Como Funciona

\`\`\`
┌─────────────────────────────────────────────┐
│         Node.js Backend Server              │
│  ┌──────────────────────────────────┐      │
│  │  Real Network Monitor            │      │
│  │  ├─ Executa netstat/ss           │      │
│  │  ├─ Parse conexões TCP reais     │      │
│  │  ├─ Converte em PacketHeader     │      │
│  │  └─ Armazena 500 últimos         │      │
│  └──────────────────────────────────┘      │
└──────────────┬───────────────────────────────┘
               │
       /api/packets endpoint
               │
     ┌─────────▼──────────┐
     │  Frontend React    │
     │  ├─ Dashboard      │
     │  ├─ Charts         │
     │  └─ Real-time data │
     └───────────────────┘
\`\`\`

## Instalação

### 1. Verificar Sistema
\`\`\`bash
# Linux
ss --version    # ou netstat -V
netstat -an | head

# macOS
netstat -an | head

# Windows
netstat -ano | findstr ESTABLISHED
\`\`\`

### 2. Rodar Aplicação
\`\`\`bash
npm install
npm run dev
\`\`\`

### 3. Acessar Dashboard
Abra: http://localhost:3000

O monitor automaticamente:
- ✅ Detecta seu SO
- ✅ Captura conexões TCP reais
- ✅ Mostra estatísticas ao vivo
- ✅ Identifica padrões suspeitos

## Como Funciona Internamente

### `/lib/real-network-monitor.ts`
Principal classe que:
1. Executa `ss` ou `netstat` a cada 2 segundos
2. Parse output e extrai:
   - IP origem/destino
   - Porta origem/destino
   - Estado da conexão (ESTABLISHED, etc)
   - Process ID (quando disponível)
3. Converte para `PacketHeader` objects
4. Armazena em buffer com limite de 500 pacotes

### `/app/api/packets/route.ts`
API endpoints para frontend:
- `?action=packets` - Lista pacotes capturados
- `?action=stats` - Estatísticas (bytes, PPS, distribuição)
- `?action=connections` - Conexões ativas
- `?action=status` - Status do monitor

## Dados Capturados

Cada "pacote" contém:
\`\`\`typescript
{
  id: string                    // Unique ID
  sourceIp: string              // IP origem (real)
  sourcePort: number            // Porta origem (real)
  destIp: string                // IP destino (real)
  destPort: number              // Porta destino (real)
  protocol: "TCP" | "UDP"       // Protocolo
  size: number                  // Tamanho estimado
  timestamp: number             // Quando foi capturado
  isSuspicious: boolean         // Detecta anomalias
  threatLevel: "low"|"medium"|"high"
  ttl: number                   // Time To Live
}
\`\`\`

## Detecção de Anomalias

O monitor detecta automaticamente:
- ✅ Portas suspeitas (4444, 5555, 6666, 7777, 8888, 9999, 31337)
- ✅ IPs especiais (0.0.0.0, 255.255.255.255)
- ✅ Padrões de port scanning (portas >60000)
- ✅ Comportamentos anormais

## Limitações e Notas

1. **Não requer sudo/admin** na maioria dos casos
2. **Mostra apenas TCP** (não UDP raw packets)
3. **Não decodifica payloads** (apenas headers)
4. **Limite de 500 pacotes** em buffer (configurável)
5. **Intervalo de 2 segundos** entre capturas (configurável)

## Para Aumentar Permissões (se necessário)

\`\`\`bash
# Linux - se netstat não tiver acesso total
sudo setcap cap_net_admin=ep /usr/bin/ss
sudo setcap cap_net_admin=ep /bin/netstat

# Ou rodar com sudo
sudo npm run dev
\`\`\`

## Customizar

Edite `/lib/real-network-monitor.ts`:

\`\`\`typescript
// Linha 20: Mudar intervalo de captura
this.monitorInterval = setInterval(() => {
  this.captureNetworkData()
}, 2000)  // ← Mude para 1000 (1s) ou 5000 (5s)

// Linha 21: Mudar tamanho do buffer
private maxPackets = 500      // ← Mude para 1000, 2000, etc
private maxConnections = 100  // ← Mude para 200, 500, etc
\`\`\`

## Troubleshooting

### "No packets showing"
- Verifique se há tráfego real (abra sites, faça downloads)
- Verifique se `netstat` ou `ss` funciona:
  \`\`\`bash
  netstat -an | grep ESTABLISHED
  # ou
  ss -tun | grep ESTAB
  \`\`\`

### "Command not found: ss"
- Instale: `sudo apt install net-tools`
- Ou use `netstat` (fallback automático)

### "Permission denied"
- Execute com sudo: `sudo npm run dev`
- Ou configure capabilities (veja acima)

### "Muito lento"
- Aumente intervalo para 5000ms
- Reduza limite de pacotes para 200

## Próximos Passos

Para captura ainda mais avançada:
1. Integrar com Wireshark API
2. Adicionar análise de payloads
3. Usar tcpdump com parsing em tempo real
4. Integrar com sistemas de IDS (Suricata, Zeek)
5. Armazenar em banco de dados persistente

## Arquivos Modificados

- `/lib/real-network-monitor.ts` - ✨ Novo (Monitor principal)
- `/app/api/packets/route.ts` - Atualizado (Usa novo monitor)
- `/components/network/backend-status.tsx` - Atualizado (Mostra status)

## Feedback

Se o monitor não está funcionando:
1. Verifique os logs: `npm run dev` - procure por "[v0]"
2. Teste o endpoint: `curl http://localhost:3000/api/packets?action=status`
3. Verifique permissões: `netstat -an | head`
