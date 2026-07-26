-- Catálogo Honda completo
-- Gerado a partir do catálogo anterior enviado por Rafael.
-- Seguro para executar novamente: motos e parcelas existentes são atualizadas.

begin;

alter table public.motos
  add column if not exists titulo_consorcio text
  not null default 'Planos sem emplacamento';

with catalogo as (
  select *
  from (
    values
  ('pop-110i-es', 'POP 110i ES', 'Econômica • Urbana • Honda', '/assets/motos/pop-110i-es.svg', 'NOVA LINHA 2027', 'A moto perfeita para o dia a dia', 'A Honda POP 110i ES 2027 foi desenvolvida para oferecer economia, praticidade e conforto para quem precisa de mobilidade todos os dias. Com partida elétrica, excelente consumo e manutenção econômica, ela é ideal tanto para trabalho quanto para uso pessoal.', '[{"rotulo":"Motor","valor":"109,5 cc"},{"rotulo":"Partida","valor":"Elétrica"},{"rotulo":"Combustível","valor":"Flex"},{"rotulo":"Consumo","valor":"Até 49 km/l"}]'::jsonb, '[{"titulo":"Super Econômica","descricao":"Consumo de até 49 km/l.","icone":"economia"},{"titulo":"Partida Elétrica","descricao":"Mais praticidade no dia a dia.","icone":"praticidade"},{"titulo":"Ideal para Cidade","descricao":"Leve, confortável e fácil de pilotar.","icone":"conforto"}]'::jsonb, 'Planos sem emplacamento', true, 1),
  ('pop-110i-es-com-emplacamento', 'POP 110i ES +10%', 'Econômica • Urbana • Honda', '/assets/motos/pop-110i-es-com-emplacamento.svg', 'NOVA LINHA 2027', 'A moto perfeita para o dia a dia', 'A Honda POP 110i ES 2027 foi desenvolvida para oferecer economia, praticidade e conforto para quem precisa de mobilidade todos os dias. Com partida elétrica, excelente consumo e manutenção econômica, ela é ideal tanto para trabalho quanto para uso pessoal.', '[{"rotulo":"Motor","valor":"109,5 cc"},{"rotulo":"Partida","valor":"Elétrica"},{"rotulo":"Combustível","valor":"Flex"},{"rotulo":"Consumo","valor":"Até 49 km/l"}]'::jsonb, '[{"titulo":"Super Econômica","descricao":"Consumo de até 49 km/l.","icone":"economia"},{"titulo":"Partida Elétrica","descricao":"Mais praticidade no dia a dia.","icone":"praticidade"},{"titulo":"Ideal para Cidade","descricao":"Leve, confortável e fácil de pilotar.","icone":"conforto"}]'::jsonb, 'Planos com emplacamento', true, 2),
  ('biz-125-es', 'BIZ 125 ES', 'Praticidade • Economia • Honda', '/assets/motos/biz-125-es.svg', 'NOVA LINHA 2027', 'Mais praticidade para o seu dia', 'A Honda BIZ 125 ES 2027 combina conforto, economia e praticidade para quem busca mobilidade urbana com estilo. Com excelente consumo, espaço interno e pilotagem confortável, ela é perfeita para o trabalho, estudos e rotina diária.', '[{"rotulo":"Motor","valor":"123,9 cc"},{"rotulo":"Partida","valor":"Elétrica"},{"rotulo":"Combustível","valor":"Flex"},{"rotulo":"Consumo","valor":"Até 62 km/l"}]'::jsonb, '[{"titulo":"Baixo Consumo","descricao":"Economia para o dia a dia.","icone":"economia"},{"titulo":"Porta Objetos","descricao":"Mais praticidade e espaço.","icone":"praticidade"},{"titulo":"Confortável","descricao":"Ideal para trajetos urbanos.","icone":"conforto"}]'::jsonb, 'Planos sem emplacamento', true, 3),
  ('elite-125', 'ELITE 125', 'Scooter • Conforto • Honda', '/assets/motos/elite-125.svg', 'NOVA LINHA 2027', 'Mais conforto para sua rotina', 'A Honda ELITE 125 2027 oferece praticidade, conforto e economia para quem busca uma scooter moderna e eficiente para o dia a dia. Com design moderno, câmbio automático CVT e excelente consumo, ela proporciona uma pilotagem leve e confortável em qualquer trajeto urbano.', '[{"rotulo":"Motor","valor":"123,9 cc"},{"rotulo":"Transmissão","valor":"Automática CVT"},{"rotulo":"Combustível","valor":"Gasolina"},{"rotulo":"Consumo","valor":"Até 45 km/l"}]'::jsonb, '[{"titulo":"Câmbio Automático","descricao":"Mais praticidade no trânsito urbano.","icone":"praticidade"},{"titulo":"Excelente Economia","descricao":"Ótimo consumo para o uso diário.","icone":"economia"},{"titulo":"Mais Conforto","descricao":"Pilotagem leve e confortável.","icone":"conforto"}]'::jsonb, 'Planos sem emplacamento', true, 4),
  ('biz-125-ex', 'BIZ 125 EX', 'Sofisticação • Economia • Honda', '/assets/motos/biz-125-ex.svg', 'NOVA LINHA 2027', 'Mais tecnologia e estilo para o seu dia', 'A Honda BIZ 125 EX 2027 entrega praticidade, conforto e um visual ainda mais sofisticado para quem busca mobilidade urbana com economia e tecnologia. Com painel moderno, excelente consumo e espaço interno funcional, ela é perfeita para quem deseja praticidade sem abrir mão do estilo.', '[{"rotulo":"Motor","valor":"123,9 cc"},{"rotulo":"Partida","valor":"Elétrica"},{"rotulo":"Combustível","valor":"Flex"},{"rotulo":"Consumo","valor":"Até 62 km/l"}]'::jsonb, '[{"titulo":"Painel Moderno","descricao":"Mais tecnologia e praticidade.","icone":"praticidade"},{"titulo":"Super Econômica","descricao":"Excelente consumo no dia a dia.","icone":"economia"},{"titulo":"Porta Objetos","descricao":"Mais espaço e funcionalidade.","icone":"praticidade"}]'::jsonb, 'Planos sem emplacamento', true, 5),
  ('pcx-cbs', 'PCX CBS', 'Scooter Premium • Tecnologia • Honda', '/assets/motos/pcx-cbs.svg', 'NOVA LINHA 2027', 'Tecnologia e conforto em cada trajeto', 'A Honda PCX CBS 2027 combina design moderno, economia e conforto para quem busca uma experiência premium na mobilidade urbana. Com painel digital, sistema Idling Stop e amplo espaço interno, ela oferece uma pilotagem sofisticada e prática para o dia a dia.', '[{"rotulo":"Motor","valor":"160 cc"},{"rotulo":"Transmissão","valor":"Automática CVT"},{"rotulo":"Combustível","valor":"Flex"},{"rotulo":"Consumo","valor":"Até 40 km/l"}]'::jsonb, '[{"titulo":"Idling Stop","descricao":"Mais economia de combustível.","icone":"economia"},{"titulo":"Conforto Premium","descricao":"Pilotagem suave e confortável.","icone":"conforto"},{"titulo":"Painel Digital","descricao":"Visual moderno e tecnológico.","icone":"praticidade"}]'::jsonb, 'Planos sem emplacamento', true, 6),
  ('pcx-abs', 'PCX ABS', 'Segurança • Tecnologia • Honda', '/assets/motos/pcx-abs.svg', 'NOVA LINHA 2027', 'Mais segurança e sofisticação para pilotar', 'A Honda PCX ABS 2027 oferece uma experiência premium com ainda mais segurança, conforto e tecnologia para o dia a dia. Equipada com freio ABS na roda dianteira, painel digital moderno e sistema Idling Stop, ela garante uma pilotagem suave, econômica e muito mais segura no trânsito urbano.', '[{"rotulo":"Motor","valor":"160 cc"},{"rotulo":"Transmissão","valor":"Automática CVT"},{"rotulo":"Freios","valor":"ABS dianteiro"},{"rotulo":"Consumo","valor":"Até 40 km/l"}]'::jsonb, '[{"titulo":"Freio ABS","descricao":"Mais controle e segurança na frenagem.","icone":"conforto"},{"titulo":"Idling Stop","descricao":"Economia inteligente de combustível.","icone":"economia"},{"titulo":"Conforto Premium","descricao":"Pilotagem confortável em qualquer trajeto.","icone":"conforto"}]'::jsonb, 'Planos sem emplacamento', true, 7),
  ('start-160', 'START 160', 'Esportividade • Economia • Honda', '/assets/motos/start-160.svg', 'NOVA LINHA 2027', 'Performance e economia para o dia a dia', 'A Honda START 160 2027 entrega um visual moderno, excelente desempenho e economia para quem busca uma moto prática e versátil para a rotina. Com motor potente, pilotagem confortável e baixo consumo, ela é ideal tanto para trabalho quanto para uso pessoal.', '[{"rotulo":"Motor","valor":"160 cc"},{"rotulo":"Partida","valor":"Elétrica"},{"rotulo":"Combustível","valor":"Flex"},{"rotulo":"Consumo","valor":"Até 45 km/l"}]'::jsonb, '[{"titulo":"Motor 160cc","descricao":"Mais força e desempenho na pilotagem.","icone":"desempenho"},{"titulo":"Excelente Economia","descricao":"Ótimo consumo para o dia a dia.","icone":"economia"},{"titulo":"Conforto Urbano","descricao":"Ideal para cidade e trajetos diários.","icone":"conforto"}]'::jsonb, 'Planos sem emplacamento', true, 8),
  ('fan-160', 'FAN 160', 'Robustez • Economia • Honda', '/assets/motos/fan-160.svg', 'NOVA LINHA 2027', 'A moto mais querida do Brasil', 'A Honda FAN 160 2027 combina desempenho, economia e confiabilidade para quem busca uma moto versátil e pronta para qualquer rotina. Com motor forte, excelente consumo e pilotagem confortável, ela é perfeita tanto para trabalho quanto para uso diário com muito mais segurança e praticidade.', '[{"rotulo":"Motor","valor":"160 cc"},{"rotulo":"Partida","valor":"Elétrica"},{"rotulo":"Combustível","valor":"Flex"},{"rotulo":"Consumo","valor":"Até 45 km/l"}]'::jsonb, '[{"titulo":"Motor 160cc","descricao":"Mais desempenho e força no dia a dia.","icone":"desempenho"},{"titulo":"Excelente Consumo","descricao":"Economia para rodar mais gastando menos.","icone":"economia"},{"titulo":"Confiabilidade Honda","descricao":"Durabilidade e baixa manutenção.","icone":"desempenho"}]'::jsonb, 'Planos sem emplacamento', true, 9),
  ('titan-160', 'TITAN 160', 'Potência • Estilo • Honda', '/assets/motos/titan-160.svg', 'NOVA LINHA 2027', 'Mais potência para sua rotina', 'A Honda TITAN 160 2027 entrega desempenho, conforto e um visual moderno para quem busca uma moto completa para o dia a dia. Com motor forte, excelente dirigibilidade e tecnologia Honda, ela oferece uma pilotagem segura, econômica e confortável em qualquer trajeto urbano.', '[{"rotulo":"Motor","valor":"160 cc"},{"rotulo":"Partida","valor":"Elétrica"},{"rotulo":"Combustível","valor":"Flex"},{"rotulo":"Consumo","valor":"Até 45 km/l"}]'::jsonb, '[{"titulo":"Motor 160cc","descricao":"Mais potência e desempenho na pilotagem.","icone":"desempenho"},{"titulo":"Painel Moderno","descricao":"Visual esportivo e tecnológico.","icone":"praticidade"},{"titulo":"Confiabilidade Honda","descricao":"Segurança e durabilidade para o dia a dia.","icone":"conforto"}]'::jsonb, 'Planos sem emplacamento', true, 10),
  ('bros-160-cbs', 'BROS 160 CBS', 'Aventura • Versatilidade • Honda', '/assets/motos/bros-160-cbs.svg', 'NOVA LINHA 2027', 'Pronta para qualquer caminho', 'A Honda BROS 160 CBS 2027 foi desenvolvida para quem busca versatilidade, conforto e resistência tanto na cidade quanto em estradas de terra. Com suspensão elevada, posição de pilotagem confortável e motor potente, ela entrega segurança e desempenho em qualquer trajeto.', '[{"rotulo":"Motor","valor":"160 cc"},{"rotulo":"Freios","valor":"CBS"},{"rotulo":"Combustível","valor":"Flex"},{"rotulo":"Consumo","valor":"Até 42 km/l"}]'::jsonb, '[{"titulo":"Versatilidade Total","descricao":"Ideal para cidade e estrada de terra.","icone":"desempenho"},{"titulo":"Motor 160cc","descricao":"Mais força e desempenho na pilotagem.","icone":"desempenho"},{"titulo":"Freio CBS","descricao":"Mais equilíbrio e segurança nas frenagens.","icone":"conforto"}]'::jsonb, 'Planos sem emplacamento', true, 11),
  ('bros-160-abs', 'BROS 160 ABS', 'Segurança • Aventura • Honda', '/assets/motos/bros-160-abs.svg', 'NOVA LINHA 2027', 'Mais segurança para qualquer trajeto', 'A Honda BROS 160 ABS 2027 oferece versatilidade, conforto e ainda mais segurança para enfrentar cidade, estrada e terrenos irregulares. Equipada com freio ABS na roda dianteira, suspensão elevada e motor potente, ela entrega controle, estabilidade e confiança em qualquer percurso.', '[{"rotulo":"Motor","valor":"160 cc"},{"rotulo":"Freios","valor":"ABS dianteiro"},{"rotulo":"Combustível","valor":"Flex"},{"rotulo":"Consumo","valor":"Até 42 km/l"}]'::jsonb, '[{"titulo":"Freio ABS","descricao":"Mais segurança e controle na frenagem.","icone":"conforto"},{"titulo":"Versatilidade","descricao":"Perfeita para cidade e estrada.","icone":"desempenho"},{"titulo":"Motor 160cc","descricao":"Desempenho e força para qualquer rotina.","icone":"desempenho"}]'::jsonb, 'Planos sem emplacamento', true, 12),
  ('crf-300f', 'CRF 300F', 'Off-Road • Performance • Honda', '/assets/motos/crf-300f.svg', 'LINHA OFF-ROAD 2027', 'Nascida para a aventura', 'A Honda CRF 300F 2027 foi desenvolvida para entregar potência, resistência e desempenho nas trilhas mais desafiadoras. Com visual inspirado nas motos de competição, suspensão de longo curso e motor forte, ela proporciona uma experiência off-road completa para quem busca adrenalina e diversão.', '[{"rotulo":"Motor","valor":"300 cc"},{"rotulo":"Categoria","valor":"Off-Road"},{"rotulo":"Partida","valor":"Elétrica"},{"rotulo":"Suspensão","valor":"Longo curso"}]'::jsonb, '[{"titulo":"Pronta para Trilhas","descricao":"Desenvolvida para terrenos off-road.","icone":"desempenho"},{"titulo":"Motor Potente","descricao":"Mais força e desempenho nas aventuras.","icone":"desempenho"},{"titulo":"Suspensão Elevada","descricao":"Mais controle e estabilidade nas trilhas.","icone":"desempenho"}]'::jsonb, 'Planos sem emplacamento', true, 13),
  ('xr-300l-tornado', 'XR 300L TORNADO', 'Trail • Resistência • Honda', '/assets/motos/xr-300l-tornado.svg', 'LINHA TRAIL 2027', 'A lenda das trilhas está de volta', 'A Honda XR300L TORNADO 2027 combina força, resistência e versatilidade para quem busca aventura dentro e fora da cidade. Com suspensão elevada, visual robusto e motor potente, ela entrega excelente desempenho tanto no asfalto quanto em estradas de terra e trilhas leves.', '[{"rotulo":"Motor","valor":"293,5 cc"},{"rotulo":"Categoria","valor":"Trail"},{"rotulo":"Combustível","valor":"Flex"},{"rotulo":"Freios","valor":"ABS"}]'::jsonb, '[{"titulo":"DNA Trail","descricao":"Preparada para qualquer terreno.","icone":"desempenho"},{"titulo":"Motor 300cc","descricao":"Mais força e desempenho na pilotagem.","icone":"desempenho"},{"titulo":"Conforto e Versatilidade","descricao":"Ideal para cidade e aventura.","icone":"conforto"}]'::jsonb, 'Planos sem emplacamento', true, 14),
  ('cb-300f-twister-cbs', 'CB 300F TWISTER CBS', 'Esportividade • Performance • Honda', '/assets/motos/cb-300f-twister-cbs.svg', 'NOVA LINHA 2027', 'Performance e estilo para o seu dia', 'A Honda CB 300F TWISTER CBS 2027 combina potência, conforto e design esportivo para quem busca uma pilotagem dinâmica e moderna. Com motor forte, painel digital e excelente ciclística, ela oferece desempenho e versatilidade tanto para cidade quanto para viagens.', '[{"rotulo":"Motor","valor":"293,5 cc"},{"rotulo":"Freios","valor":"CBS"},{"rotulo":"Combustível","valor":"Flex"},{"rotulo":"Painel","valor":"100% digital"}]'::jsonb, '[{"titulo":"Motor 300cc","descricao":"Mais desempenho e aceleração.","icone":"desempenho"},{"titulo":"Painel Digital","descricao":"Tecnologia e visual moderno.","icone":"praticidade"},{"titulo":"Pilotagem Confortável","descricao":"Ideal para cidade e estrada.","icone":"conforto"}]'::jsonb, 'Planos sem emplacamento', true, 15),
  ('cb-300f-twister-abs', 'CB 300F TWISTER ABS', 'Esportividade • Tecnologia • Honda', '/assets/motos/cb-300f-twister-abs.svg', 'NOVA LINHA 2027', 'Potência e estilo em cada detalhe', 'A Honda CB 300F TWISTER ABS 2027 entrega desempenho, tecnologia e visual esportivo para quem busca emoção e conforto na pilotagem. Equipada com motor potente, painel moderno e freio ABS, ela oferece uma experiência segura, dinâmica e muito mais divertida tanto na cidade quanto na estrada.', '[{"rotulo":"Motor","valor":"293,5 cc"},{"rotulo":"Freios","valor":"ABS dianteiro"},{"rotulo":"Combustível","valor":"Flex"},{"rotulo":"Painel","valor":"100% digital"}]'::jsonb, '[{"titulo":"Motor 300cc","descricao":"Mais potência e performance na pilotagem.","icone":"desempenho"},{"titulo":"Freio ABS","descricao":"Mais segurança e controle nas frenagens.","icone":"conforto"},{"titulo":"Painel Digital","descricao":"Tecnologia e visual moderno.","icone":"praticidade"}]'::jsonb, 'Planos sem emplacamento', true, 16),
  ('xre-190', 'XRE 190', 'Aventura • Conforto • Honda', '/assets/motos/xre-190.svg', 'NOVA LINHA 2027', 'Versatilidade para qualquer caminho', 'A Honda XRE 190 2027 foi desenvolvida para quem busca conforto, desempenho e versatilidade tanto na cidade quanto em viagens e estradas de terra. Com posição de pilotagem elevada, suspensão confortável e motor potente, ela entrega segurança, estabilidade e muita confiança em qualquer trajeto.', '[{"rotulo":"Motor","valor":"184,4 cc"},{"rotulo":"Freios","valor":"ABS"},{"rotulo":"Combustível","valor":"Flex"},{"rotulo":"Categoria","valor":"Adventure"}]'::jsonb, '[{"titulo":"Estilo Adventure","descricao":"Visual robusto e pronto para aventuras.","icone":"desempenho"},{"titulo":"Motor 190cc","descricao":"Mais força e desempenho na pilotagem.","icone":"desempenho"},{"titulo":"Conforto Total","descricao":"Ideal para cidade e viagens.","icone":"conforto"}]'::jsonb, 'Planos sem emplacamento', true, 17),
  ('xre-300-sahara', 'XRE 300 SAHARA', 'Adventure • Tecnologia • Honda', '/assets/motos/xre-300-sahara.svg', 'NOVA LINHA 2027', 'Liberdade para ir além', 'A Honda XRE 300 SAHARA 2027 foi criada para quem busca aventura, conforto e desempenho em qualquer tipo de trajeto. Com visual robusto, tecnologia moderna e excelente ciclística, ela entrega estabilidade, potência e segurança tanto na cidade quanto em viagens e estradas de terra.', '[{"rotulo":"Motor","valor":"293,5 cc"},{"rotulo":"Freios","valor":"ABS"},{"rotulo":"Combustível","valor":"Flex"},{"rotulo":"Painel","valor":"100% digital"}]'::jsonb, '[{"titulo":"Estilo Adventure","descricao":"Design robusto e pronto para aventuras.","icone":"desempenho"},{"titulo":"Motor 300cc","descricao":"Mais potência e desempenho na pilotagem.","icone":"desempenho"},{"titulo":"Freio ABS","descricao":"Mais segurança e controle na frenagem.","icone":"conforto"}]'::jsonb, 'Planos sem emplacamento', true, 18),
  ('xre-300-sahara-adv', 'XRE 300 SAHARA ADV', 'Adventure • Premium • Honda', '/assets/motos/xre-300-sahara-adv.svg', 'LINHA ADVENTURE 2027', 'Preparada para qualquer aventura', 'A Honda XRE 300 SAHARA ADV 2027 entrega potência, tecnologia e conforto para quem deseja explorar novos caminhos com máxima segurança e desempenho. Com visual aventureiro, posição de pilotagem elevada e excelente ciclística, ela oferece estabilidade, conforto e performance tanto na cidade quanto em viagens e estradas off-road.', '[{"rotulo":"Motor","valor":"293,5 cc"},{"rotulo":"Freios","valor":"ABS"},{"rotulo":"Combustível","valor":"Flex"},{"rotulo":"Painel","valor":"100% digital"}]'::jsonb, '[{"titulo":"DNA Adventure","descricao":"Pronta para estrada e aventura.","icone":"desempenho"},{"titulo":"Motor 300cc","descricao":"Mais potência para qualquer trajeto.","icone":"desempenho"},{"titulo":"Freio ABS","descricao":"Mais segurança e controle na pilotagem.","icone":"conforto"}]'::jsonb, 'Planos sem emplacamento', true, 19),
  ('honda-adv', 'HONDA ADV', 'Scooter Adventure • Tecnologia • Honda', '/assets/motos/honda-adv.svg', 'LINHA PREMIUM 2027', 'O espírito adventure em uma scooter', 'A Honda ADV 2027 combina tecnologia, conforto e um visual aventureiro para quem deseja uma experiência premium na mobilidade urbana. Com suspensão elevada, painel moderno e câmbio automático CVT, ela entrega praticidade, desempenho e muito mais conforto tanto na cidade quanto em trajetos mais longos.', '[{"rotulo":"Motor","valor":"160 cc"},{"rotulo":"Transmissão","valor":"Automática CVT"},{"rotulo":"Freios","valor":"ABS"},{"rotulo":"Painel","valor":"100% digital"}]'::jsonb, '[{"titulo":"Visual Adventure","descricao":"Design robusto e moderno.","icone":"desempenho"},{"titulo":"Câmbio Automático","descricao":"Mais conforto e praticidade.","icone":"conforto"},{"titulo":"Freio ABS","descricao":"Mais segurança nas frenagens.","icone":"conforto"}]'::jsonb, 'Planos sem emplacamento', true, 20),
  ('cb-500-hornet', 'CB 500 HORNET', 'Naked • Performance • Honda', '/assets/motos/cb-500-hornet.svg', 'LINHA NAKED 2027', 'Potência e agressividade em cada detalhe', 'A Honda CB 500 HORNET 2027 entrega uma combinação perfeita entre desempenho, tecnologia e visual esportivo para quem busca emoção na pilotagem. Com motor bicilíndrico, design agressivo e excelente ciclística, ela proporciona uma experiência dinâmica, confortável e extremamente divertida tanto na cidade quanto na estrada.', '[{"rotulo":"Motor","valor":"471 cc"},{"rotulo":"Cilindros","valor":"Bicilíndrico"},{"rotulo":"Freios","valor":"ABS"},{"rotulo":"Painel","valor":"100% digital"}]'::jsonb, '[{"titulo":"Motor Bicilíndrico","descricao":"Mais potência e aceleração.","icone":"desempenho"},{"titulo":"Painel Full Digital","descricao":"Tecnologia e visual moderno.","icone":"praticidade"},{"titulo":"Freio ABS","descricao":"Mais segurança e controle.","icone":"conforto"}]'::jsonb, 'Planos sem emplacamento', true, 21),
  ('nx-500', 'NX 500', 'Adventure • Performance • Honda', '/assets/motos/nx-500.svg', 'LINHA ADVENTURE 2027', 'Liberdade para explorar novos caminhos', 'A Honda NX 500 2027 combina desempenho, conforto e tecnologia para quem busca uma moto versátil e pronta para qualquer aventura. Com motor bicilíndrico, posição de pilotagem confortável e visual robusto, ela entrega estabilidade, potência e segurança tanto para viagens quanto para o uso urbano.', '[{"rotulo":"Motor","valor":"471 cc"},{"rotulo":"Cilindros","valor":"Bicilíndrico"},{"rotulo":"Freios","valor":"ABS"},{"rotulo":"Painel","valor":"100% digital"}]'::jsonb, '[{"titulo":"DNA Adventure","descricao":"Preparada para estrada e aventura.","icone":"desempenho"},{"titulo":"Motor Bicilíndrico","descricao":"Mais potência e desempenho.","icone":"desempenho"},{"titulo":"Freio ABS","descricao":"Mais segurança e controle na pilotagem.","icone":"conforto"}]'::jsonb, 'Planos sem emplacamento', true, 22),
  ('cb-750-hornet', 'CB 750 HORNET', 'Naked • Alta Performance • Honda', '/assets/motos/cb-750-hornet.svg', 'LINHA NAKED PREMIUM 2027', 'Performance extrema com DNA esportivo', 'A Honda CB 750 HORNET 2027 entrega potência, tecnologia e agressividade para quem busca uma experiência premium sobre duas rodas. Com motor bicilíndrico de alta performance, design moderno e ciclística refinada, ela proporciona aceleração forte, conforto e muita emoção tanto na cidade quanto na estrada.', '[{"rotulo":"Motor","valor":"755 cc"},{"rotulo":"Cilindros","valor":"Bicilíndrico"},{"rotulo":"Freios","valor":"ABS"},{"rotulo":"Painel","valor":"TFT Full Digital"}]'::jsonb, '[{"titulo":"Motor 750cc","descricao":"Potência e aceleração impressionantes.","icone":"desempenho"},{"titulo":"Tecnologia Premium","descricao":"Painel moderno e modos de pilotagem.","icone":"praticidade"},{"titulo":"Freio ABS","descricao":"Mais segurança e controle total.","icone":"conforto"}]'::jsonb, 'Planos sem emplacamento', true, 23),
  ('trx-420-fourtrax', 'TRX 420 FOURTRAX', 'Quadriciclo • Força • Honda', '/assets/motos/trx-420-fourtrax.svg', 'LINHA OFF-ROAD 2027', 'Força e resistência para qualquer desafio', 'O Honda TRX 420 FOURTRAX 2027 foi desenvolvido para entregar potência, resistência e versatilidade em qualquer tipo de terreno. Ideal tanto para trabalho quanto para lazer, ele oferece excelente desempenho off-road, conforto na pilotagem e a confiabilidade tradicional da Honda.', '[{"rotulo":"Motor","valor":"420 cc"},{"rotulo":"Categoria","valor":"Quadriciclo"},{"rotulo":"Tração","valor":"4x4"},{"rotulo":"Partida","valor":"Elétrica"}]'::jsonb, '[{"titulo":"Pronto para Off-Road","descricao":"Excelente desempenho em qualquer terreno.","icone":"desempenho"},{"titulo":"Motor 420cc","descricao":"Mais força e resistência no uso diário.","icone":"desempenho"},{"titulo":"Confiabilidade Honda","descricao":"Durabilidade e baixa manutenção.","icone":"desempenho"}]'::jsonb, 'Planos sem emplacamento', true, 24),
  ('cb-1000r-70', 'CB 1000R 70%', 'Neo Sports Café • Super Naked • Honda', '/assets/motos/cb-1000r-70.svg', 'LINHA PREMIUM 2027', 'Potência extrema com design sofisticado', 'A Honda CB 1000R 2027 combina desempenho brutal, tecnologia avançada e um visual sofisticado inspirado no conceito Neo Sports Café. Equipada com motor quatro cilindros, eletrônica premium e acabamento refinado, ela entrega aceleração impressionante, conforto e muita esportividade para quem busca uma experiência única sobre duas rodas.', '[{"rotulo":"Motor","valor":"998 cc"},{"rotulo":"Cilindros","valor":"4 cilindros"},{"rotulo":"Freios","valor":"ABS"},{"rotulo":"Painel","valor":"TFT Full Digital"}]'::jsonb, '[{"titulo":"Motor 1000cc","descricao":"Potência e performance de alto nível.","icone":"desempenho"},{"titulo":"Tecnologia Premium","descricao":"Painel TFT e modos de pilotagem.","icone":"praticidade"},{"titulo":"Freio ABS","descricao":"Mais controle e segurança.","icone":"conforto"}]'::jsonb, 'Planos sem emplacamento', true, 25),
  ('nc-750x-abs-mt', 'NC 750X ABS MT', 'Adventure Touring • Tecnologia • Honda', '/assets/motos/nc-750x-abs-mt.svg', 'LINHA ADVENTURE TOURING 2027', 'Conforto e versatilidade para qualquer viagem', 'A Honda NC 750X ABS MT 2027 combina desempenho, conforto e tecnologia para quem busca uma moto versátil tanto para o dia a dia quanto para longas viagens. Com posição de pilotagem confortável, excelente autonomia e motor bicilíndrico, ela entrega uma experiência premium, segura e extremamente confortável em qualquer trajeto.', '[{"rotulo":"Motor","valor":"745 cc"},{"rotulo":"Câmbio","valor":"Manual"},{"rotulo":"Freios","valor":"ABS"},{"rotulo":"Cilindros","valor":"Bicilíndrico"}]'::jsonb, '[{"titulo":"Conforto Touring","descricao":"Ideal para cidade e viagens longas.","icone":"conforto"},{"titulo":"Motor Bicilíndrico","descricao":"Potência com excelente economia.","icone":"economia"},{"titulo":"Freio ABS","descricao":"Mais segurança e controle na pilotagem.","icone":"conforto"}]'::jsonb, 'Planos sem emplacamento', true, 26),
  ('cb-650r-e-clutch', 'CB 650R E-CLUTCH', 'Neo Sports Café • Tecnologia • Honda', '/assets/motos/cb-650r-e-clutch.svg', 'LINHA PREMIUM 2027', 'Tecnologia e esportividade em outro nível', 'A Honda CB 650R E-CLUTCH 2027 entrega potência, sofisticação e inovação para quem busca uma experiência premium sobre duas rodas. Equipada com motor quatro cilindros e a tecnologia exclusiva Honda E-Clutch, ela proporciona trocas de marcha mais rápidas, suaves e esportivas, elevando o prazer na pilotagem.', '[{"rotulo":"Motor","valor":"649 cc"},{"rotulo":"Cilindros","valor":"4 cilindros"},{"rotulo":"Tecnologia","valor":"E-Clutch"},{"rotulo":"Painel","valor":"TFT Full Digital"}]'::jsonb, '[{"titulo":"Motor 650cc","descricao":"Potência e desempenho esportivo.","icone":"desempenho"},{"titulo":"Tecnologia E-Clutch","descricao":"Trocas de marcha mais rápidas e suaves.","icone":"praticidade"},{"titulo":"Freio ABS","descricao":"Mais segurança e controle total.","icone":"conforto"}]'::jsonb, 'Planos sem emplacamento', true, 27),
  ('crf-1100l-africa-twin-mt-70', 'CRF 1100L AFRICA TWIN MT 70%', 'Big Trail • Adventure • Honda', '/assets/motos/crf-1100l-africa-twin-mt-70.svg', 'LINHA ADVENTURE PREMIUM 2027', 'Criada para explorar o mundo', 'A Honda CRF 1100L AFRICA TWIN 2027 entrega potência, tecnologia e resistência para quem busca aventuras sem limites. Com motor bicilíndrico de alta performance, eletrônica avançada e excelente conforto na pilotagem, ela oferece estabilidade, segurança e desempenho tanto no asfalto quanto nos terrenos off-road mais desafiadores.', '[{"rotulo":"Motor","valor":"1084 cc"},{"rotulo":"Cilindros","valor":"Bicilíndrico"},{"rotulo":"Freios","valor":"ABS"},{"rotulo":"Painel","valor":"TFT Full Digital"}]'::jsonb, '[{"titulo":"DNA Adventure","descricao":"Preparada para viagens e off-road.","icone":"desempenho"},{"titulo":"Motor 1100cc","descricao":"Potência e desempenho premium.","icone":"desempenho"},{"titulo":"Tecnologia Avançada","descricao":"Modos de pilotagem e painel TFT.","icone":"praticidade"}]'::jsonb, 'Planos sem emplacamento', true, 28),
  ('xl-750-transalp', 'XL 750 TRANSALP', 'Adventure Touring • Premium • Honda', '/assets/motos/xl-750-transalp.svg', 'LINHA ADVENTURE PREMIUM 2027', 'Liberdade para ir mais longe', 'A Honda XL 750 TRANSALP 2027 foi criada para quem busca conforto, tecnologia e desempenho em qualquer tipo de aventura. Com motor bicilíndrico potente, ciclística refinada e excelente ergonomia, ela entrega estabilidade, segurança e conforto tanto para longas viagens quanto para trajetos urbanos e off-road leve.', '[{"rotulo":"Motor","valor":"755 cc"},{"rotulo":"Cilindros","valor":"Bicilíndrico"},{"rotulo":"Freios","valor":"ABS"},{"rotulo":"Painel","valor":"TFT Full Digital"}]'::jsonb, '[{"titulo":"DNA Adventure","descricao":"Pronta para estrada e aventura.","icone":"desempenho"},{"titulo":"Motor 750cc","descricao":"Potência com excelente conforto.","icone":"conforto"},{"titulo":"Tecnologia Premium","descricao":"Painel TFT e modos de pilotagem.","icone":"praticidade"}]'::jsonb, 'Planos sem emplacamento', true, 29)
  ) as dados (
    slug,
    nome,
    categoria,
    imagem_url,
    selo,
    titulo_descricao,
    descricao,
    detalhes,
    beneficios,
    titulo_consorcio,
    ativo,
    ordem
  )
)
insert into public.motos (
  slug,
  nome,
  categoria,
  imagem_url,
  selo,
  titulo_descricao,
  descricao,
  detalhes,
  beneficios,
  titulo_consorcio,
  ativo,
  ordem
)
select * from catalogo
on conflict (slug) do update set
  nome = excluded.nome,
  categoria = excluded.categoria,
  imagem_url = excluded.imagem_url,
  selo = excluded.selo,
  titulo_descricao = excluded.titulo_descricao,
  descricao = excluded.descricao,
  detalhes = excluded.detalhes,
  beneficios = excluded.beneficios,
  titulo_consorcio = excluded.titulo_consorcio,
  ativo = excluded.ativo,
  ordem = excluded.ordem;

with slugs as (
  select *
  from (
    values
    ('pop-110i-es'),
    ('pop-110i-es-com-emplacamento'),
    ('biz-125-es'),
    ('elite-125'),
    ('biz-125-ex'),
    ('pcx-cbs'),
    ('pcx-abs'),
    ('start-160'),
    ('fan-160'),
    ('titan-160'),
    ('bros-160-cbs'),
    ('bros-160-abs'),
    ('crf-300f'),
    ('xr-300l-tornado'),
    ('cb-300f-twister-cbs'),
    ('cb-300f-twister-abs'),
    ('xre-190'),
    ('xre-300-sahara'),
    ('xre-300-sahara-adv'),
    ('honda-adv'),
    ('cb-500-hornet'),
    ('nx-500'),
    ('cb-750-hornet'),
    ('trx-420-fourtrax'),
    ('cb-1000r-70'),
    ('nc-750x-abs-mt'),
    ('cb-650r-e-clutch'),
    ('crf-1100l-africa-twin-mt-70'),
    ('xl-750-transalp')
  ) as dados (slug)
)
insert into public.cliente_motos (cliente_id, moto_id, ativo, ordem)
select cliente.id, moto.id, true, moto.ordem
from public.clientes as cliente
cross join slugs
join public.motos as moto on moto.slug = slugs.slug
where cliente.slug = 'rafael'
on conflict (cliente_id, moto_id) do update set
  ativo = excluded.ativo,
  ordem = excluded.ordem;

with slugs as (
  select *
  from (
    values
    ('pop-110i-es'),
    ('pop-110i-es-com-emplacamento'),
    ('biz-125-es'),
    ('elite-125'),
    ('biz-125-ex'),
    ('pcx-cbs'),
    ('pcx-abs'),
    ('start-160'),
    ('fan-160'),
    ('titan-160'),
    ('bros-160-cbs'),
    ('bros-160-abs'),
    ('crf-300f'),
    ('xr-300l-tornado'),
    ('cb-300f-twister-cbs'),
    ('cb-300f-twister-abs'),
    ('xre-190'),
    ('xre-300-sahara'),
    ('xre-300-sahara-adv'),
    ('honda-adv'),
    ('cb-500-hornet'),
    ('nx-500'),
    ('cb-750-hornet'),
    ('trx-420-fourtrax'),
    ('cb-1000r-70'),
    ('nc-750x-abs-mt'),
    ('cb-650r-e-clutch'),
    ('crf-1100l-africa-twin-mt-70'),
    ('xl-750-transalp')
  ) as dados (slug)
)
update public.planos_consorcio as plano
set ativo = false
where plano.moto_id in (
  select moto.id
  from public.motos as moto
  join slugs on slugs.slug = moto.slug
);

with planos as (
  select *
  from (
    values
  ('pop-110i-es', 80, 197.73, true, 1),
  ('pop-110i-es', 60, 256.10, false, 2),
  ('pop-110i-es', 48, 315.44, false, 3),
  ('pop-110i-es', 36, 415.57, false, 4),
  ('pop-110i-es', 24, 611.24, false, 5),
  ('pop-110i-es', 18, 810.27, false, 6),
  ('pop-110i-es', 12, 1208.34, false, 7),
  ('pop-110i-es-com-emplacamento', 80, 217.49, true, 1),
  ('pop-110i-es-com-emplacamento', 60, 281.70, false, 2),
  ('pop-110i-es-com-emplacamento', 48, 346.98, false, 3),
  ('pop-110i-es-com-emplacamento', 36, 457.12, false, 4),
  ('pop-110i-es-com-emplacamento', 24, 672.35, false, 5),
  ('pop-110i-es-com-emplacamento', 18, 891.28, false, 6),
  ('pop-110i-es-com-emplacamento', 12, 1329.14, false, 7),
  ('biz-125-es', 80, 251.87, true, 1),
  ('biz-125-es', 60, 326.23, false, 2),
  ('biz-125-es', 48, 401.83, false, 3),
  ('biz-125-es', 36, 529.38, false, 4),
  ('biz-125-es', 24, 778.64, false, 5),
  ('biz-125-es', 18, 1032.17, false, 6),
  ('biz-125-es', 12, 1539.25, false, 7),
  ('elite-125', 80, 266.27, true, 1),
  ('elite-125', 60, 344.88, false, 2),
  ('elite-125', 48, 424.80, false, 3),
  ('elite-125', 36, 559.64, false, 4),
  ('elite-125', 24, 823.15, false, 5),
  ('elite-125', 18, 1091.17, false, 6),
  ('elite-125', 12, 1627.24, false, 7),
  ('biz-125-ex', 80, 311.76, true, 1),
  ('biz-125-ex', 60, 403.79, false, 2),
  ('biz-125-ex', 48, 497.36, false, 3),
  ('biz-125-ex', 36, 655.25, false, 4),
  ('biz-125-ex', 24, 963.76, false, 5),
  ('biz-125-ex', 18, 1277.57, false, 6),
  ('biz-125-ex', 12, 1905.22, false, 7),
  ('pcx-cbs', 80, 348.80, true, 1),
  ('pcx-cbs', 60, 451.77, false, 2),
  ('pcx-cbs', 48, 556.46, false, 3),
  ('pcx-cbs', 36, 733.10, false, 4),
  ('pcx-cbs', 24, 1078.27, false, 5),
  ('pcx-cbs', 18, 1429.37, false, 6),
  ('pcx-cbs', 12, 2131.59, false, 7),
  ('pcx-abs', 80, 382.60, true, 1),
  ('pcx-abs', 60, 495.55, false, 2),
  ('pcx-abs', 48, 610.38, false, 3),
  ('pcx-abs', 36, 804.14, false, 4),
  ('pcx-abs', 24, 1182.76, false, 5),
  ('start-160', 80, 320.92, true, 1),
  ('start-160', 60, 415.66, false, 2),
  ('start-160', 48, 511.98, false, 3),
  ('start-160', 36, 674.50, false, 4),
  ('start-160', 24, 992.08, false, 5),
  ('start-160', 18, 1315.11, false, 6),
  ('start-160', 12, 1961.20, false, 7),
  ('fan-160', 80, 350.18, true, 1),
  ('fan-160', 60, 453.56, false, 2),
  ('fan-160', 48, 558.66, false, 3),
  ('fan-160', 36, 736.00, false, 4),
  ('fan-160', 24, 1082.54, false, 5),
  ('fan-160', 18, 1435.02, false, 6),
  ('fan-160', 12, 2140.02, false, 7),
  ('titan-160', 80, 375.67, true, 1),
  ('titan-160', 60, 486.57, false, 2),
  ('titan-160', 48, 599.32, false, 3),
  ('titan-160', 36, 789.57, false, 4),
  ('titan-160', 24, 1161.33, false, 5),
  ('titan-160', 18, 1539.46, false, 6),
  ('titan-160', 12, 2295.77, false, 7),
  ('bros-160-cbs', 80, 407.87, true, 1),
  ('bros-160-cbs', 60, 528.28, false, 2),
  ('bros-160-cbs', 48, 650.70, false, 3),
  ('bros-160-cbs', 36, 857.25, false, 4),
  ('bros-160-cbs', 24, 1260.88, false, 5),
  ('bros-160-abs', 80, 425.48, true, 1),
  ('bros-160-abs', 60, 551.08, false, 2),
  ('bros-160-abs', 48, 678.78, false, 3),
  ('bros-160-abs', 36, 894.26, false, 4),
  ('bros-160-abs', 24, 1315.31, false, 5),
  ('crf-300f', 80, 441.24, true, 1),
  ('crf-300f', 60, 571.49, false, 2),
  ('crf-300f', 48, 703.93, false, 3),
  ('crf-300f', 36, 927.38, false, 4),
  ('crf-300f', 24, 1364.03, false, 5),
  ('xr-300l-tornado', 80, 552.88, true, 1),
  ('xr-300l-tornado', 60, 716.09, false, 2),
  ('xr-300l-tornado', 48, 882.03, false, 3),
  ('xr-300l-tornado', 36, 1162.02, false, 4),
  ('xr-300l-tornado', 24, 1709.15, false, 5),
  ('cb-300f-twister-cbs', 80, 452.61, true, 1),
  ('cb-300f-twister-cbs', 60, 586.22, false, 2),
  ('cb-300f-twister-cbs', 48, 722.07, false, 3),
  ('cb-300f-twister-cbs', 36, 951.28, false, 4),
  ('cb-300f-twister-cbs', 24, 1399.19, false, 5),
  ('cb-300f-twister-abs', 80, 470.23, true, 1),
  ('cb-300f-twister-abs', 60, 609.05, false, 2),
  ('cb-300f-twister-abs', 48, 750.18, false, 3),
  ('cb-300f-twister-abs', 36, 988.32, false, 4),
  ('cb-300f-twister-abs', 24, 1453.66, false, 5),
  ('xre-190', 80, 441.69, true, 1),
  ('xre-190', 60, 572.08, false, 2),
  ('xre-190', 48, 704.64, false, 3),
  ('xre-190', 36, 928.33, false, 4),
  ('xre-190', 24, 1365.42, false, 5),
  ('xre-300-sahara', 80, 567.52, true, 1),
  ('xre-300-sahara', 60, 735.06, false, 2),
  ('xre-300-sahara', 48, 905.40, false, 3),
  ('xre-300-sahara', 36, 1192.81, false, 4),
  ('xre-300-sahara', 24, 1754.43, false, 5),
  ('xre-300-sahara-adv', 80, 586.56, true, 1),
  ('xre-300-sahara-adv', 60, 759.72, false, 2),
  ('xre-300-sahara-adv', 48, 935.77, false, 3),
  ('xre-300-sahara-adv', 36, 1232.82, false, 4),
  ('xre-300-sahara-adv', 24, 1813.28, false, 5),
  ('honda-adv', 80, 472.44, true, 1),
  ('honda-adv', 60, 611.91, false, 2),
  ('honda-adv', 48, 753.71, false, 3),
  ('honda-adv', 36, 992.97, false, 4),
  ('honda-adv', 24, 1460.50, false, 5),
  ('cb-500-hornet', 72, 787.72, true, 1),
  ('nx-500', 72, 837.67, true, 1),
  ('cb-750-hornet', 72, 970.74, true, 1),
  ('trx-420-fourtrax', 72, 998.13, true, 1),
  ('cb-1000r-70', 72, 994.93, true, 1),
  ('nc-750x-abs-mt', 72, 1023.13, true, 1),
  ('cb-650r-e-clutch', 72, 1075.68, true, 1),
  ('crf-1100l-africa-twin-mt-70', 72, 1078.04, true, 1),
  ('xl-750-transalp', 72, 1182.81, true, 1)
  ) as dados (slug, parcelas, valor_parcela, destaque, ordem)
)
insert into public.planos_consorcio (
  moto_id,
  parcelas,
  valor_parcela,
  destaque,
  ordem,
  ativo
)
select
  moto.id,
  plano.parcelas,
  plano.valor_parcela,
  plano.destaque,
  plano.ordem,
  true
from planos as plano
join public.motos as moto on moto.slug = plano.slug
on conflict (moto_id, parcelas) do update set
  valor_parcela = excluded.valor_parcela,
  destaque = excluded.destaque,
  ordem = excluded.ordem,
  ativo = excluded.ativo;

with slugs as (
  select *
  from (
    values
    ('pop-110i-es'),
    ('pop-110i-es-com-emplacamento'),
    ('biz-125-es'),
    ('elite-125'),
    ('biz-125-ex'),
    ('pcx-cbs'),
    ('pcx-abs'),
    ('start-160'),
    ('fan-160'),
    ('titan-160'),
    ('bros-160-cbs'),
    ('bros-160-abs'),
    ('crf-300f'),
    ('xr-300l-tornado'),
    ('cb-300f-twister-cbs'),
    ('cb-300f-twister-abs'),
    ('xre-190'),
    ('xre-300-sahara'),
    ('xre-300-sahara-adv'),
    ('honda-adv'),
    ('cb-500-hornet'),
    ('nx-500'),
    ('cb-750-hornet'),
    ('trx-420-fourtrax'),
    ('cb-1000r-70'),
    ('nc-750x-abs-mt'),
    ('cb-650r-e-clutch'),
    ('crf-1100l-africa-twin-mt-70'),
    ('xl-750-transalp')
  ) as dados (slug)
)
insert into public.informacoes_financiamento (
  moto_id,
  titulo,
  descricao,
  observacao,
  ativo
)
select
  moto.id,
  'Solicite sua simulação',
  'Preencha seus dados abaixo para receber uma simulação personalizada de financiamento.',
  'A aprovação está sujeita à análise de crédito da instituição financeira.',
  true
from slugs
join public.motos as moto on moto.slug = slugs.slug
on conflict (moto_id) do update set
  titulo = excluded.titulo,
  descricao = excluded.descricao,
  observacao = excluded.observacao,
  ativo = excluded.ativo;

commit;

-- Conferência esperada:
-- motos_cadastradas = 29
-- planos_cadastrados = 127
with slugs as (
  select *
  from (
    values
    ('pop-110i-es'),
    ('pop-110i-es-com-emplacamento'),
    ('biz-125-es'),
    ('elite-125'),
    ('biz-125-ex'),
    ('pcx-cbs'),
    ('pcx-abs'),
    ('start-160'),
    ('fan-160'),
    ('titan-160'),
    ('bros-160-cbs'),
    ('bros-160-abs'),
    ('crf-300f'),
    ('xr-300l-tornado'),
    ('cb-300f-twister-cbs'),
    ('cb-300f-twister-abs'),
    ('xre-190'),
    ('xre-300-sahara'),
    ('xre-300-sahara-adv'),
    ('honda-adv'),
    ('cb-500-hornet'),
    ('nx-500'),
    ('cb-750-hornet'),
    ('trx-420-fourtrax'),
    ('cb-1000r-70'),
    ('nc-750x-abs-mt'),
    ('cb-650r-e-clutch'),
    ('crf-1100l-africa-twin-mt-70'),
    ('xl-750-transalp')
  ) as dados (slug)
)
select
  count(distinct moto.id) as motos_cadastradas,
  count(plano.id) filter (where plano.ativo) as planos_cadastrados
from slugs
join public.motos as moto on moto.slug = slugs.slug
left join public.planos_consorcio as plano on plano.moto_id = moto.id;
