# Catálogo Honda 2.0

Sistema centralizado em Next.js para administrar vários catálogos de
vendedores Honda com uma única base de motos, planos e financiamentos.

## Recursos atuais

- rotas por vendedor em `/[cliente]`;
- perfis personalizados;
- bloqueio e reativação de clientes;
- modalidades por vendedor;
- seleção de motos por catálogo;
- cadastro e edição de motos;
- planos de consórcio centralizados;
- financiamentos centralizados;
- upload de imagens pelo Supabase Storage;
- enquadramento independente das fotos mobile e desktop;
- autenticação administrativa;
- políticas RLS para todas as operações de escrita.

## Requisitos

- Node.js 22 ou superior;
- projeto Supabase;
- usuário criado em `Authentication > Users`.

## Rodar localmente

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

Não envie `.env.local`, senhas ou chaves privadas ao GitHub.

## Instalação do Supabase

Em um projeto novo, execute os arquivos nesta ordem:

1. `supabase/schema.sql`
2. `supabase/catalogo-completo.sql`
3. `supabase/modalidades-vendedores.sql`
4. `supabase/enquadramento-fotos.sql`
5. `supabase/admin-seguranca.sql`
6. `supabase/storage-catalogo.sql`

Antes de executar `admin-seguranca.sql`, substitua:

```sql
COLOQUE_SEU_EMAIL_AQUI
```

pelo e-mail do usuário criado no Supabase Authentication.

Os arquivos de modalidades, enquadramento e Storage possuem verificações para
reduzir o risco de execução no projeto Supabase errado.

## Painel administrativo

```text
/admin/login
/admin/dashboard
/admin/clientes
/admin/motos
/admin/planos
/admin/financiamentos
```

A senha correta não é suficiente: o usuário também precisa estar ativo em
`public.admin_usuarios`.

## Regras públicas

Uma moto aparece em um catálogo quando:

- o cliente está ativo;
- a moto está ativa;
- a relação em `cliente_motos` está ativa.

O consórcio aparece somente quando:

- o vendedor comercializa consórcio;
- a moto possui ao menos um plano ativo.

O financiamento aparece somente quando:

- o vendedor comercializa financiamento;
- a informação de financiamento da moto está ativa.

## Verificações antes de publicar

```bash
npm run typecheck
npm run lint
npm run build
```

O workflow em `.github/workflows/quality.yml` também executa essas verificações
automaticamente no GitHub.

## Observações sobre imagens

O painel aceita imagens JPG, PNG e WebP de até 12 MB antes da otimização.

Antes do upload, o navegador:

- redimensiona a imagem proporcionalmente;
- converte o arquivo para WebP;
- reduz o peso para o limite de 5 MB do bucket;
- preserva transparência;
- aplica cache de um ano ao arquivo enviado.

O arquivo original no computador não é alterado.

As imagens cadastradas antes dessa otimização permanecem como estavam. Para
obter o benefício, elas podem ser enviadas novamente pelo painel.

Ao trocar uma imagem, o arquivo anterior não é excluído automaticamente do
Storage. Faça uma limpeza periódica de arquivos que não são mais utilizados.


## Revisão responsiva

O catálogo e o painel possuem ajustes específicos para:

- celulares estreitos a partir de 320 px;
- celulares convencionais;
- tablets;
- computadores;
- celulares em modo paisagem;
- áreas seguras de aparelhos com recorte de tela.

Nos celulares, os campos de formulário utilizam tamanho mínimo de 16 px para
evitar que o navegador aplique zoom automático durante a digitação.

A navegação entre motos muda para uma coluna em telas estreitas, e a ficha
técnica muda para uma coluna abaixo de 400 px.
