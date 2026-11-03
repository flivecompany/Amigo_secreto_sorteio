// Lógica do sorteio de amigo secreto. Funciona no navegador e no Node (testes).
// Mesmas regras do amigo_secreto.py: uniforme, sem autossorteio,
// sem par mútuo por padrão e exclusões simétricas.

export class ErroSorteio extends Error {}

export function chave(nome) {
  return nome.normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .trim().replace(/\s+/g, " ").toLowerCase();
}

export function validarParticipantes(nomes) {
  const limpos = nomes.map((n) => n.trim().replace(/\s+/g, " "));
  if (limpos.some((n) => !n)) throw new ErroSorteio("Existe um nome vazio na lista.");
  const vistos = new Map();
  for (const nome of limpos) {
    const k = chave(nome);
    if (vistos.has(k)) {
      throw new ErroSorteio(`Nome duplicado: "${vistos.get(k)}" e "${nome}".`);
    }
    vistos.set(k, nome);
  }
  return limpos;
}

// Inteiro uniforme em [0, max) com gerador criptográfico, sem viés de módulo.
export function inteiroSeguro(max) {
  const limite = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do { globalThis.crypto.getRandomValues(buf); } while (buf[0] >= limite);
  return buf[0] % max;
}

function embaralhar(lista, aleatorio) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = aleatorio(i + 1);
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
}

export function sortear(nomes, {
  permitirParesMutuos = false,
  exclusoes = [],
  aleatorio = inteiroSeguro,
  maxTentativas = 200000,
} = {}) {
  const participantes = validarParticipantes(nomes);
  const n = participantes.length;
  const minimo = permitirParesMutuos ? 2 : 3;
  if (n < minimo) throw new ErroSorteio(`São necessários pelo menos ${minimo} participantes.`);

  const indice = new Map(participantes.map((nome, i) => [chave(nome), i]));
  const proibidos = new Set();
  for (const [a, b] of exclusoes) {
    const ia = indice.get(chave(a));
    const ib = indice.get(chave(b));
    if (ia === undefined || ib === undefined) {
      throw new ErroSorteio(`Exclusão com nome fora da lista: "${ia === undefined ? a : b}".`);
    }
    if (ia === ib) throw new ErroSorteio(`Exclusão inválida: "${a}" com ele mesmo.`);
    proibidos.add(`${ia}>${ib}`);
    proibidos.add(`${ib}>${ia}`);
  }

  const alvos = [...Array(n).keys()];
  for (let t = 0; t < maxTentativas; t++) {
    embaralhar(alvos, aleatorio);
    let ok = true;
    for (let i = 0; i < n && ok; i++) {
      if (alvos[i] === i || proibidos.has(`${i}>${alvos[i]}`)) ok = false;
      else if (!permitirParesMutuos && alvos[alvos[i]] === i) ok = false;
    }
    if (ok) return participantes.map((nome, i) => [nome, participantes[alvos[i]]]);
  }
  throw new ErroSorteio("Não foi possível achar um sorteio válido. Revise as exclusões.");
}

// Cada link carrega só os dados da própria pessoa, em base64url (UTF-8).
export function codificar(dados) {
  const bytes = new TextEncoder().encode(JSON.stringify(dados));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodificar(texto) {
  const b64 = texto.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const dados = JSON.parse(new TextDecoder().decode(bytes));
  if (typeof dados?.n !== "string" || typeof dados?.a !== "string") {
    throw new ErroSorteio("Link inválido.");
  }
  return dados;
}
