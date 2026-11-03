// Serve a página do sorteio em aflive.com.br/Amigo_secreto_sorteio/
// Os arquivos vêm da pasta docs/ (Workers Static Assets).
const PREFIXO = "/Amigo_secreto_sorteio";

const CABECALHOS = {
  "Content-Security-Policy":
    "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; " +
    "img-src 'self' data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Robots-Tag": "noindex",
  "Cache-Control": "no-cache",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Aceita qualquer combinação de maiúsculas e minúsculas no caminho.
    if (!url.pathname.toLowerCase().startsWith(PREFIXO.toLowerCase())) {
      return new Response("Não encontrado", { status: 404 });
    }
    let resto = url.pathname.slice(PREFIXO.length);

    // Sem a barra final, "./sorteio.js" apontaria para a raiz do domínio.
    if (resto === "" || url.pathname.slice(0, PREFIXO.length) !== PREFIXO) {
      url.pathname = PREFIXO + (resto || "/");
      return Response.redirect(url.toString(), 301);
    }
    if (resto === "/") resto = "/index.html";

    const resposta = await env.ASSETS.fetch(new URL(resto, url.origin));
    const final = new Response(resposta.body, resposta);
    for (const [k, v] of Object.entries(CABECALHOS)) final.headers.set(k, v);
    return final;
  },
};
