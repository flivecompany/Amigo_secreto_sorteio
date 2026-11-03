// [FLIVE IA] Testes da lógica web. Rodar: node --test tests/sorteio.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { sortear, codificar, decodificar, ErroSorteio } from "../docs/sorteio.js";

const NOMES = ["Ana", "Bruno", "Carla", "Diego", "Elisa", "Fábio"];

test("[FLIVE IA] todos tiram e são tirados uma vez, sem autossorteio nem par mútuo", () => {
  for (let k = 0; k < 500; k++) {
    const r = new Map(sortear(NOMES));
    assert.deepEqual([...r.keys()].sort(), [...NOMES].sort());
    assert.deepEqual([...r.values()].sort(), [...NOMES].sort());
    for (const [a, b] of r) {
      assert.notEqual(a, b);
      assert.notEqual(r.get(b), a);
    }
  }
});

test("[FLIVE IA] exclusão vale nos dois sentidos", () => {
  for (let k = 0; k < 500; k++) {
    const r = new Map(sortear(NOMES, { exclusoes: [["Ana", "bruno"]] }));
    assert.notEqual(r.get("Ana"), "Bruno");
    assert.notEqual(r.get("Bruno"), "Ana");
  }
});

test("[FLIVE IA] distribuição uniforme", () => {
  const n = 45000, c = new Map();
  for (let k = 0; k < n; k++) {
    const chave = sortear(["A", "B", "C", "D"], { permitirParesMutuos: true }).map((p) => p[1]).join("");
    c.set(chave, (c.get(chave) || 0) + 1);
  }
  assert.equal(c.size, 9);
  for (const v of c.values()) assert.ok(Math.abs(v / n - 1 / 9) < 0.01);
});

test("[FLIVE IA] recusa entradas inválidas", () => {
  assert.throws(() => sortear(["Ana", "Bruno"]), ErroSorteio);
  assert.throws(() => sortear(["Ana", "ana ", "Bruno"]), ErroSorteio);
  assert.throws(() => sortear(NOMES, { exclusoes: [["Ana", "Zé"]] }), ErroSorteio);
  assert.throws(() => sortear(["A", "B", "C"], { exclusoes: [["A", "B"], ["A", "C"]], maxTentativas: 1000 }), ErroSorteio);
});

test("[FLIVE IA] link codifica e decodifica com acentos e emoji", () => {
  const dados = { n: "João Ávila", a: "Márcia 🎁", g: "Família" };
  const texto = codificar(dados);
  assert.match(texto, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(decodificar(texto), dados);
  assert.throws(() => decodificar(codificar({ x: 1 })), ErroSorteio);
});
