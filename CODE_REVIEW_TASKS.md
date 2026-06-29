# Tarefas sugeridas após revisão de código

## 1) Corrigir erro de digitação (typo)
**Problema encontrado:** em `lib/api-config.ts`, a constante `LOCAL_URL` possui uma aspa dupla extra no final da string (`...onrender.com""`), gerando erro de parsing.

**Impacto:** quebra de build com `Unterminated string constant`.

**Tarefa sugerida:**
- Remover a aspa extra na definição de `LOCAL_URL`.
- Rodar `npm run build` para validar que o erro de parsing foi eliminado.

---

## 2) Corrigir bug funcional
**Problema encontrado:** em `hooks/use-packet-stream.ts`, o estado só é atualizado quando `backendPackets.length > 0`.

**Impacto:** quando o backend retorna lista vazia, a UI mantém pacotes antigos (estado “congelado”), em vez de refletir que não há pacotes.

**Tarefa sugerida:**
- Atualizar o efeito para sempre despachar `SET_PACKETS` quando `backendPackets` mudar (inclusive array vazio).
- Garantir que a lista filtrada seja limpa corretamente quando não houver dados.

---

## 3) Ajustar comentário/discrepância de documentação
**Problema encontrado:** o comentário `// Local development` em `lib/api-config.ts` não condiz com o valor atual de `LOCAL_URL`, que aponta para o domínio do Render (ambiente remoto), não para localhost.

**Impacto:** confusão para manutenção e troubleshooting de ambiente.

**Tarefa sugerida:**
- Atualizar comentário e/ou valor da constante para refletir o comportamento real.
- Alinhar também com `API_DOCUMENTATION.md` (base URL atual e estratégia de resolução de endpoint).

---

## 4) Melhorar cobertura de testes
**Problema encontrado:** não há testes automatizados cobrindo regressões críticas de configuração e fluxo de atualização de pacotes.

**Tarefa sugerida:**
- Adicionar testes unitários para:
  1. `lib/api-config.ts`: validação de endpoint montado e fallback de URL.
  2. `hooks/use-packet-stream.ts`: atualização correta ao receber `[]` do backend (não manter estado antigo).
- Incluir esses testes no pipeline de CI para prevenir regressões.
