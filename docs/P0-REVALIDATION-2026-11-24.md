# BWF Intelligence P0 — revalidação de 24/11/2026

**Data de referência:** 24 de novembro de 2026, America/New_York; parte das evidências foi coletada em 25/11 UTC. **Estado:** verificações locais aprovadas; PR permanece em rascunho; liberação de produção não autorizada.

## 1. Resultado e escopo

A P0 continua preparada na branch `dev/p0-ga4-conversion-funnel`. A suíte existente foi reexecutada: **57 testes funcionais aprovados, sem falhas ou ignorados**, mais **6 verificações de segurança do pacote QA**. O código candidato não foi alterado. A comparação com o GitHub confirmou a origem dos arquivos testados; a geração local da cópia QA reproduziu os 11 arquivos de implantação da branch QA existente.

O site principal continua no deploy de 31/10, com o código anterior à P0. Os bloqueios restantes são de validação externa: recebimento e notificação reais do candidato, Safari/BFCache e reconciliação de coleta/atribuição. O QA atual simula envios e tem Netlify Forms desabilitado, portanto não pode comprovar o recebimento real. Nenhum merge, publicação de produção, alteração de campanhas ou orçamento faz parte desta revalidação.

## 2. GitHub: versão e verificações remotas

Fonte: [PR #4](https://github.com/LucasBrandt-777/brandtwf-site/pull/4), [comparação da P0](https://github.com/LucasBrandt-777/brandtwf-site/compare/main...dev/p0-ga4-conversion-funnel) e consultas da API fixadas no commit abaixo.

| Item | Estado verificado antes de registrar este checkpoint |
| --- | --- |
| Repositório | `LucasBrandt-777/brandtwf-site` |
| PR | #4 aberto, `draft=true`, `merged=false`, `auto_merge=null` |
| Branch | `dev/p0-ga4-conversion-funnel` → `main` |
| Head testado | `3fbc8e429de6e64102480747d826af7277e956b0` |
| Base | `a07d072825e790af897019507b0d2b28539ee402` |
| Divergência | 17 commits à frente; 0 atrás da base; sem conflito indicado |
| Status/check runs | Nenhum status de commit ou check run retornado para esse head |
| GitHub Actions | Nenhum workflow acionado por PR retornado para esse head |
| Automação no código | Árvore não contém `.github/workflows` nem `package.json` |
| Revisões | Nenhuma revisão ou discussão inline pendente retornada |
| Proteção de deploy | Título conserva `[skip netlify]`; ausência de preview da P0 é compatível com esse bloqueio intencional |

**Ausência de checks não significa aprovação automática nem teste falhando.** Os resultados desta rodada foram produzidos no ambiente local, não por uma pipeline do GitHub. A consulta de workflows utilizada cobre os acionados por PR; o resultado vazio não é inventário de toda execução histórica do repositório. A condição mecânica de merge também não constitui autorização de liberação.

Foram verificados **32 arquivos não binários**, comparando o hash Git de cada arquivo com a árvore do head remoto: nenhuma divergência. O ambiente anterior tinha referência Git local indisponível; a validação usou uma cópia isolada reconstruída por correspondência de hashes e pelos arquivos atuais do conector. Nenhum conteúdo de produção foi sobrescrito.

## 3. Testes efetivamente reexecutados

| Verificação | Resultado | Alcance |
| --- | --- | --- |
| Integração DOM | **41/41** | Campos reais dos HTMLs; geometria e ciclo de vida simulados |
| Chromium | **16/16** | Renderização, desktop/móvel, validação nativa, retry, bloqueio compartilhado, Voltar/Avançar com recarga |
| Segurança da cópia QA | **6/6** | Destino QA/debug/URL; erro HTTP/rede/sucesso simulados; bloqueio de destinos indevidos e novo lead após recarga |
| Sintaxe de arquivos JS/CJS | **8/8** | Parser sem executar scripts com tráfego real |
| Sintaxe inline | **11 scripts em 4 páginas** | Nenhum erro de parsing |
| Integridade dos arquivos de execução | **15/15** | Testes, scripts e fontes sem alteração durante a execução |

Os **57 testes** são 41 DOM + 16 Chromium e incluem a suíte histórica anteriormente ampliada de 45. As seis verificações QA e os checks de sintaxe são complementares; não devem ser apresentados como dezenas de novos testes funcionais independentes.

Versões reproduzidas: Node `24.22.3`, jsdom `26.1.0`, Playwright `1.56.1`, GSAP `3.12.5` e Chromium `141.0.7390.37`. As dependências originais foram recuperadas para evitar atribuir diferenças de versão ao candidato.

Todos os POSTs de formulário e recursos Google dessas suítes foram interceptados: **zero pedidos reais e zero requisições Google encaminhadas pelos testes**. A segurança QA rodou numa cópia descartável, porque o script original grava nomes de evidência datados de 08/11; as evidências históricas foram preservadas. Imagens simplificadas e fila `dataLayer` servem ao teste funcional, não a uma nova aprovação visual integral ou prova de processamento no GA4.

**Limitação de navegador:** WebKit não estava instalado; o Chromium completo do sistema não iniciou devido à restrição de socket do ambiente. O Chromium headless shell executou a suíte. `pageshow.persisted` no DOM é simulado, e os testes de histórico Chromium usam recarga; nenhum desses resultados comprova Safari físico ou restauração real por BFCache.

## 4. Instrumentação GA4 e preservação do site

Fonte: [módulo revisado, no head testado](https://github.com/LucasBrandt-777/brandtwf-site/blob/3fbc8e429de6e64102480747d826af7277e956b0/bwf-funnel-v1.js) e [contrato do funil](https://github.com/LucasBrandt-777/brandtwf-site/blob/3fbc8e429de6e64102480747d826af7277e956b0/docs/P0-GA4-FUNNEL.md).

| Evento | Comportamento confirmado no código/testes |
| --- | --- |
| `bwf_quote_click` | 13 CTAs: home 6, cozinhas 4, FAQ 1, avaliações 2 |
| `bwf_form_view` | Exposição de ao menos metade do primeiro campo, ancestrais visíveis; uma vez por documento |
| `bwf_form_start` | Primeiro preenchimento não vazio; foco isolado não conta |
| `bwf_form_submit` | Tentativa válida, sem honeypot e liberada pelas travas |
| `bwf_form_error` | Validação, erro HTTP ou rede, sem converter erro em lead |
| `form_resubmit_blocked` | Pedido em andamento ou trava recente, inclusive após restauração |
| `generate_lead` | Um emissor, após resposta HTTP bem-sucedida; não é emitido no honeypot, bloqueio ou erro |

O módulo roteia explicitamente os eventos para `G-XZQ389ZLRW`. A proteção em memória e no armazenamento precede a medição; falhas de analytics não devem impedir a confirmação ou convidar a outro POST. Os eventos personalizados não incluem valores pessoais dos campos. Os grupos de serviço são derivados de opções fixas.

As chamadas diretas `conversion` sem label foram retiradas dos handlers; a configuração base Ads permanece conforme o escopo. A existência das chamadas antigas não prova dupla contagem histórica. FAQ agora inicializa GA4. O legado `main.js` não é carregado nessas páginas e não representa um segundo handler ativo.

As quatro páginas foram comparadas com a base obtida novamente no GitHub. Removendo scripts, comentários e atributos de tracking, e normalizando espaços, os hashes SHA-256 do markup são idênticos. Isso confirma preservação de CSS, textos visíveis e campos nesse escopo. Os quatro serviços continuam presentes. A comparação exclui scripts, inclusive JSON-LD, e não substitui avaliação visual ou testes de configurações remotas Google.

**Pendência de qualidade preexistente:** `generate_lead` conserva `value: 1` sem `currency`, combinação já presente nos dois formulários da base. A [referência Google de `generate_lead`](https://developers.google.com/analytics/devguides/collection/ga4/reference/events#generate_lead) exige moeda quando há valor. Não interpretar esse `1` como receita, USD 1 ou avaliação aprovada do lead. É uma decisão posterior de medição: retirar o valor monetário ou definir valor real e moeda aprovados. A revisão não inventou valuation nem alterou o evento.

## 5. Netlify e correspondência do QA

| Ambiente | Resultado da consulta atual |
| --- | --- |
| Produção `brandtwf.com` | Projeto `warm-choux-79901d`; site `9102359e-10e2-4756-9128-32370f73ccb9` |
| Deploy de produção | `6ae601f8804528edd98589bf`, `ready`, branch `main`, commit `a07d072...`; publicado em **31/10/2026 às 10:58 EDT / 14:58 UTC** |
| QA separado | `bwf-p0-qa-20261108`; site `c62a6626-686d-47fe-bea3-d7a9c0682366` |
| Deploy QA | `6af116fa883ac33a58543b4e`, `ready`, branch `qa/p0-browser-preview`, commit `973d9c902e9aab63d574fb93b0fe057a203b7db2`; publicado em **08/11 às 19:42 local / 09/11 às 00:42 UTC** |
| Forms QA | Não habilitado; lista de formulários vazia; POSTs simulados pelo cliente |
| Filas/revisão de deploy | Nenhum item retornado nos filtros consultados; nenhuma publicação iniciada |

Fontes: [deploy principal](https://app.netlify.com/sites/9102359e-10e2-4756-9128-32370f73ccb9/deploys/6ae601f8804528edd98589bf), [deploy QA](https://app.netlify.com/sites/c62a6626-686d-47fe-bea3-d7a9c0682366/deploys/6af116fa883ac33a58543b4e) e [QA existente](https://bwf-p0-qa-20261108.netlify.app).

O contexto Netlify chamado `production` no projeto QA indica seu domínio próprio; **não significa publicação da P0 em `brandtwf.com`**. O SHA da branch QA é diferente porque ela contém a cópia transformada para testes. Os cinco hashes de fontes do manifesto coincidem com o candidato atual; regenerar essa cópia produziu **11/11 arquivos de implantação idênticos** à árvore remota QA. O arquivo adicional `.gitignore` é metadado do repositório e não é gerado pelo empacotador; não houve divergência nos 11 arquivos produzidos.

Os dois formulários de produção continuam registrados, com nomes compatíveis com os HTMLs candidatos. Foi consultada apenas a existência e a atividade desses formulários, sem ler conteúdo de clientes. Essa atividade pertence ao código anterior e não certifica o recebimento da P0. O único erro de deploy retornado era um build cancelado de 24/05, sem relação com a P0. Configurações completas de build e logs integrais não são expostos pelos métodos consultados.

## 6. GA4: leitura de produção e seus limites

Foi realizada consulta somente de leitura da propriedade de produção para o período de 17 a 23/11/2026. Ela confirma coleta da instrumentação anterior; o site permanece no commit `a07d072`. Contagens operacionais detalhadas não integram este registro público. `event_count` mede ocorrências, não pessoas únicas; `form_start` e `bwf_form_start` não devem ser somados como interessados distintos. Ausência de linhas num relatório vale para a janela consultada e pode ter limitações de cache.

O conector disponível expõe apenas a propriedade de produção. A QA `563205212`, tag `G-21MY7L42JP`, não está entre suas contas conectadas. Os registros anteriores de DebugView/Tag Assistant permanecem evidência datada, sem substituir nova coleta ao vivo. Importação configurada no Ads, evento recebido no GA4 e conversão atribuída a anúncio são comprovações diferentes. Nenhuma ação na conta Ads foi executada nesta rodada.

## 7. Verificações atuais no navegador

Foi possível acessar no Chrome conectado a propriedade **BWF - QA P0 - TESTE**, ID `563205212`, na tela DebugView. O estado inicial mostrava zero eventos de depuração nos últimos 30 minutos. A página pública de QA abriu, identificou a tag exclusiva `G-21MY7L42JP` e exibiu o painel de teste com envio simulado. Não havia destinos Ads nos scripts inspecionados; a equivalência do pacote completo foi confirmada separadamente por hashes.

Na home QA, foram acionados o CTA de navegação, o preenchimento fictício e uma resposta HTTP 500 simulada. O painel registrou **uma tentativa simulada e zero pedidos reais**. Os campos permaneceram preenchidos e o botão voltou a ficar habilitado. O alerta nativo interrompeu uma chamada de automação. A tentativa seguinte, após selecionar HTTP 200, não teve sucesso confirmado; o último estado observado ainda mostrava uma tentativa. Não foi emitida conclusão de defeito do produto com base nessa interrupção.

O DebugView chegou a mostrar um agregado de **3 eventos**, mas nomes, parâmetros e correlação com o ensaio não foram inspecionados. Em seguida, a conexão do navegador deixou de responder, inclusive à tentativa de leitura de diagnóstico. A alternativa em nuvem abriu a página de login do Analytics; não foi iniciada nova autenticação. O QA público continuou acessível nessa alternativa e ficou disponível para revisão.

**Resultado atual: revalidação direta dos sete eventos incompleta.** Nenhum novo `generate_lead` foi confirmado no DebugView nesta rodada. As comprovações diretas registradas em 08/11 permanecem históricas. Os 57 testes locais aprovados e o teste de recuperação offline não substituem a conciliação ao vivo pendente. Nenhuma configuração GA4 foi modificada; nenhum pedido real ou notificação foi enviado.

## 8. Bloqueios e próximo passo concreto

| Prioridade | Pendência | Evidência necessária para encerrar |
| --- | --- | --- |
| 1 | Recebimento real do candidato | POST controlado → submissão Netlify identificada/classificada → notificação recebida → um `generate_lead` no GA4 QA |
| 2 | Safari e BFCache | Aparelho/iOS/Safari identificados; home/cozinhas; retorno entre páginas, restauração real, erro/retry e nenhum pedido/lead extra |
| 3 | Reconciliação Google/Ads | Coleta/parâmetros conciliados e, após eventual liberação autorizada, observação de lead real elegível para atribuição |
| Posterior | Automação e valor monetário | Pipeline reproduzível sem deploy e decisão explícita sobre `value`/`currency` |

### Ensaio de recebimento preparado para revisão

O próximo avanço é preparar **uma cópia QA separada com backend Forms habilitado**, sem tocar no projeto principal e sem transformar o QA simulado atual em produção. Antes da execução, fixar o commit candidato, confirmar projeto/URL, os dois nomes/IDs de formulário e o destinatário de teste do responsável já registrado no projeto. Manter GA4 exclusivamente na propriedade **`563205212` / `G-21MY7L42JP`**, sem links ou destinos Ads reais; conferir os destinos antes do primeiro envio.

Planejar exatamente **dois envios**, um da home e um de cozinhas, em contextos limpos separados para respeitar a regra compartilhada de 24h. Usar dados sintéticos e marcadores inequívocos de QA no conteúdo enviado ao formulário, sem encaminhar esses dados pessoais/textos para analytics. Registrar hora local/UTC, form name, número de POSTs, resposta HTTP, ID e classificação da submissão, recebimento/horário da notificação e evento/parâmetros correspondentes no GA4 QA. Recarregar e testar Voltar/Avançar: nenhum POST ou lead adicional esperado após sucesso.

Se HTTP retornar sucesso mas faltar registro ou notificação, o resultado continua incompleto; investigar antes de repetir. Não fabricar GCLID, clicar no próprio anúncio ou criar conversão para forçar atribuição. Um envio direto de QA não demonstra conversão atribuída no Ads.

**Limite de autorização preservado:** as decisões anteriores exigem autorização específica para novos envios reais e alterações de configuração necessárias a esse ensaio. O plano acima torna a etapa concreta e revisável; ela não foi executada por esta revalidação técnica. A autorização de QA permanece separada de merge/publicação principal, campanhas e orçamento.

## Evidências de suporte e referências

Resultados desta rodada: [evidências técnicas e logs](qa/p0-20261124/). Incluem o resumo das suítes, as saídas DOM/Chromium, a segurança QA, verificações de sintaxe, integridade e paridade, e a comparação do markup. Metadados de submissões e contagens operacionais de Analytics foram mantidos fora deste registro público.

Referências primárias: [Google — roteamento `send_to`](https://developers.google.com/tag-platform/gtagjs/routing); [Google — DebugView](https://support.google.com/analytics/answer/7201382); [Google — importação Analytics/Ads](https://support.google.com/google-ads/answer/2375435); [Google/web.dev — BFCache](https://web.dev/articles/bfcache); [Netlify — submissão de formulários](https://docs.netlify.com/manage/forms/setup/); [Netlify — controle de deploys](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/).

**Recomendação vigente:** manter o PR em rascunho. Os testes reexecutados e a paridade do QA reduzem a incerteza do código; os bloqueios acima continuam necessários para uma decisão de liberação fundamentada.
