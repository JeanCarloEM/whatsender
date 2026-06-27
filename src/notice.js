const LICENSE_LOCAL_PATH = "LICENSE";
const LICENSE_URL = "https://www.mozilla.org/MPL/2.0/";
const REPOSITORY_URL = "https://github.com/JeanCarloEM/whatsender";
const AUTHOR = "JeanCarloEM.com";
const AUTHOR_URL = "https://jeancarloem.com";
const LICENSE_NAME = "Mozilla Public License 2.0";
const TERMINAL_NOTICE_WIDTH = 100;
const ANSI = {
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  reset: "\x1b[0m",
  yellow: "\x1b[33m",
};

const DISCLAIMER =
  "Este software é fornecido estritamente como está e como disponível, sem garantias expressas, implícitas, legais, comerciais, técnicas, operacionais, de disponibilidade, segurança, conformidade, licitude, não infração ou adequação a qualquer finalidade. O projeto é destinado exclusivamente a usos legítimos, proporcionais e consentidos, como comunicação com clientes reais, assinantes, contatos que autorizaram contato ou públicos próprios e legítimos. O autor é expressamente contrário ao uso massivo, abusivo, enganoso, invasivo, como spam, scraping, assédio, fraude, envio sem consentimento ou qualquer prática que viole leis, termos de serviço, privacidade ou direitos de terceiros. O uso, configuração, conteúdo enviado, destinatários, credenciais, automações e consequências são de responsabilidade exclusiva do usuário. Nada constitui consultoria, serviço gerenciado, vínculo, autorização para uso indevido, promessa de resultado ou assunção de responsabilidade pelo autor, que não responderá por danos, perdas, bloqueios, sanções, incidentes, violações, reclamações ou responsabilidades civis, criminais, trabalhistas, administrativas, regulatórias, contratuais ou de qualquer outra natureza.";

function buildNoticeText() {
  return [
    `Autor: ${AUTHOR} (${AUTHOR_URL})`,
    `Licença: ${LICENSE_NAME} (${LICENSE_LOCAL_PATH}; ${LICENSE_URL})`,
    `Repositório: ${REPOSITORY_URL}`,
    `Disclaimer: ${DISCLAIMER}`,
  ].join("\n");
}

function printStartupNotice() {
  console.log("");
  console.log(`Autor: ${AUTHOR} (${AUTHOR_URL})`);
  console.log(`Repositório: ${REPOSITORY_URL}`);
  console.log("");
  console.log(buildTerminalNoticeBox());
  console.log("");
}

function buildTerminalNoticeBox(options = {}) {
  const color = options.color !== false && !process.env.NO_COLOR;
  const width = options.width || TERMINAL_NOTICE_WIDTH;
  const innerWidth = Math.max(40, width - 4);
  const lines = [
    {
      color: "yellow",
      text: `Licença: ${LICENSE_NAME} (${LICENSE_LOCAL_PATH}; ${LICENSE_URL})`,
    },
    { text: "" },
    { color: "cyan", text: "Disclaimer:" },
    ...wrapText(DISCLAIMER, innerWidth).map((text) => ({ text })),
  ];
  const top = `┌${"─".repeat(innerWidth + 2)}┐`;
  const bottom = `└${"─".repeat(innerWidth + 2)}┘`;
  const body = lines.map((line) => {
    const text = padRight(line.text, innerWidth);
    const value = colorize(text, line.color, color);
    return `│ ${value} │`;
  });

  return [
    colorize(top, "dim", color),
    ...body,
    colorize(bottom, "dim", color),
  ].join("\n");
}

function wrapText(text, width) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    if (!line) {
      line = word;
      continue;
    }

    if (`${line} ${word}`.length <= width) {
      line = `${line} ${word}`;
      continue;
    }

    lines.push(line);
    line = word;
  }

  if (line) {
    lines.push(line);
  }

  return lines;
}

function padRight(text, width) {
  const value = String(text || "");
  return value.length >= width ? value : `${value}${" ".repeat(width - value.length)}`;
}

function colorize(text, colorName, enabled) {
  if (!enabled || !colorName || !ANSI[colorName]) {
    return text;
  }

  return `${ANSI[colorName]}${text}${ANSI.reset}`;
}

module.exports = {
  AUTHOR,
  AUTHOR_URL,
  DISCLAIMER,
  LICENSE_LOCAL_PATH,
  LICENSE_NAME,
  LICENSE_URL,
  REPOSITORY_URL,
  buildTerminalNoticeBox,
  buildNoticeText,
  printStartupNotice,
};
