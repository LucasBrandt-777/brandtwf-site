# P0 — validação complementar e envio controlado

Data: 6 de novembro de 2026, America/New_York.
Status: validação isolada ampliada; validação externa pendente; publicação não autorizada.

## Origem e evidências verificadas

- Retomado o PR #4, sem reiniciar a auditoria: aberto, rascunho, sem merge.
- Commit de entrada: `44bf66de5d814b66ed80ed1ea5e3b6d38052a5a5`.
  Os oito arquivos do P0 local correspondem aos hashes consultados no GitHub.
- Os 45 testes anteriores foram reexecutados: 45 aprovados, 0 falhas.
- Leitura do Netlify confirmou o deploy publicado `6ae601f8804528edd98589bf`,
  commit `a07d072825e790af897019507b0d2b28539ee402`, branch `main`.
- O projeto acessível é `warm-choux-79901d`, ID `9102359e-10e2-4756-9128-32370f73ccb9`,
  domínio `brandtwf.com`. A listagem acessível não apresentou um projeto de teste.
- Os formulários registrados são `bwf-quote` (`69cc4d8fbccecc00080e21ef`) e
  `bwf-kitchen-quote` (`6a1a3dae5701780008486576`); ambos têm honeypot.
  Seus nomes/campos são compatíveis com os dois formulários da branch.
  Essa leitura de metadados não comprova armazenamento ou notificação do novo código.
- A conexão Windsor apresentou somente a propriedade GA4 `445397731`,
  `www.brandtwf.com`, e a conta Ads `213-582-1992`. Nenhuma propriedade de teste
  foi identificada nessa conexão. Isso não prova que uma propriedade de teste inexista.
- A tentativa de abrir a interface do Analytics para localizar a propriedade de teste
  foi rejeitada pela revisão automática de acesso: o destino não identificava uma
  propriedade de teste e poderia abrir dados privados/produção. Nenhum contorno foi usado.

## Falha reproduzida e correção

Ao restaurar uma página do cache Voltar/Avançar (BFCache), o navegador pode manter
o DOM e o estado JavaScript antigos. A inicialização do módulo não é executada novamente.
Se o visitante abriu a home, enviou o formulário de cozinhas e voltou à home em cache,
o código anterior não atualizava a tela para o bloqueio de 24 horas já gravado.

Reprodução determinística: nos dois HTMLs reais em jsdom, gravar a chave compartilhada
após a inicialização e disparar `pageshow` com `persisted: true`. Os dois testes falharam
no código anterior: `form.style.display` permaneceu vazio; esperado `none`.
**Esta reprodução simula o ciclo de vida; não é evidência de BFCache real nem de Safari.**

A proteção no momento do envio já consultava a chave; não foi demonstrado um segundo
POST nesse cenário. O defeito confirmado era de sincronização da tela e da medição do
bloqueio: o visitante podia preencher um formulário que seria recusado no envio.

Correção em `bwf-funnel-v1.js`: ouvir `pageshow` persistido, revalidar o bloqueio e mostrar
a confirmação existente. Emitir `form_resubmit_blocked` com
`block_reason=recent_submission_on_restore` somente ao ocultar o formulário ainda aberto.
Não reiniciar a trava de envio em andamento, nem repetir início, visualização ou lead.
`checkView()` continua permitindo registrar a primeira exposição se ela ainda não ocorreu.

Não foram alterados HTML, CSS, campos, serviços, prazo de 24 horas, destinos GA4/Ads,
`netlify.toml` ou o critério HTTP de `generate_lead`. O arquivo v1 ainda não foi publicado;
por isso seu nome permanece. Uma revisão após publicação exige outro nome por causa do cache.

## Cobertura e limites

Resultado final: **57 testes aprovados, 0 falhas, 0 ignorados** — 41 de integração
DOM e 16 em Chromium. A suíte final inclui os 45 testes originais. Sintaxe JavaScript
e `git diff --check` também aprovados. [Saída da execução](qa/p0-20261106-tests.txt).
Os dois testes que demonstram a falha anterior estão em
[reprodução antes da correção](qa/p0-20261106-restore-before.txt).

| Verificação | Resultado e alcance |
| --- | --- |
| Regressão inicial | 37 testes DOM + 8 Chromium reexecutados e aprovados |
| Sincronização ao restaurar cache | Dois testes de regressão simulados; falhavam antes da correção |
| Requisição em andamento ao restaurar | Dois testes simulados; mantêm um POST e um lead |
| Voltar/Avançar antes/depois de envio | Quatro testes Chromium, home/cozinhas em 1365px e 390px |
| Voltar ao outro formulário após envio | Dois testes Chromium em 390px; bloqueio compartilhado, sem novo lead |
| Entrada direta por fragmento e falha de rede | Dois testes Chromium em 390px; exposição única ao rolar, erro sem lead, retry com um lead |
| Safari no iPhone | Pendente; o navegador conectado é Chrome, sem dispositivo iPhone disponível |
| BFCache real | Pendente; Chromium headless shell recarrega a página; o Chromium completo não iniciou devido à restrição de socket do ambiente |
| WebKit Linux | Não executado; binário obtido, mas faltam bibliotecas do sistema e a instalação de dependências falhou |
| Tag Assistant / DebugView | Pendente; falta propriedade de teste identificada e acesso a ela |
| Netlify + notificação + GA4 + Ads | Pendente; nenhum envio real foi feito |

Os testes Chromium de histórico usam `goBack`/`goForward` reais, mas com recarga do
documento. **Não equivalem ao BFCache real ou a Safari no iPhone.** O teste móvel usa
largura de tela; não emula o sistema operacional iOS.

Todos os POSTs e recursos externos dos testes aprovados são interceptados. Google
gtag.js recebe uma resposta vazia; os eventos são inspecionados na fila `dataLayer`.
Não há comprovação de entrega ao Google. As imagens são placeholders; isso não é
uma nova validação visual completa. O GSAP original é servido localmente.

Comandos reproduzíveis (Node 24, jsdom 26.1.0, Playwright 1.56.1, GSAP 3.12.5):

```sh
npm install --prefix /tmp/bwf-p0-qa --no-audit --no-fund jsdom@26.1.0 playwright@1.56.1 gsap@3.12.5
node /tmp/bwf-p0-qa/node_modules/playwright/cli.js install chromium --only-shell
NODE_PATH=/tmp/bwf-p0-qa/node_modules node --test tests/funnel.test.cjs tests/browser.test.cjs
node --check bwf-funnel-v1.js
git diff --check
```

## Próximo ensaio — separar coleta, recebimento e atribuição

| Etapa | Isolamento e evidência exigidos | Limite de execução |
| --- | --- | --- |
| Safari físico | Cópia do commit num ambiente isolado, iPhone/iOS/Safari identificados; testar home e cozinhas, toque, teclado, entrada direta, erro/retry, Voltar/Avançar e cache | Pode testar localmente sem dados reais; nenhuma publicação Netlify autorizada |
| Coleta Google | Propriedade/stream de teste e Measurement ID confirmados; Tag Assistant e DebugView com eventos/parâmetros | Pode usar a propriedade de teste identificada; não enviar à propriedade de produção |
| Recebimento Netlify | Projeto de teste separado, dois formulários detectados, notificação para endereço do responsável confirmado | Preparado, não executado; falta destino de teste e autorização de publicação/envio |
| Configuração GA4 → Ads | Consulta somente de leitura da origem GA4, propriedade, nome da ação, status Primary, regras paralelas e eventos diagnósticos | Não alterar metas, vínculos ou campanhas; leitura precisa ter acesso permitido |
| Atribuição Ads real | Conciliação de leads reais elegíveis e dos relatórios após publicação autorizada | Um teste direto/sem interação elegível com anúncio não comprova atribuição |

### Preparação de uma cópia isolada

1. Fixar o commit revisado e registrar seu SHA. Usar um projeto de teste separado;
   uma URL de preview por si só não comprova isolamento de formulários ou notificações.
2. Na **cópia de teste**, substituir todas as referências a `G-XZQ389ZLRW`, inclusive
   `send_to` no módulo, pelo Measurement ID confirmado de teste. Remover a configuração
   `AW-16641705674`. Conferir destinos adicionais/conectados em Tag Assistant.
   Não alterar esses IDs na branch de produção candidata a publicação.
3. Ativar `debug_mode` somente na cópia de teste. DebugView não transforma a propriedade
   de produção em ambiente isolado; não modificar filtros de produção para viabilizar QA.
4. Primeiro manter o POST simulado para validar a coleta real de eventos de teste.
   Conferir clique, exposição, preenchimento, envio, erros, bloqueio e um único
   `generate_lead` por resposta simulada OK; conferir ausência de dados pessoais.
   Esse passo valida Google, mas não Netlify.
5. Antes de liberar POST real, identificar nome/ID/URL do projeto de teste, dois form IDs,
   destinatário da notificação, propriedade/stream e garantia de ausência de destino Ads
   de produção. Se precisar criar/publicar o ambiente, solicitar essa autorização
   específica. Não publicar no projeto BWF atual para fazer o ensaio.

### Envio controlado proposto (ainda não executado)

- Quantidade: **dois pedidos**, um por formulário, cada um em um contexto limpo separado,
  para respeitar o bloqueio compartilhado de 24 horas sem mudá-lo.
- Marcadores propostos: `BWF-P0-QA-20261106-HOME-01` e
  `BWF-P0-QA-20261106-KITCHEN-01` no campo mensagem/subject resultante.
- Nome de QA e mensagem declarando que é um teste autorizado, sem pedido de serviço.
  Usar um e-mail real de QA pertencente ao responsável, a confirmar antes do envio;
  endereços fictícios podem alterar a classificação de spam. Não usar dados de clientes.
- Registrar hora UTC e America/New_York, página, form name, resposta HTTP, número de POSTs,
  ID da submissão armazenada, classificação Verified/Spam, recebimento da notificação
  e horário do `generate_lead`/`form_id` no DebugView da propriedade de teste.
- Conciliar por formulário, marcador no registro/notificação e intervalo de tempo.
  Não enviar e-mail, nome ou descrição aos eventos GA4. O marcador não precisa ser
  uma dimensão nova no GA4 nem uma alteração no contrato de produção.
- HTTP OK com registro ausente, classificação inesperada ou notificação não recebida
  é resultado incompleto; investigar antes de repetir. Evitar POSTs sucessivos de diagnóstico.
- Recarregar, Voltar/Avançar e tentar reenvio: esperar zero novos POSTs/`generate_lead`
  no mesmo contexto após sucesso. Um request em andamento não deve ser destravado ao voltar.
- Não disparar notificações a clientes; não apagar dados ou mudar spam/metas automaticamente.

### Limite da conciliação com Ads

Coleta no GA4, vínculo/importação configurada e atribuição de conversão no Ads são
evidências distintas. Um lead sintético de acesso direto pode aparecer no GA4 sem
aparecer como conversão atribuída no Ads. Não fabricar GCLID nem clicar no próprio
anúncio para forçar o teste. A documentação Google informa que dados importados podem
levar até 24 horas; não concluir falha imediatamente nem usar esse prazo como garantia.

Após autorização futura de publicação, a conciliação de produção deve observar leads
reais elegíveis, preservando janela, critérios de contagem, fuso e modelos de atribuição.
Se um ensaio em produção for indispensável, obter autorização específica para o destino,
quantidade de envios, dados, notificação e tráfego GA4 antes de executá-lo. Isso continua
separado da autorização de merge/publicação e não autoriza alteração de campanhas.

## Recomendação

Manter o PR em rascunho. A correção de restauração e os testes isolados são úteis,
mas não substituem Safari físico, BFCache real, coleta Google e recebimento/notificação
Netlify. Não recomendar liberação de produção enquanto essas evidências faltarem.
Manter `[skip netlify]` no título do PR e em todos os commits enviados à branch.

## Referências primárias consultadas

- [Google/web.dev — BFCache e pageshow](https://web.dev/articles/bfcache)
- [Google — DebugView](https://support.google.com/analytics/answer/7201382)
- [Google — importação de eventos GA4 para Ads](https://support.google.com/google-ads/answer/2375435)
- [Netlify — pular deploys](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/#skip-a-deploy)
- [Netlify — formulários](https://docs.netlify.com/manage/forms/setup/)
