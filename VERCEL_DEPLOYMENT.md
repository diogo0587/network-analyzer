# Deployment no Vercel - Network Traffic Analyzer

## Importante: Limitações do Vercel

O Vercel tem restrições de segurança que afetam a captura de pacotes reais:

1. **Sem acesso a dispositivos de rede**: Vercel não permite acesso direto a `/dev/bpf*` ou interfaces de rede
2. **Sem permissões de root**: Seu código roda em um ambiente sandboxed
3. **Runtime limitado**: Máximo 30 segundos por requisição
4. **Função serverless**: Sem estado compartilhado entre requisições

### Resultado

**Em produção no Vercel, o sistema automaticamente usa MOCK MODE** (gerador simulado de pacotes).

## Deployment Local (Recomendado para Produção Real)

Se você quer captura **real de pacotes em produção**, hospede em um servidor próprio:

### Opção 1: DigitalOcean/Linode/AWS EC2

#### 1. Provisionar servidor Ubuntu

\`\`\`bash
# Conectar ao servidor
ssh root@seu-servidor-ip

# Atualizar sistema
apt-get update
apt-get upgrade -y

# Instalar dependências
apt-get install -y curl git build-essential libpcap-dev
\`\`\`

#### 2. Instalar Node.js

\`\`\`bash
# Usar nvm (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Instalar Node.js
nvm install 18
nvm use 18
node --version
\`\`\`

#### 3. Deploy da aplicação

\`\`\`bash
# Clonar repositório
git clone seu-repositorio
cd seu-repositorio

# Instalar dependências
npm install

# Build
npm run build

# Executar com PM2 (recomendado)
npm install -g pm2

# Iniciar aplicação
pm2 start "npm run start" --name "network-analyzer"
pm2 startup
pm2 save

# Verificar status
pm2 status
\`\`\`

#### 4. Nginx como reverse proxy

\`\`\`bash
# Instalar Nginx
apt-get install -y nginx

# Criar configuração
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Validar e recarregar
nginx -t
systemctl restart nginx
\`\`\`

#### 5. SSL com Let's Encrypt (opcional)

\`\`\`bash
# Instalar Certbot
apt-get install -y certbot python3-certbot-nginx

# Obter certificado
certbot --nginx -d seu-dominio.com

# Auto-renovação
systemctl enable certbot.timer
\`\`\`

### Opção 2: Docker

#### Dockerfile

\`\`\`dockerfile
FROM node:18-alpine

# Instalar libpcap
RUN apk add --no-cache libpcap-dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
\`\`\`

#### docker-compose.yml

\`\`\`yaml
version: '3.8'

services:
  network-analyzer:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    cap_add:
      - NET_RAW      # Necessário para captura de pacotes
    volumes:
      - /dev:/dev    # Acesso aos dispositivos de rede
    restart: always
\`\`\`

#### Deploy com Docker

\`\`\`bash
# Build e run
docker-compose up -d

# Verificar logs
docker-compose logs -f

# Parar
docker-compose down
\`\`\`

### Opção 3: Vercel + Backend Externo

Use Vercel para a UI (frontend) e um servidor externo para captura:

#### 1. API externa em seu servidor

\`\`\`typescript
// seu-servidor.com/api/packets
async function GET(req, res) {
  const capture = getPacketCapture()
  const packets = capture.getPackets(50, 0)
  res.json({ packets })
}
\`\`\`

#### 2. Atualizar frontend para usar API externa

\`\`\`typescript
// /hooks/use-backend-packets.ts
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"

export function useBackendPackets() {
  return useSWR(`${API_URL}/api/packets`)
}
\`\`\`

#### 3. Environment variables no Vercel

\`\`\`
NEXT_PUBLIC_BACKEND_URL=https://seu-servidor.com
\`\`\`

## Monitoramento em Produção

### PM2 Monitoring

\`\`\`bash
# Instalar módulo de monitoramento
pm2 install pm2-auto-pull

# Dashboard web
pm2 web

# Acessar em: http://localhost:9615
\`\`\`

### Logs

\`\`\`bash
# Ver logs em tempo real
pm2 logs network-analyzer

# Salvar em arquivo
pm2 logs network-analyzer > app.log

# Com rotação
pm2 install pm2-logrotate
\`\`\`

### Alertas

\`\`\`bash
# Configurar alerta se app crash
pm2 install pm2-notify

# Ou use Sentry para produção
npm install @sentry/node
\`\`\`

## Perguntas Frequentes

### P: Posso usar pacap no Vercel?
R: Não. Vercel é serverless e sandboxed. Use um servidor próprio.

### P: Qual é a diferença entre local e Vercel?
R: Local captura pacotes reais. Vercel usa mock (simulado).

### P: Como escalar para millions de pacotes?
R: Use banco de dados (PostgreSQL) + message queue (Redis/Kafka).

### P: Preciso de static IP?
Recomendado se quer acessar sempre o mesmo servidor.

## Checklist de Deployment

- [ ] Servidor Ubuntu/CentOS com libpcap instalado
- [ ] Node.js 16+ instalado
- [ ] Repositório clonado
- [ ] npm install executado
- [ ] npm run build bem-sucedido
- [ ] npm run start funcionando localmente
- [ ] PM2 configurado para auto-start
- [ ] Nginx configurado como reverse proxy
- [ ] Firewall permite porta 80/443
- [ ] SSL/TLS certificado instalado
- [ ] Backups configurados
- [ ] Monitoramento ativo
- [ ] Logs sendo coletados

## Troubleshooting

### Problema: "Operation not permitted" no servidor

\`\`\`bash
# Dar permissões CAP ao Node.js
sudo setcap cap_net_raw=ep /home/seu-usuario/.nvm/versions/node/v18.0.0/bin/node

# Ou rodar com sudo (menos recomendado)
sudo npm run start
\`\`\`

### Problema: Muita memória/CPU sendo usada

Reduza buffer:

\`\`\`typescript
// lib/packet-capture-hybrid.ts
private maxBufferSize = 500  // Reduzir de 1000
\`\`\`

### Problema: App crashes aleatoriamente

\`\`\`bash
# Aumentar memória do PM2
pm2 start "npm run start" --name "analyzer" -i max --max-memory-restart 500M
\`\`\`

## Custo Estimado

| Opção | Custo/mês | Capacidade |
|-------|-----------|-----------|
| DigitalOcean Droplet | $5 | Pequeno/médio |
| AWS EC2 t3.micro | $9 | Pequeno |
| Linode 1GB | $5 | Pequeno/médio |
| Vercel (frontend só) | $0-20 | Ilimitado* |

*Com backend externo

## Próximos Passos

1. Escolher opção de deployment
2. Provisionar servidor
3. Executar check-pcap-env.js
4. Deploy e testar
5. Configurar monitoramento
6. Adicionar backup/disaster recovery
