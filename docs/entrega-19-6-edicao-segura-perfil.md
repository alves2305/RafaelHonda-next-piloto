# Entrega 19.6 — Edição segura do perfil

## Campos liberados

O vendedor pode alterar somente:

- nome exibido;
- WhatsApp;
- Instagram;
- slogan;
- cor principal;
- cor secundária;
- modalidades de consórcio e financiamento.

## Campos protegidos

Continuam sob controle administrativo:

- cliente e vínculo da conta;
- slug/endereço;
- status ativo;
- preços e parcelas;
- motos atribuídas;
- fotos, logo e marca-d'água;
- posicionamento das imagens;
- dados de outros vendedores.

## Segurança

O navegador não executa `UPDATE` direto em `clientes`.

A função `atualizar_meu_perfil_cliente()` identifica o cliente pela sessão
autenticada usando `cliente_id_do_usuario()`.

O cliente não é recebido como parâmetro. Portanto, mudar valores no navegador
não permite selecionar outro vendedor.

## Imagens

O Storage atual foi construído para operações administrativas. A liberação de
uploads será feita separadamente, com políticas que restrinjam cada vendedor à
própria pasta.
