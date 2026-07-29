# Checklist de publicaÃ§Ã£o â€” Painel do vendedor

## ValidaÃ§Ã£o tÃ©cnica

- [ ] `npm.cmd run typecheck` concluÃ­do sem erro.
- [ ] `npm.cmd run lint` concluÃ­do sem erro ou aviso.
- [ ] `npm.cmd run build` concluÃ­do.
- [ ] Nenhum arquivo `.backup-*` rastreado.
- [ ] Nenhum instalador ou correÃ§Ã£o temporÃ¡ria rastreado.
- [ ] `.env.local` existe apenas localmente e nÃ£o estÃ¡ no Git.
- [ ] Rotas `/painel/login`, `/painel` e `/painel/assinatura` compilam.
- [ ] Rotas antigas de `cliente-demo` redirecionam corretamente.

## Teste do vendedor

- [ ] Login da GD Honda funciona.
- [ ] MÃ©tricas carregam.
- [ ] Perfil pode ser alterado.
- [ ] Fotos e enquadramento podem ser alterados.
- [ ] Motos podem ser ocultadas e reativadas.
- [ ] Assinatura mostra os dados definidos pelo administrador.
- [ ] Logout retorna para `/painel/login`.

## Teste administrativo

- [ ] Clientes continuam isolados.
- [ ] PreÃ§os e parcelas permanecem centralizados.
- [ ] Administrador controla as motos liberadas.
- [ ] Bloqueio manual suspende catÃ¡logo e painel.
- [ ] LiberaÃ§Ã£o manual restaura catÃ¡logo e painel.

## SeguranÃ§a

- [ ] Vendedor nÃ£o acessa outro cliente.
- [ ] Vendedor nÃ£o altera slug, status ou preÃ§os.
- [ ] Upload fica restrito Ã  pasta do prÃ³prio cliente.
- [ ] Nenhum nÃºmero de cartÃ£o, CVV ou dado bancÃ¡rio Ã© armazenado.
- [ ] Chaves privadas do Supabase nÃ£o estÃ£o no repositÃ³rio.

## PublicaÃ§Ã£o

- [ ] Branch `feature/painel-clientes` atualizada no GitHub.
- [ ] Backup da versÃ£o estÃ¡vel preservado.
- [ ] ComparaÃ§Ã£o com `main` revisada.
- [ ] Merge executado somente apÃ³s aprovaÃ§Ã£o completa.
- [ ] Deploy de produÃ§Ã£o validado antes de criar nova tag.