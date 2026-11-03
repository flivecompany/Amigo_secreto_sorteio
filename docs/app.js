// Interface da página: tela do organizador e tela do participante.
import { sortear, codificar, decodificar, ErroSorteio } from "./sorteio.js";

const $ = (id) => document.getElementById(id);
const base = location.origin + location.pathname;

function mostrar(id) {
  for (const s of ["organizar", "participante", "invalido"]) $(s).hidden = s !== id;
}

function telaParticipante(dados) {
  mostrar("participante");
  if (dados.g) { $("grupoTitulo").textContent = dados.g; document.title = dados.g; }
  $("ola").textContent = `Olá, ${dados.n}!`;
  $("amigo").textContent = dados.a;
  $("revelar").onclick = () => { $("escondido").hidden = true; $("revelado").hidden = false; };
  $("esconder").onclick = () => { $("escondido").hidden = false; $("revelado").hidden = true; };
}

function lerExclusoes(texto) {
  return texto.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const partes = l.split(",").map((p) => p.trim());
    if (partes.length !== 2 || !partes[0] || !partes[1]) {
      throw new ErroSorteio(`Exclusão inválida: "${l}". Use o formato: Ana, Bruno`);
    }
    return partes;
  });
}

async function copiar(texto, nome) {
  try {
    await navigator.clipboard.writeText(texto);
    $("copiado").textContent = `Link de ${nome} copiado.`;
  } catch {
    prompt(`Copie o link de ${nome}:`, texto);
  }
}

function telaOrganizador() {
  mostrar("organizar");
  $("form").onsubmit = (ev) => {
    ev.preventDefault();
    $("erro").hidden = true;
    try {
      const nomes = $("nomes").value.split("\n").map((l) => l.trim()).filter(Boolean);
      const grupo = $("grupo").value.trim();
      const pares = sortear(nomes, {
        permitirParesMutuos: $("pares").checked,
        exclusoes: lerExclusoes($("exclusoes").value),
      });
      const lista = $("links");
      lista.replaceChildren();
      for (const [nome, amigo] of pares) {
        const dados = { n: nome, a: amigo };
        if (grupo) dados.g = grupo;
        const link = `${base}#${codificar(dados)}`;
        const texto = `Olá, ${nome}! Seu link do amigo secreto${grupo ? ` (${grupo})` : ""}: ${link}`;

        const li = document.createElement("li");
        const span = document.createElement("span");
        span.className = "nome"; span.textContent = nome;
        const bCopiar = document.createElement("button");
        bCopiar.type = "button"; bCopiar.textContent = "Copiar link";
        bCopiar.onclick = () => copiar(link, nome);
        const aZap = document.createElement("a");
        aZap.className = "btn"; aZap.textContent = "WhatsApp";
        aZap.href = `https://wa.me/?text=${encodeURIComponent(texto)}`;
        aZap.target = "_blank"; aZap.rel = "noopener noreferrer";
        li.append(span, bCopiar, aZap);
        lista.append(li);
      }
      $("form").hidden = true;
      $("resultado").hidden = false;
    } catch (e) {
      $("erro").textContent = e instanceof ErroSorteio ? e.message : "Erro inesperado.";
      $("erro").hidden = false;
      if (!(e instanceof ErroSorteio)) console.error(e);
    }
  };
  $("novo").onclick = () => {
    if (!confirm("Um novo sorteio invalida os links já enviados. Continuar?")) return;
    $("links").replaceChildren(); $("copiado").textContent = "";
    $("resultado").hidden = true; $("form").hidden = false;
  };
}

const hash = location.hash.slice(1);
if (hash) {
  try { telaParticipante(decodificar(hash)); } catch { mostrar("invalido"); }
} else {
  telaOrganizador();
}
