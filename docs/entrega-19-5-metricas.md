# Entrega 19.5 — Métricas do catálogo

## O que é contado

### Visitas ao catálogo

Uma visita representa uma sessão do navegador naquele catálogo. Abrir várias
páginas durante a mesma sessão não aumenta artificialmente o total de visitas.

### Visitantes únicos

O navegador recebe um identificador aleatório depois da autorização do
visitante. Nenhum nome, telefone, CPF, mensagem ou endereço IP é salvo nas
tabelas desta entrega.

### Moto mais acessada

Cada moto é contada uma vez por sessão, mesmo quando a pessoa abre os detalhes,
o consórcio e o financiamento do mesmo modelo.

## Consentimento

Um aviso discreto é exibido no catálogo:

- Permitir: ativa a medição anônima;
- Não agora: não registra visitas naquele navegador.

A preferência fica salva no navegador.

## Segurança

O visitante anônimo pode apenas executar a função controlada de registro.

Ele não consegue selecionar, editar ou excluir as tabelas.

O vendedor autenticado não recebe acesso às linhas brutas. Ele executa
`minhas_metricas_catalogo()`, que resolve o cliente pelo vínculo da sessão e
devolve somente totais e ranking.

O administrador pode consultar qualquer cliente usando a função protegida
`metricas_catalogo_cliente()`.

## Períodos

O painel possui filtros de:

- 7 dias;
- 30 dias;
- 90 dias;
- todo o período.

## Contagem inicial

As métricas começam em zero. A entrega não inventa nem importa números antigos.
Somente acessos posteriores à ativação são registrados.
