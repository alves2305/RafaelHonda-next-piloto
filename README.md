# Catálogo Honda centralizado

Piloto da nova versão dinâmica do catálogo, criado sem alterar o site estático
que já está em produção.

## O que está pronto

- Um único projeto Next.js para todos os vendedores.
- Perfil dinâmico em `/[cliente]`.
- Páginas reutilizáveis de moto, consórcio e financiamento.
- Dados centralizados por moto.
- Relação independente entre clientes e motos.
- WhatsApp, Instagram, cores, fotos, logo e marca-d'água por perfil.
- Bloqueio manual pelo campo `clientes.ativo`.
- Catálogo completo com 29 opções e 127 planos de consórcio.
- Dados locais de demonstração enquanto o Supabase não estiver configurado.

## Rotas principais

- `/rafael`
- `/rafael/moto/pop-110i-es`
- `/rafael/consorcio/pop-110i-es`
- `/rafael/financiamento/pop-110i-es`

As demais motos usam o mesmo padrão de rota e são carregadas pelo Supabase.

## Rodar localmente

Requisitos: Node.js 22 ou superior.

```bash
npm install
npm run dev
```

Abra `http://localhost:3000/rafael`.

## Conectar ao Supabase

1. Crie um projeto gratuito no Supabase.
2. Abra o SQL Editor e execute `supabase/schema.sql`.
3. Execute `supabase/catalogo-completo.sql` para cadastrar as 29 opções,
   suas imagens, os 127 planos e vinculá-las ao perfil `rafael`.
4. Copie `.env.example` para `.env.local`.
5. Preencha `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
6. Reinicie o servidor.

Se o banco piloto já foi criado, execute apenas
`supabase/catalogo-completo.sql`. O arquivo pode ser executado novamente sem
duplicar motos ou planos.

Sem essas variáveis, o projeto usa os mesmos dados-piloto armazenados
localmente. Com as variáveis, todas as páginas passam a ler o Supabase.

## Suspender ou reativar um perfil

No Table Editor do Supabase, abra `clientes` e altere o campo `ativo`.

- `true`: perfil funcionando.
- `false`: mostra apenas a tela de indisponibilidade.

Também é possível usar:

```sql
update public.clientes set ativo = false where slug = 'rafael';
update public.clientes set ativo = true where slug = 'rafael';
```

## Verificações

```bash
npm run lint
npm run typecheck
npm run build
```
