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

## Versão web (links por pessoa)

A pasta `docs/` tem uma página que não precisa de servidor.
1. Abra a página e digite os nomes.
2. Clique em **Sortear**.
3. Envie cada link só para o dono dele (botão **WhatsApp** ou **Copiar link**).

Cada link carrega só o resultado daquela pessoa, depois do `#`.
O que vem depois do `#` não é enviado ao servidor.

**Limite:** quem abre um link vê o resultado daquela pessoa. Isso inclui o organizador.

## Testes

```bash
python3 -m unittest -v
```

```bash
node --test tests/sorteio.test.mjs
```

## Origem

Ideia inspirada em [juliarizza/script-amigo-secreto](https://github.com/juliarizza/script-amigo-secreto) (MIT).
O código desta versão foi escrito do zero.
