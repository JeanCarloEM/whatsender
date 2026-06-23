const fs = require("fs");
const path = require("path");

const { PATHS } = require("./config");
const { ensureDirectory } = require("./utils");

function ensureLogFile(filePath, header) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `${header}\n`, "utf8");
  }
}

function ensureSentLogFile(filePath) {
  const header = "telefone;mensagem_hash;data_hora";

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `${header}\n`, "utf8");
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split("\n");

  if (lines[0] !== header) {
    lines[0] = header;
    fs.writeFileSync(filePath, lines.join("\n"), "utf8");
  }
}

function initLogFiles(paths = PATHS) {
  ensureDirectory(paths.logsDir);
  ensureSentLogFile(paths.sent);
  ensureLogFile(paths.errors, "telefone;codigo;detalhe;data_hora");
  ensureLogFile(paths.skipped, "telefone;codigo;detalhe;data_hora");
  ensureLogFile(paths.warnings, "telefone;codigo;detalhe;data_hora");
}

function formatLogValue(value) {
  return String(value ?? "")
    .replace(/[\r\n;]/g, " ")
    .trim();
}

function appendLog(filePath, values) {
  fs.appendFileSync(
    filePath,
    `${values.map(formatLogValue).join(";")}\n`,
    "utf8",
  );
}

function loadAlreadySent(filePath = PATHS.sent) {
  return new Set(loadSentRecords(filePath).map((record) => record.telefone));
}

function loadSentRecords(filePath = PATHS.sent) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return fs
    .readFileSync(filePath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("telefone;"))
    .map(parseSentRecord)
    .filter(Boolean);
}

function parseSentRecord(line) {
  const parts = line.split(";");
  const telefone = parts[0];

  if (!telefone) {
    return undefined;
  }

  if (parts.length >= 3) {
    return {
      dataHora: parts[2],
      mensagemHash: parts[1],
      telefone,
    };
  }

  return {
    dataHora: parts[1],
    mensagemHash: undefined,
    telefone,
  };
}

function resetSentLog(filePath = PATHS.sent) {
  fs.writeFileSync(filePath, "telefone;mensagem_hash;data_hora\n", "utf8");
}

module.exports = {
  appendLog,
  initLogFiles,
  loadAlreadySent,
  loadSentRecords,
  resetSentLog,
};
