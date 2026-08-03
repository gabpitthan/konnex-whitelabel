# Whitelabel Whaticket — versão 1.25

Data: 2026-08-02
Estado: publicada

## Objetivo

Bloquear SSRF e DNS rebinding nas URLs externas não confiáveis usadas por
Typebot, fotos de perfil e anexos sociais.

## Pesquisa primária

- OWASP SSRF Prevention Cheat Sheet recomenda validar todos os A/AAAA e
  desabilitar redirects;
- Node documenta lookup customizado no `http.Agent` e `net.BlockList` para
  egress;
- Axios documenta `proxy:false`, agents, socket paths e `maxRedirects: 0`;
- IANA mantém os registros oficiais de endereços IPv4/IPv6 especiais.

Fontes:

- https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
- https://owasp.org/www-community/pages/controls/SSRF_Prevention_in_Nodejs
- https://nodejs.org/api/dns.html
- https://nodejs.org/api/http.html
- https://nodejs.org/api/net.html
- https://github.com/axios/axios
- https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml
- https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xhtml

## Baseline

- Typebot persiste URL por tenant; perfil/mídia vêm de provedores;
- validação sintática e limites 1.24 não impediam destino privado;
- redirects permitiam trocar destino após a validação;
- não há Typebot configurado na base atual, portanto não existe dependência
  observada de hostname interno ou porta privada.

## Mudança

- URL deve ser HTTP/HTTPS e não pode embutir credenciais;
- notações IPv4 alternativas são normalizadas pelo WHATWG URL;
- endereços IPv4/IPv6 privados, especiais, metadata e documentação são negados;
- todos os A/AAAA são validados em cada conexão;
- o IP aprovado é entregue ao socket, sem segunda resolução TOCTOU;
- respostas DNS mistas falham fechadas;
- proxy, socket path e redirects são desativados no cliente restrito;
- agents compartilhados limitam 32 sockets e 4 sockets livres por protocolo;
- Typebot, perfil e mídia usam exclusivamente o cliente restrito.

## Evidência

- 38 suítes/157 testes e ambos os builds aprovados;
- teste real: loopback e metadata retornaram `ERR_SSRF_BLOCKED`;
- destino público HTTPS respondeu 200;
- o teste real revelou e corrigiu o contrato Node 20 `all:true` antes do deploy;
- API 1.25 saudável e smoke aprovado;
- falha induzida em produção registrou somente código e classe de segurança,
  sem URL, IP, token ou tenant.

## Compatibilidade e rollback

URLs públicas continuam aceitas, inclusive portas públicas não padrão. Destino
interno, redirect e proxy passam a falhar deliberadamente. Não há migration.
Rollback: imagem 1.24.

## Como esta entrega ainda pode falhar?

- mudanças futuras no registro IANA exigem atualização da política;
- egress firewall continua sendo defesa complementar recomendada;
- provedor que dependa de redirect precisará expor URL final direta;
- contas externas reais e WhatsApp canário ainda não foram exercitados.
