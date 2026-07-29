# Correção 19.5.1

Corrige o erro `react-hooks/set-state-in-effect` em
`PublicCatalogAnalytics.tsx`.

A alteração é somente de agendamento da inicialização do estado. A lógica de
consentimento, os identificadores anônimos, a função RPC e as métricas
permanecem iguais.
