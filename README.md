# Amigo Secreto — Sorteio

Script em Python 3 para sortear amigo secreto pela linha de comando.
Usa só a biblioteca padrão. Não precisa instalar nada.

## Regras do sorteio

- Ninguém tira a si mesmo.
- Ninguém forma par mútuo (A tira B e B tira A). Use `--permitir-pares` para liberar.
- Pares de exclusão (ex.: casais) nunca tiram um ao outro.
- Todo resultado válido tem a mesma chance de sair.
- O sorteio usa gerador criptográfico (`secrets`).
- Nenhum arquivo com o resultado completo é gravado.

## Como usar

Modo interativo (digite os nomes, linha vazia termina):

```bash
python3 amigo_secreto.py
```

Com lista em arquivo (um nome por linha, `#` comenta a linha):

```bash
python3 amigo_secreto.py --arquivo participantes.txt
```

Com exclusões (pode repetir):

```bash
python3 amigo_secreto.py -a participantes.txt -e "Ana,Bruno" -e "Carla,Diego"
```

Um arquivo por pessoa, para enviar por mensagem:

```bash
python3 amigo_secreto.py -a participantes.txt --pasta resultado
```

## Revelação na tela

Cada pessoa vê só o próprio resultado.
O script limpa a tela e o histórico de rolagem após cada pessoa.

## Testes

```bash
python3 -m unittest -v
```

## Origem

Ideia inspirada em [juliarizza/script-amigo-secreto](https://github.com/juliarizza/script-amigo-secreto) (MIT).
O código desta versão foi escrito do zero.
