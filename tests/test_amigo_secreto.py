"""[FLIVE IA] Testes do sorteio de amigo secreto. Rodar: python3 -m unittest -v"""
import random
import sys
import tempfile
import unittest
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from amigo_secreto import ErroSorteio, gravar_arquivos, sortear  # noqa: E402

NOMES = ["Ana", "Bruno", "Carla", "Diego", "Elisa", "Fábio"]


class TesteSorteioFliveIA(unittest.TestCase):
    """[FLIVE IA] Regras do sorteio."""

    def test_flive_ia_todos_tiram_e_sao_tirados_uma_vez(self):
        r = sortear(NOMES)
        self.assertEqual(set(r), set(NOMES))
        self.assertEqual(sorted(r.values()), sorted(NOMES))

    def test_flive_ia_ninguem_tira_a_si_mesmo(self):
        for _ in range(500):
            r = sortear(NOMES)
            self.assertTrue(all(a != b for a, b in r.items()))

    def test_flive_ia_sem_par_mutuo_por_padrao(self):
        for _ in range(500):
            r = sortear(NOMES)
            self.assertTrue(all(r[r[a]] != a for a in r))

    def test_flive_ia_exclusao_vale_nos_dois_sentidos(self):
        for _ in range(500):
            r = sortear(NOMES, exclusoes=[("Ana", "bruno")])
            self.assertNotEqual(r["Ana"], "Bruno")
            self.assertNotEqual(r["Bruno"], "Ana")

    def test_flive_ia_distribuicao_uniforme(self):
        # 4 pessoas com pares mútuos permitidos: 9 resultados válidos, ~11,1% cada.
        rng = random.Random(42)
        n = 45_000
        c = Counter(tuple(sortear("ABCD", permitir_pares_mutuos=True, rng=rng).values())
                    for _ in range(n))
        self.assertEqual(len(c), 9)
        for freq in c.values():
            self.assertAlmostEqual(freq / n, 1 / 9, delta=0.01)

    def test_flive_ia_recusa_entradas_invalidas(self):
        with self.assertRaises(ErroSorteio):
            sortear(["Ana", "Bruno"])  # 2 pessoas sem par mútuo é impossível
        with self.assertRaises(ErroSorteio):
            sortear(["Ana"], permitir_pares_mutuos=True)
        with self.assertRaises(ErroSorteio):
            sortear(["Ana", "ana ", "Bruno"])  # duplicado
        with self.assertRaises(ErroSorteio):
            sortear(["Ana", "", "Bruno"])
        with self.assertRaises(ErroSorteio):
            sortear(NOMES, exclusoes=[("Ana", "Zé")])

    def test_flive_ia_restricoes_impossiveis_terminam_com_erro(self):
        exclusoes = [("A", "B"), ("A", "C")]  # A só poderia tirar ninguém
        with self.assertRaises(ErroSorteio):
            sortear("ABC", exclusoes=exclusoes, max_tentativas=1000)

    def test_flive_ia_arquivo_individual_tem_so_o_proprio_amigo(self):
        r = sortear(NOMES)
        with tempfile.TemporaryDirectory() as pasta:
            arquivos = gravar_arquivos(r, Path(pasta))
            self.assertEqual(len(arquivos), len(NOMES))
            for caminho in arquivos:
                texto = caminho.read_text(encoding="utf-8")
                citados = [n for n in NOMES if n in texto]
                self.assertEqual(len(citados), 2)  # o dono e o amigo dele


if __name__ == "__main__":
    unittest.main()
