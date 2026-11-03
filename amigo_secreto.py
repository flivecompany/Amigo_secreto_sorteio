#!/usr/bin/env python3
"""Sorteio de amigo secreto pela linha de comando.

Regras do sorteio:
- Ninguém tira a si mesmo.
- Por padrão, não existe par mútuo (A tira B e B tira A).
- Pares de exclusão (ex.: casais) nunca tiram um ao outro.
- Todo resultado válido tem a mesma chance de sair (amostragem por rejeição
  sobre embaralhamentos completos, com gerador criptográfico).

Nenhum arquivo com o resultado completo é gravado. Assim, nem o organizador
consegue ver quem tirou quem.
"""
from __future__ import annotations

import argparse
import os
import re
import secrets
import sys
import unicodedata
from pathlib import Path
from typing import Iterable

MAX_TENTATIVAS_PADRAO = 200_000


class ErroSorteio(ValueError):
    """Entrada inválida ou restrições impossíveis de cumprir."""


def _chave(nome: str) -> str:
    """Normaliza um nome para comparação (sem acento, sem caixa, sem espaços extras)."""
    sem_acento = unicodedata.normalize("NFKD", nome)
    sem_acento = "".join(c for c in sem_acento if not unicodedata.combining(c))
    return " ".join(sem_acento.split()).casefold()


def validar_participantes(nomes: Iterable[str]) -> list[str]:
    """Limpa os nomes e recusa vazios e duplicados."""
    limpos = [" ".join(n.split()) for n in nomes]
    if any(not n for n in limpos):
        raise ErroSorteio("Existe um nome vazio na lista.")
    vistos: dict[str, str] = {}
    for nome in limpos:
        chave = _chave(nome)
        if chave in vistos:
            raise ErroSorteio(
                f"Nome duplicado: '{vistos[chave]}' e '{nome}'. Use nomes diferentes."
            )
        vistos[chave] = nome
    return limpos


def sortear(
    nomes: Iterable[str],
    *,
    permitir_pares_mutuos: bool = False,
    exclusoes: Iterable[tuple[str, str]] = (),
    rng: secrets.SystemRandom | None = None,
    max_tentativas: int = MAX_TENTATIVAS_PADRAO,
) -> dict[str, str]:
    """Retorna um dicionário {quem tira: quem foi tirado}."""
    participantes = validar_participantes(nomes)
    n = len(participantes)
    minimo = 2 if permitir_pares_mutuos else 3
    if n < minimo:
        raise ErroSorteio(f"São necessários pelo menos {minimo} participantes.")

    indice = {_chave(nome): i for i, nome in enumerate(participantes)}
    proibidos: set[tuple[int, int]] = set()
    for a, b in exclusoes:
        try:
            ia, ib = indice[_chave(a)], indice[_chave(b)]
        except KeyError as erro:
            raise ErroSorteio(f"Exclusão com nome fora da lista: {erro.args[0]!r}.") from None
        if ia == ib:
            raise ErroSorteio(f"Exclusão inválida: '{a}' com ele mesmo.")
        proibidos.add((ia, ib))
        proibidos.add((ib, ia))

    rng = rng or secrets.SystemRandom()
    alvos = list(range(n))
    for _ in range(max_tentativas):
        rng.shuffle(alvos)
        if any(alvos[i] == i or (i, alvos[i]) in proibidos for i in range(n)):
            continue
        if not permitir_pares_mutuos and any(alvos[alvos[i]] == i for i in range(n)):
            continue
        return {participantes[i]: participantes[alvos[i]] for i in range(n)}

    raise ErroSorteio(
        "Não foi possível achar um sorteio válido. "
        "As exclusões provavelmente tornam o sorteio impossível."
    )


# ---------------------------------------------------------------- entrada/saída

def limpar_tela() -> None:
    """Limpa a tela e o histórico de rolagem do terminal."""
    if os.name == "nt":
        os.system("cls")  # comando fixo, sem dados do usuário
    else:
        sys.stdout.write("\033[2J\033[3J\033[H")
        sys.stdout.flush()


def ler_arquivo_participantes(caminho: Path) -> list[str]:
    """Lê um nome por linha. Linhas vazias e linhas com '#' no início são ignoradas."""
    linhas = caminho.read_text(encoding="utf-8").splitlines()
    return [l.strip() for l in linhas if l.strip() and not l.strip().startswith("#")]


def ler_participantes_interativo() -> list[str]:
    print("Digite um nome por linha. Deixe a linha vazia para terminar.")
    nomes: list[str] = []
    while True:
        nome = input(f"Participante {len(nomes) + 1}: ").strip()
        if not nome:
            return nomes
        nomes.append(nome)


def interpretar_exclusao(texto: str) -> tuple[str, str]:
    partes = [p.strip() for p in texto.split(",")]
    if len(partes) != 2 or not all(partes):
        raise ErroSorteio(f"Exclusão inválida: '{texto}'. Use o formato 'Nome1,Nome2'.")
    return partes[0], partes[1]


def nome_de_arquivo(nome: str) -> str:
    base = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode()
    base = re.sub(r"[^A-Za-z0-9]+", "_", base).strip("_")
    return base or "participante"


def gravar_arquivos(resultado: dict[str, str], pasta: Path) -> list[Path]:
    """Grava um arquivo por participante. Cada arquivo só tem o amigo daquela pessoa."""
    pasta.mkdir(parents=True, exist_ok=True)
    gravados: list[Path] = []
    usados: set[str] = set()
    for quem, amigo in resultado.items():
        base = nome_de_arquivo(quem)
        nome, k = base, 2
        while nome.casefold() in usados:
            nome, k = f"{base}_{k}", k + 1
        usados.add(nome.casefold())
        caminho = pasta / f"{nome}.txt"
        caminho.write_text(
            f"Olá, {quem}!\nSeu amigo secreto é: {amigo}\n", encoding="utf-8"
        )
        gravados.append(caminho)
    return gravados


def revelar_na_tela(resultado: dict[str, str]) -> None:
    ordem = list(resultado)
    for posicao, quem in enumerate(ordem, start=1):
        limpar_tela()
        input(f"[{posicao}/{len(ordem)}] Chame {quem}. Só {quem} deve olhar a tela.\n"
              "Pressione ENTER para ver o resultado.")
        print(f"\n{quem}, seu amigo secreto é: {resultado[quem]}\n")
        input("Memorize e pressione ENTER para esconder.")
    limpar_tela()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Sorteio de amigo secreto.")
    parser.add_argument("-a", "--arquivo", type=Path,
                        help="arquivo .txt com um participante por linha")
    parser.add_argument("-e", "--excluir", action="append", default=[], metavar="A,B",
                        help="A e B não tiram um ao outro (pode repetir)")
    parser.add_argument("--permitir-pares", action="store_true",
                        help="permite A tirar B e B tirar A")
    parser.add_argument("-p", "--pasta", type=Path,
                        help="grava um arquivo por pessoa nesta pasta, em vez de mostrar na tela")
    args = parser.parse_args(argv)

    try:
        nomes = (ler_arquivo_participantes(args.arquivo) if args.arquivo
                 else ler_participantes_interativo())
        exclusoes = [interpretar_exclusao(e) for e in args.excluir]
        resultado = sortear(nomes, permitir_pares_mutuos=args.permitir_pares,
                            exclusoes=exclusoes)
    except (ErroSorteio, OSError) as erro:
        print(f"Erro: {erro}", file=sys.stderr)
        return 1

    print(f"\nSorteio feito com {len(resultado)} participantes: {', '.join(resultado)}.")
    if args.pasta:
        arquivos = gravar_arquivos(resultado, args.pasta)
        print(f"{len(arquivos)} arquivos gravados em '{args.pasta}'.")
        print("Envie cada arquivo só para a pessoa certa. Não abra os arquivos.")
    else:
        input("Pressione ENTER para começar a revelação.")
        revelar_na_tela(resultado)
    print("Sorteio encerrado. Divirta-se!")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (KeyboardInterrupt, EOFError):
        print("\nSorteio cancelado.")
        sys.exit(130)
