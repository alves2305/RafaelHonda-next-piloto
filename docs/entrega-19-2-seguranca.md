# Entrega 19.2 — Usuários dos vendedores e segurança

## Objetivo

Criar a fundação de segurança para o painel dos vendedores sem alterar o
funcionamento atual do catálogo, do painel administrativo ou dos clientes
públicos.

## Estrutura criada

A tabela `public.cliente_usuarios` vincula:

```text
auth.users
→ cliente_usuarios
→ clientes
```

Regras desta fase:

- uma conta do Supabase Auth pertence a apenas um cliente;
- um cliente possui uma conta de painel;
- o vínculo pode ser bloqueado sem apagar a conta;
- o cliente público também precisa estar ativo;
- o vendedor vê somente o próprio vínculo;
- somente um administrador ativo gerencia os vínculos.

## Funções

### `cliente_id_do_usuario()`

Retorna o cliente do usuário autenticado somente quando o vínculo e o cliente
estão ativos.

### `usuario_e_cliente(cliente_id)`

Confirma se o usuário autenticado pertence ao cliente informado.

### `meu_acesso_cliente()`

Retorna o estado do acesso, inclusive quando ele está bloqueado. Será utilizada
pela futura tela de login para mostrar mensagens como:

```text
Seu acesso foi suspenso.
Entre em contato com o administrador.
```

### `vincular_usuario_cliente(email, slug, nome)`

Uso administrativo. Vincula uma conta já criada no Supabase Auth ao catálogo
correto.

### `definir_acesso_painel_cliente(cliente_id, ativo)`

Uso administrativo. Bloqueia ou libera o painel do vendedor.

## Decisão de segurança

Nesta entrega o vendedor não recebe uma política de `UPDATE` nas tabelas
`clientes` ou `cliente_motos`.

Isso é proposital. Nas próximas entregas as alterações permitidas serão feitas
por funções controladas, evitando que o vendedor tente modificar:

- slug;
- status geral do catálogo;
- preços;
- motos de outros vendedores;
- dados de outro cliente;
- campos futuros de cobrança.

## Próxima etapa

A Entrega 19.3 criará:

- o primeiro usuário real de teste;
- vínculo com GD Honda;
- login real;
- verificação de sessão;
- bloqueio de acesso;
- redirecionamento para o painel correto.

Nenhum pagamento real será integrado nessa etapa.
