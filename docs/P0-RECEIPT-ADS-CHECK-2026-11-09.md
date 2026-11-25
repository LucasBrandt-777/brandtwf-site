# P0 — recebimento Netlify, leitura Ads e roteiro controlado

Data: 09/11/2026, America/New_York.
Escopo desta rodada: leitura das integrações e preparação do próximo ensaio; nenhum envio real, alteração de configuração, merge ou publicação.

## Evidências obtidas

### Netlify
Projeto de produção: warm-choux-79901d (9102359e-10e2-4756-9128-32370f73ccb9).
Forms aparece habilitado. Deploy publicado continua 6ae601f8804528edd98589bf, ready.

| Formulário | ID cadastrado | submission_count retornado |
| --- | --- | ---: |
| bwf-quote | 69cc4d8fbccecc00080e21ef | 57 |
| bwf-kitchen-quote | 6a1a3dae5701780008486576 | 4 |

Os campos cadastrados correspondem aos nomes enviados pelo candidato P0, incluindo source em cozinhas e subject nos dois formulários. form-name é o campo de roteamento. Ambos têm honeypot; não há reCAPTCHA cadastrado.

A consulta de submissões confirma registros históricos armazenados. Não é teste do código P0 ainda não publicado. O conector retornou mais registros que o limit=1 solicitado; não foi tratado como prova de paginação ou de leitura completa de todas as classificações. Não foram copiados conteúdos, nomes, emails, telefones, IPs ou user agents de clientes para este relatório.

Há uma diferença a esclarecer: o metadado last_submission_at da home aponta 08/11/2026, enquanto a lista retornada começa em 06/11/2026. Spam, escopo da lista ou cache são hipóteses; não há evidência suficiente para declarar perda de pedido. A integração não oferece parâmetro state=spam. Conferir a classificação e o destinatário de notificação pela interface quando a conexão voltar.

O projeto QA c62a6626-686d-47fe-bea3-d7a9c0682366 retorna lista vazia de Forms, compatível com seu desenho: POST simulado e ausência de armazenamento/notificação reais.

### Email
O Gmail conectado é a conta pessoal do responsável, distinta do endereço comercial exibido no site. Duas buscas restritas a avisos Netlify/assuntos Quote, entre 05 e 09/11, não retornaram mensagens. O destinatário efetivamente configurado no Netlify não foi acessado nesta rodada. Resultado inconclusivo para entrega: ausência nessa caixa não comprova falha de notificação.

### Google Ads por Windsor.ai — somente leitura
Conta conectada: 213-582-1992, Brandt Wood Finishing.
GA4 conectado à integração: propriedade de produção 445397731; a QA 563205212 não está disponível nessa integração.

O plano atual não permite force_refresh. A consulta foi repetida sem atualização forçada, portanto os resultados abaixo são do cache da integração; horário exato da captura na origem não foi informado.

| Campo | Valor retornado |
| --- | --- |
| customer_auto_tagging_enabled | True |
| conversion_action_name | www.brandtwf.com (web) generate_lead |
| conversion_action_primary_for_goal | True |
| conversion_action_counting_type | ONE_PER_CLICK |
| conversion_action_status | ENABLED |
| conversion_action_type | UNKNOWN |

A primeira consulta de metadados não aceitou a combinação com ID e datas de último recebimento. A consulta reduzida de 09/11 retornou zero linhas. Ampliar a janela para 10/10–09/11, com include_inactive=true, retornou a ação acima e outras quatro. Isso não é inventário completo de ações; não inferir exclusão de ações ausentes.

Os valores são compatíveis com a leitura do painel em 08/11 para Principal e Uma conversão. A origem GA4 foi vista diretamente em 08/11, mas não foi reconfirmada por essa API, que retornou UNKNOWN. Nenhuma configuração foi alterada. A marcação automática ativa, isoladamente, não comprova preservação dos identificadores em redirecionamentos nem atribuição de um pedido específico.

### Código candidato preservado
Hashes Git blob conferidos:
- index.html: be57569885c2dfaee577560916911cb429316865
- custom/kitchens.html: 7b67361e44366a4c66ab8cfee984b0b0e6d28887
- bwf-funnel-v1.js: e2d1bd799049293868b720950f6cce19b3ab83f3

Não houve alteração de implementação nesta rodada. Nenhuma suíte foi reexecutada.

## Bloqueio operacional
Duas chamadas ao navegador conectado ficaram sem resposta, inclusive a tentativa de consultar orientação de recuperação. Foram encerradas as esperas. Não houve troca para outro navegador ou sessão. Assim ficaram pendentes nesta rodada: recuperação após HTTP 500 sem recarga, form_view de cozinhas em navegação pausada, correlação Safari/Voltar, painel de spam/notificações e leitura direta GA4 → Ads.

## Roteiro preparado — com limites separados

### 1. Concluir QA atual, sem backend real
- No navegador conectado: reiniciar somente o estado QA, navegar pausadamente ao formulário de cozinhas e conferir bwf_form_view.
- Testar HTTP 500 e recuperação sem recarga; esperar alerta ser fechado; conferir botão reabilitado e dados preservados; trocar para HTTP 200 e exigir um único generate_lead.
- Inspecionar error_type/error_code, block_reason e cta_location no DebugView.
- Para Safari: identificar modelo/iOS, formulário e horário; fazer uma sequência por vez e conciliar a sessão, incluindo Voltar entre páginas. O relato positivo já registrado não será apagado nem confundido com observação independente.
- Esta etapa já está autorizada e continua sem pedidos reais.

### 2. Ensaio de armazenamento e notificação em backend QA separado
É possível validar Netlify e email em outro backend QA, sem tocar produção. O projeto atual não oferece isso e não deve perder silenciosamente sua garantia de envio simulado.

Preparação necessária antes da execução:
- definir o projeto/URL de recebimento e manter o fluxo atual simulado;
- cadastrar cópias dos dois formulários com os mesmos nomes/campos, medição exclusivamente QA e sem Ads;
- definir o destinatário real de teste e conferir a notificação/confirmacão exigida pela plataforma;
- revisar o pacote e obter autorização específica para sua publicação e envio.

Proposta de dados: nome BWF Validation; identificador BWF-P0-QA-<UTC>-HOME ou KITCHEN; email real do responsável previamente confirmado; serviço válido do formulário; cidade Winter Garden; mensagem completa: “This is an authorized Brandt Wood Finishing QA submission to verify form storage and notification delivery. No customer estimate or follow-up is requested. Reference: <identificador>.”
Não usar email de cliente. Manter honeypot vazio. Proposta de quantidade: uma submissão por formulário, sem repetição automática.

Conciliação:
1. registrar hora UTC/local, URL, formulário, estado prévio do bloqueio e marcador;
2. observar uma requisição POST e resposta HTTP;
3. localizar a submissão e sua classificação no projeto correto; se ausente, conferir Spam antes de repetir;
4. confirmar chegada do aviso ao destinatário esperado e comparar formulário, marcador e horário;
5. conferir um generate_lead no GA4 QA correspondente; nenhuma conversão no Ads real;
6. testar recarga/Voltar sem criar outro POST/lead.
HTTP 2xx sem registro e notificação não encerra o teste. Não apagar registros automaticamente.

### 3. Ensaio controlado em produção
Continua exigindo autorização específica. Uma submissão na versão atualmente publicada valida apenas essa versão e o recebimento atual; não valida o P0. Não usar esse ensaio como justificativa para publicar código ainda não aprovado.

Após publicação P0 aprovada separadamente, proposta inicial: um único pedido marcado BWF TESTE CONTROLADO P0 <UTC>, com contato do responsável definido, pela home. Conferir registro/classificação/notificação e exatamente um generate_lead em produção. O formulário de cozinhas requer verificação própria, sem alegar cobertura pelo ensaio da home.

### 4. Ads é uma verificação de atribuição separada
- Conferir em leitura vínculo com a propriedade 445397731, origem/nome da ação, Primary, ONE_PER_CLICK e marcação automática.
- Confirmar preservação de identificadores elegíveis pelos redirecionamentos; não inventar GCLID nem clicar anúncio próprio.
- Conciliar uma conversão real elegível observada e aguardar o processamento dos relatórios. Um envio direto orgânico não garante conversão atribuída no Ads.
- Não importar eventos/leads QA, criar novas conversões principais ou alterar campanhas/lances/metas.

## Recomendação
Manter o PR em rascunho e produção no mesmo deploy. Retomar a conexão com o navegador e identificar a caixa de notificação antes de executar a conciliação externa. Os resultados positivos já obtidos no QA permanecem válidos dentro do escopo registrado.

## Referências oficiais consultadas
- Google: https://support.google.com/google-ads/answer/2375435
- Marcação automática: https://support.google.com/google-ads/answer/3095550
- Netlify submissões: https://docs.netlify.com/manage/forms/submissions/
- Netlify notificações: https://docs.netlify.com/manage/forms/notifications/
- Netlify diagnóstico: https://docs.netlify.com/manage/forms/troubleshooting-tips/
