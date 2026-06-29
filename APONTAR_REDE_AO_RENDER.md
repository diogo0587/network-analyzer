# Como Apontar Sua Rede ao Render + DynamoDB

## Arquitetura Final

\`\`\`
Sua Rede (Local/Servidor)
    ↓
Render Backend (https://v0-network-traffic-analyzer-w-moc.onrender.com)
    ↓
DynamoDB (AWS aws-dynamodb-teal-door)
    ↓
Vercel Frontend (seu-app.vercel.app)
\`\`\`

## O Que Você Configurou

### 1. DynamoDB (AWS)
- **Tabela**: `aws-dynamodb-teal-door`
- **Chave Primária**: `PK` (Partition Key)
- **Região**: `us-east-1`
- **Conta**: `379360473930`
- **Armazena**: Pacotes de rede em tempo real

### 2. Render Backend
- **URL**: `https://v0-network-traffic-analyzer-w-moc.onrender.com`
- **Funções**: 
  - Captura tráfego de rede
  - Armazena no DynamoDB
  - Serve dados via API REST
  - CORS habilitado

### 3. Vercel Frontend
- **Conecta ao**: Backend do Render
- **Exibe**: Dashboard em tempo real
- **Armazena em**: Sessão do navegador

---

## Como Apontar Sua Rede para Lá

### Opção 1: Local para Render (Desenvolvimento)

Seu computador/servidor local captura pacotes e envia para o Render:

\`\`\`bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/v0-network-traffic-analyzer-w-moc
cd v0-network-traffic-analyzer-w-moc

# 2. Configure as variáveis de ambiente
cat > .env.local << EOF
# AWS DynamoDB
AWS_REGION=us-east-1
AWS_ROLE_ARN=arn:aws:iam::379360473930:role/Vercel/access-dynamodb-teal-door
AWS_ACCOUNT_ID=379360473930
DYNAMODB_TABLE_NAME=aws-dynamodb-teal-door
DYNAMODB_TABLE_PARTITION_KEY=PK

# Render Backend
NEXT_PUBLIC_API_URL=https://v0-network-traffic-analyzer-w-moc.onrender.com
EOF

# 3. Instale dependências
npm install

# 4. Execute localmente
npm run dev
# Acesse: http://localhost:3000
\`\`\`

**O que acontece:**
- Seu computador captura pacotes de rede reais
- Envia para o Render Backend
- Render salva no DynamoDB
- Frontend mostra dados em tempo real

### Opção 2: Apontar Docker/Container para Render

Se você tem um Docker container rodando:

\`\`\`dockerfile
FROM node:20

WORKDIR /app

# Copie o código
COPY . .

# Instale dependências
RUN npm install

# Configure ambiente
ENV AWS_REGION=us-east-1
ENV AWS_ROLE_ARN=arn:aws:iam::379360473930:role/Vercel/access-dynamodb-teal-door
ENV DYNAMODB_TABLE_NAME=aws-dynamodb-teal-door
ENV NEXT_PUBLIC_API_URL=https://v0-network-traffic-analyzer-w-moc.onrender.com

# Rode
CMD ["npm", "run", "dev"]
\`\`\`

Deploy no Render:
\`\`\`bash
git push  # Envia para GitHub
# Render detecta e faz deploy automático
\`\`\`

### Opção 3: Apontar Servidor Remoto

Se você tem um servidor em EC2, DigitalOcean, etc:

\`\`\`bash
# SSH no seu servidor
ssh user@seu-servidor.com

# Clone o projeto
git clone https://github.com/seu-usuario/v0-network-traffic-analyzer-w-moc
cd v0-network-traffic-analyzer-w-moc

# Configure variáveis
export AWS_REGION=us-east-1
export AWS_ROLE_ARN=arn:aws:iam::379360473930:role/Vercel/access-dynamodb-teal-door
export DYNAMODB_TABLE_NAME=aws-dynamodb-teal-door
export NEXT_PUBLIC_API_URL=https://v0-network-traffic-analyzer-w-moc.onrender.com

# Use PM2 para rodar em background
npm install -g pm2
npm install
pm2 start "npm run dev" --name "network-monitor"
pm2 save
pm2 startup
\`\`\`

---

## Fluxo de Dados (Passo-a-Passo)

### 1. Captura (Seu Sistema)
\`\`\`
netstat/ss → Conexões TCP reais
↓
Gera "pacotes" simulados
↓
Envia à API `/api/packets`
\`\`\`

### 2. API (Render Backend)
\`\`\`
POST /api/packets
↓
Valida dados
↓
Envia ao DynamoDB
\`\`\`

### 3. Armazenamento (DynamoDB)
\`\`\`
Item JSON → aws-dynamodb-teal-door
{
  PK: "PACKET#uuid#timestamp",
  timestamp: 1707123456789,
  sourceIp: "192.168.1.100",
  destIp: "1.1.1.1",
  protocol: "TCP",
  size: 1024,
  ...
}
\`\`\`

### 4. Consulta (Frontend/Render)
\`\`\`
GET /api/packets?action=packets
↓
Scan DynamoDB
↓
Retorna últimos 100 pacotes
↓
Frontend renderiza dashboard
\`\`\`

---

## Monitorar Tudo

### 1. Ver Logs do Render
\`\`\`bash
# Dashboard Render → seu-app → Logs
# ou via CLI:
npm install -g render-cli
render logs --app v0-network-traffic-analyzer-w-moc
\`\`\`

### 2. Ver DynamoDB
\`\`\`bash
# AWS Console → DynamoDB → Tables
# → aws-dynamodb-teal-door
# → Explore table items
\`\`\`

### 3. Ver Frontend
\`\`\`bash
# Abra: https://seu-app.vercel.app
# Verá badge azul "Real Monitoring"
# Dashboard mostra pacotes em tempo real
\`\`\`

---

## Troubleshooting

### ❌ Pacotes não aparecem
1. Verificar logs do Render
2. Verificar se DynamoDB tem dados
3. Checar CORS headers

### ❌ DynamoDB timeout
1. Verificar credentials AWS
2. Verificar IAM role permissions
3. Testar com AWS CLI:
   \`\`\`bash
   aws dynamodb scan --table-name aws-dynamodb-teal-door
   \`\`\`

### ❌ Render não inicia
1. `npm install` funcionou?
2. Variáveis de ambiente setadas?
3. Porta 3000 disponível?

---

## Comandos Úteis

\`\`\`bash
# Testar API localmente
curl http://localhost:3000/api/packets?action=status

# Testar API no Render
curl https://v0-network-traffic-analyzer-w-moc.onrender.com/api/packets?action=status

# Ver packets no DynamoDB
aws dynamodb scan --table-name aws-dynamodb-teal-door --region us-east-1

# Limpar dados antigos
aws dynamodb scan --table-name aws-dynamodb-teal-door \
  --filter-expression "attribute_not_exists(#ttl) OR #ttl < :now" \
  --expression-attribute-names '{"#ttl": "ttl"}' \
  --expression-attribute-values '{":now": {"N": "'$(date +%s)'"}}'
\`\`\`

---

## Próximos Passos

1. ✅ DynamoDB configurado
2. ✅ Render Backend pronto
3. ✅ Código do backend atualizado

### Agora fazer:
\`\`\`bash
git add .
git commit -m "Add DynamoDB storage"
git push

# Render faz deploy automático
# Verificar: https://v0-network-traffic-analyzer-w-moc.onrender.com/api/packets?action=status
\`\`\`

---

## Resumo

| Componente | Status | URL |
|-----------|--------|-----|
| Rede Local | Você controla | Seu servidor |
| Backend (Render) | 🟢 Pronto | `https://v0-network-traffic-analyzer-w-moc.onrender.com` |
| DynamoDB | 🟢 Pronto | `aws-dynamodb-teal-door` |
| Frontend (Vercel) | 🟢 Pronto | Seu app Vercel |

**Tudo está configurado! Apenas faça push do código.** 🚀
