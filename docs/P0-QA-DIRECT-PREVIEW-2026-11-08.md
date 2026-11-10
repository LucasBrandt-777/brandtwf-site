# P0 — preparação da verificação direta no navegador

Data local: 8 de novembro de 2026, America/New_York.
Estado: pacote de teste preparado e verificado offline; publicação temporária ainda não autorizada nem executada.

## O que esta continuação verificou

- O PR #4 continuava aberto, em rascunho, sem merge, no head `adb4f6aedecd2888531cf8639a6ac317aa82b4cc`.
- O fluxo QA `16300023394` continua apontando para `G-21MY7L42JP`. A interface mostra “Nenhum dado foi recebido nas últimas 48 horas” e “A coleta de dados não está ativa”. Não foi demonstrada ingestão dos envios anteriores.
- A propriedade tem um filtro `Internal Traffic`, operação Excluir, estado **Teste**. Não foi encontrado filtro em estado Ativo nessa tabela. Nenhum filtro foi alterado.
- A interface da tag QA `GTM-M7QTNQ2N` mostra zero alterações pendentes. O único diagnóstico exibido menciona taxa de consentimento de publicidade de 0%. O ensaio negou explicitamente consentimentos de publicidade e concedeu `analytics_storage`. O aviso é compatível com a configuração deliberada; não demonstra a causa da ausência de eventos GA4. Nenhum consentimento foi modificado no painel.
- `https://bwf.test` é servido apenas pelo interceptador do ensaio automatizado. Não existe um endereço QA publicado e acessível ao Chrome conectado ou ao iPhone. Isso impede completar Tag Assistant e Safari direto com o ambiente existente; **não prova que o domínio explique a falha de processamento anterior**.

Não foram gerados novos eventos Google nesta continuação. Não houve nova propriedade, vínculo Ads, lead real, merge ou deploy.

## Cópia preparada para a próxima etapa

O gerador [build-qa-preview.cjs](../scripts/build-qa-preview.cjs) parte dos mesmos cinco blobs de código do commit `ab61141c387fc6af9f533896c68b0a2fb693aa98` e exige hashes idênticos. Ele escreve uma cópia fora do repositório e não sobrescreve uma pasta existente.

Conteúdo: home, cozinhas, FAQ, avaliações, funil existente, proteção QA, manifesto, regras HTTP e robots. O pacote gerado tem aproximadamente 812 KiB (ZIP 500.732 bytes). Os arquivos HTML/JS candidatos e o `netlify.toml` de produção não foram modificados.

A cópia de teste contém:

- ID GA4 exclusivo `G-21MY7L42JP`, `debug_mode: true` em configuração e eventos; configurações Ads removidas.
- `page_location` calculada pela origem/caminho QA, sem parâmetros da URL. A cópia anterior do ensaio preservava a URL fixa de produção em cozinhas; isso foi corrigido **na nova cópia QA**, sem alterar o código candidato. A URL de página é um parâmetro, não o destino do envio: esse achado não indica tráfego de teste enviado à propriedade de produção.
- Consentimento de Analytics concedido e consentimentos de publicidade negados, restritos ao ambiente de teste.
- Formulários sem os atributos de detecção Netlify; POSTs tratados em memória como HTTP 200, HTTP 500 ou falha de rede, selecionados num painel visível.
- `form-action 'none'` para impedir fallback de envio nativo. Nenhum backend de captura ou notificação é incluído.
- `fetch` e `sendBeacon` restringidos ao transporte de coleta QA e às ferramentas de depuração. Coletores exigem `tid=G-21MY7L42JP`; o endpoint `www.google.com/g/collect` foi incluído na cópia, além de Google Analytics, conforme as dependências documentadas. Isso é ajuste do ambiente de teste, não uma conclusão sobre a causa anterior.
- CSP limitada aos recursos necessários ao site/Google Analytics/Tag Assistant; sem domínios de conversão Ads. Não há API secret, credencial ou dados de clientes no pacote.
- Banner de TESTE, preenchimento fictício opcional e reinício apenas do bloqueio armazenado na origem QA. Links para fora da origem de teste são impedidos durante a navegação comum.
- `noindex`, `nofollow`, `noarchive`, `robots.txt` e cache desativado. **Isso não é controle de acesso**: sem proteção adicional, qualquer pessoa com a URL temporária poderá abrir a cópia.
- Imagens locais substituídas por placeholders para manter o pacote pequeno. Textos, campos e lógica do funil permanecem; a cópia não serve como aceite visual completo das galerias.

O gerador e a proteção não publicam nada. As regras QA estão somente dentro da pasta gerada; o `netlify.toml` do repositório original é preservado.

```sh
node scripts/build-qa-preview.cjs /tmp/bwf-p0-qa-preview
```

ZIP preparado localmente: `BWF-P0-QA-Preview.zip`.
SHA-256: `9f4024b66e77c9cfa1572c9904c981b6313f6a25b38e6ba3ec774ae927839632`.

## Verificação realizada

[qa-preview-safety.cjs](../tests/qa-preview-safety.cjs) usa um servidor HTTP efêmero restrito a `127.0.0.1` e Chromium isolado. Todos os recursos Google são interceptados; zero tráfego encaminhado ao GA4/Ads. GSAP é servido pelo pacote local durante esse teste. A execução final ocorreu às **19:17:04–19:17:20 EST de 08/11** (os timestamps JSON estão em UTC de 09/11).

**Seis verificações de integração aprovadas**, três por formulário:

| Critério | Home | Cozinhas |
| --- | --- | --- |
| Destino QA, debug, URL da origem local e ausência de detecção Netlify | Passou | Passou |
| Simulações HTTP/rede/sucesso, um lead por sucesso e zero POSTs no servidor | Passou | Passou |
| Destinos não permitidos recusados, recarga sem outro lead e com bloqueio | Passou | Passou |

[Log final](qa/p0-qa-preview-safety-20261108.json): `PASS`, zero erros JavaScript, zero POSTs reais, zero requisições Google encaminhadas. Sintaxe dos scripts conferida. Esses testes verificam o isolamento da nova cópia; não substituem a suíte anterior de 57 testes nem demonstram processamento GA4, Tag Assistant ou Safari físico.

## Ação concreta pendente de autorização

Disponibilizar **somente esta cópia** em um projeto temporário separado no Netlify, usando um endereço próprio de teste, sem domínio `brandtwf.com`, sem conexão com formulários reais e sem vínculo Ads. Não usar Deploy Preview do projeto de produção com os HTMLs originais, pois eles ainda apontam para a medição de produção. Não publicar a branch P0 inteira como está.

A autorização deve abranger a criação/publicação dessa cópia temporária e o acesso por link. A autorização anterior cobre dados sintéticos na propriedade QA, mas a instrução do usuário mantém publicação no Netlify pendente de aprovação específica.

Depois dessa autorização:

1. Conectar Tag Assistant à URL QA e confirmar tag/destino, consentimento e eventuais bloqueios CSP.
2. Fazer um ensaio pequeno e observar imediatamente o mesmo dispositivo no DebugView. Só declarar coleta validada quando eventos e parâmetros aparecerem; não usar apenas resposta HTTP.
3. Exercitar os dois formulários, um sucesso simulado por formulário e bloqueio após recarga/Voltar. Atualizar o PR com o que efetivamente chegar ao GA4.
4. Usar a mesma cópia no iPhone Safari para o critério físico ainda pendente.

Recebimento/armazenamento Netlify, notificação e importação real Ads permanecem etapas separadas. A cópia preparada simula o backend e não valida esses itens. Publicação do site principal e mudanças de produção continuam não autorizadas.

## Referências oficiais consultadas

- [Monitor events in DebugView](https://support.google.com/analytics/answer/7201382): ativação do modo debug e observação do dispositivo.
- [Troubleshoot with Tag Assistant](https://support.google.com/tagmanager/answer/10039345): conexão a uma URL HTTP/HTTPS e diagnóstico.
- [Google tag setup](https://developers.google.com/tag-platform/gtagjs): implementações existentes continuam suportadas; não foi proposta migração de produção para GTM nesta etapa.
- [Content Security Policy](https://developers.google.com/tag-platform/security/guides/csp): origens necessárias para GA4 e Preview Mode. As políticas adicionais pertencem exclusivamente à cópia QA.
