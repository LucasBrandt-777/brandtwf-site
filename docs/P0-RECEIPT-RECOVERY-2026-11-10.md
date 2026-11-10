# P0 — conciliação de notificações e recuperação do formulário

Data: 09/11/2026, America/New_York; 10/11/2026 UTC.
Escopo: leitura de registros existentes e testes exclusivamente no QA. Nenhum pedido real novo, merge, publicação ou alteração de configuração de produção.

## Recebimento histórico confirmado

A conta `brandtwoodfinishing@gmail.com` foi acessada no navegador em nuvem após login realizado pelo usuário. O Chrome local estava em outra sessão Google; a divergência anterior era entre navegadores, não uma falha do login informado pelo usuário.

A interface Netlify já havia confirmado notificação por email para esse endereço em submissões de qualquer formulário. Nesta rodada foram conciliadas duas amostras:

| Formulário | Registro Netlify | Armazenamento UTC | Email exibido no Gmail |
| --- | --- | --- | --- |
| bwf-quote | nº 232, ID 6aee542f058f43b09eb3f223 | 2026-11-06T22:26:55.402Z | 06/11/2026, 17:26 local |
| bwf-kitchen-quote | nº 4, ID 6a91fbf3d2ee9953d7581c35 | 2026-08-28T21:21:55.801Z | 28/08/2026, 17:21 local |

Em ambas as amostras:
- remetente `formresponses@netlify.com`, destinatário `brandtwoodfinishing@gmail.com`;
- Gmail exibe mailed-by `smtp-out-ses.netlify.com`, signed-by `netlify.com` e TLS;
- endereço do solicitante e mensagem coincidem com o registro Netlify;
- formulário de cozinhas também coincide em source e tipo de serviço;
- data/hora são compatíveis na resolução de minuto apresentada pelo Gmail. Não foi calculada latência exata de entrega.

Na home, o assunto armazenado contém o modelo `New quote request — %{submissionId}`; no email o identificador aparece resolvido como 232. Isso é compatível com a mesma submissão.

Essas amostras comprovam armazenamento e entrega histórica dos dois formulários na versão publicada à época. Não são teste completo do candidato P0, não comprovam todos os envios e não conciliam um evento GA4/Ads individual. Não foram copiados nomes, contatos, mensagens de clientes, IPs, user agents ou capturas da caixa de entrada para o repositório.

A diferença de datas examinada antes permanece esclarecida: em bwf-quote, o último Verified é de 06/11; o registro de 08/11 aparece em Spam. Nenhuma reclassificação ou exclusão foi feita.

## QA — evidência direta no GA4

Ambiente: https://bwf-p0-qa-20261108.netlify.app
Propriedade: 563205212, medição G-21MY7L42JP. POSTs simulados; nenhum backend ou notificação real no QA atual.

No Chrome local:
1. A chegada a cozinhas com bloqueio anterior gerou `form_resubmit_blocked`.
2. O estado foi reiniciado pelo botão exclusivo QA.
3. O formulário foi visualizado e permaneceu vazio antes do preenchimento.
4. O DebugView recebeu `bwf_form_view` e `bwf_quote_click` em torno de 20:32 local. Só depois foi acionado o preenchimento fictício.
5. Parâmetros abertos individualmente:
   - form_view: `form_id=bwf-kitchen-quote`, `page_type=kitchens`, `page_location=https://bwf-p0-qa-20261108.netlify.app/custom/kitchens`;
   - quote_click: `cta_location=desktop_navigation`;
   - bloqueio inicial: `block_reason=recent_submission_on_load`.
6. Também foi observado `bwf_form_start`.

A janela observada nessa sessão local mostrou quatro eventos: um de cada tipo acima. Não somar essa janela às contagens históricas dos relatórios anteriores. Não foi possível confirmar nesta rodada no DebugView os eventos de envio/erro/sucesso do ensaio em nuvem descrito abaixo. A causa não foi determinada.

## QA — recuperação funcional sem recarga

O clique de envio com HTTP 500 no Chrome local abriu o alerta esperado, mas a automação passou a falhar em comandos de foco nessa aba mesmo após solicitar o fechamento do alerta. A recuperação nessa sessão local ficou inconclusiva; isso não demonstra falha do código do formulário.

O cenário foi realizado separadamente no Chrome em nuvem, no mesmo QA publicado, com dados fictícios:
1. HTTP 500 simulado: alerta de erro; contador de uma tentativa; campos preservados.
2. Alerta fechado, sem recarga; falha de rede simulada: segundo alerta e contador de duas tentativas.
3. Alerta fechado, ainda sem recarga; resposta HTTP 200 simulada: tela Thank You e contador de três tentativas.
4. Foram usados os mesmos valores; não houve novo preenchimento entre os erros e o sucesso.

Resultado: recuperação funcional após erro de servidor e de rede confirmada para o formulário de cozinhas no Chrome em nuvem. Não transformar a confirmação visual em prova de recebimento GA4, de backend real ou de notificação.

## QA — Voltar entre páginas

Foi preparada uma home sem bloqueio, preenchendo apenas o primeiro campo com dado fictício. Na mesma aba, a página de cozinhas recebeu um sucesso simulado. O botão Voltar retornou à URL da home, que apresentou a mensagem de pedido já realizado e ocultou o formulário.

Isso valida o bloqueio visível ao retornar entre URLs diferentes no Chrome em nuvem. Não foi demonstrado `pageshow.persisted=true`; portanto não encerrar a pendência de BFCache real nem extrapolar esse resultado para Safari físico. Não foi afirmada ausência de lead duplicado no GA4 com base apenas nessa tela.

O clique automatizado no link Explore Our Custom Kitchen Cabinets da home não produziu navegação observável nessa tentativa; a navegação do cenário foi feita pelo endereço de destino já verificado no link. O caso não foi reproduzido nem classificado como defeito do site. O relato do usuário de que os links funcionam permanece registrado.

## Alterações e preservações

- Sem mudanças no HTML/JS candidato, nas campanhas, orçamento, metas ou GA4/Ads de produção.
- Sem novas submissões de produção e sem envio de emails.
- Não foi necessário acessar a outra conta comercial para conciliar essas amostras.
- Não foram repetidas as suítes já registradas. Esta é evidência adicional de interface e integrações, não uma nova contagem de testes automatizados.
- PR continua em rascunho e sem merge.

## Pendências e decisão

1. Safari identificado (aparelho/iOS/sessão), Voltar entre páginas e BFCache real: relato positivo do usuário já registrado, validação independente ainda limitada.
2. Conciliação de um envio controlado do candidato P0 com armazenamento, classificação, email e generate_lead. O QA atual é simulado.
3. Entrega dos parâmetros de erro e ausência de lead adicional no cenário de recuperação/retorno ainda precisam ser conciliadas no DebugView.
4. Atribuição GA4 → Ads de uma conversão elegível continua separada; um envio orgânico ou um lead QA não prova atribuição Ads.

O roteiro de backend separado permanece em [P0-RECEIPT-ADS-CHECK-2026-11-09.md](P0-RECEIPT-ADS-CHECK-2026-11-09.md). O destinatário comercial agora foi confirmado por configuração e por recebimento histórico. A publicação de um backend QA real e os respectivos envios não foram realizados. Qualquer ensaio de produção continua exigindo autorização específica, além da aprovação da publicação P0.

**Recomendação: manter o PR em rascunho, sem publicar em brandtwf.com.** A entrega histórica é uma evidência positiva adicional, não substitui o ensaio do candidato.
