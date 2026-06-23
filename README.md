# Disparador Local de Mensagens WhatsApp

Aplicativo local em Node.js para enviar mensagens personalizadas pelo WhatsApp Web usando:

- `clientes.csv` como base de destinatários.
- `texto.md` como modelo da mensagem.
- sessão local persistida em `.wwebjs_auth`.
- logs locais em `logs/`.

O envio só acontece depois da pré-validação dos arquivos e da validação do número no WhatsApp via `client.getNumberId()`.

## Requisitos

- Windows 10 ou Windows 11.
- Node.js LTS.
- Google Chrome ou Microsoft Edge instalado.
- WhatsApp ativo no celular para escanear o QR Code na primeira execução.

## Instalação

Na pasta do projeto:

```powershell
cd C:\LOCAL\whatsapp
npm install
```

Valide a instalação sem iniciar envio:

```powershell
npm run check
```

Se estiver tudo certo, a saída será parecida com:

```text
Pré-validação RCF concluída. Clientes: 1.
```

## Arquivos de Configuração

### `clientes.csv`

O arquivo deve existir na raiz do projeto e conter obrigatoriamente as colunas:

```csv
nome,telefone,conta
Jean Carlo,19982495248,12345
```

Colunas extras também podem ser usadas no template. Exemplo:

```csv
nome,telefone,conta,agencia
Jean Carlo,19982495248,12345,0001
```

### `texto.md`

O arquivo deve existir na raiz do projeto e contém a mensagem enviada.

Variáveis usam o formato `${nome}`, `${telefone}`, `${conta}` ou qualquer outra coluna do CSV:

```markdown
Boa tarde ${nome}!

Relativo à sua conta ${conta}, podemos falar agora?
```

Se uma variável não existir no CSV, ela será substituída por vazio e registrada em `logs/avisos.csv`.

### `.env` opcional

O projeto tenta encontrar automaticamente Chrome ou Edge no Windows. Se precisar indicar o navegador manualmente, crie um arquivo `.env`:

```env
PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

Também é possível ajustar o intervalo aleatório entre envios:

```env
MIN_DELAY_MS=8000
MAX_DELAY_MS=20000
```

## Execução

Faça uma validação antes de enviar:

```powershell
npm run check
```

Inicie o disparador:

```powershell
npm start
```

Na primeira execução, escaneie o QR Code exibido no terminal. Depois disso, a sessão fica salva em `.wwebjs_auth`.

## Logs

Os logs ficam em `logs/`:

- `enviados.csv`: números já enviados, usado para evitar duplicidade.
- `erros.csv`: falhas de envio, números inválidos ou números sem WhatsApp.
- `avisos.csv`: avisos, como variáveis ausentes no template.

Se a execução for interrompida, rode `npm start` novamente. O sistema consulta `logs/enviados.csv` e não reenvia para números já concluídos.

## Testes

Para rodar os testes automatizados:

```powershell
npm test
```

Os testes verificam regras centrais do RCF, incluindo normalização de telefone, CSV obrigatório, deduplicação, validação antes do envio e logs.
