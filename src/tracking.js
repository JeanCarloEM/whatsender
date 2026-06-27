// Autor: JeanCarloEM.com
// Site do Autor: https://jeancarloem.com
// Licenca: Mozilla Public License 2.0
// Site da Licenca: https://www.mozilla.org/MPL/2.0/
// Resumo da Licenca: uso, copia, modificacao e distribuicao permitidos conforme os termos da MPL-2.0.
// Disclaimer: fornecido "AS IS", sem garantias de qualquer tipo.

const fs = require("fs");
const path = require("path");

const { MESSAGE_DIFF_THRESHOLD_PERCENT, PATHS, RESEND_AFTER_HOURS } = require("./config");
const {
  calculateDifferencePercent,
  ensureDirectory,
  formatAgeHours,
  hashValue,
  parseDateMs,
} = require("./utils");

function normalizeTemplateForTracking(template) {
  return String(template || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function getTemplateFingerprint(template) {
  const content = normalizeTemplateForTracking(template);

  return {
    content,
    hash: hashValue(content),
  };
}

function loadMessageCache(filePath = PATHS.messageCache) {
  if (!fs.existsSync(filePath)) {
    return { messages: {}, version: 1 };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));

    return {
      messages: parsed.messages && typeof parsed.messages === "object"
        ? parsed.messages
        : {},
      version: 1,
    };
  } catch {
    return { messages: {}, version: 1 };
  }
}

function saveMessageCache(cache, filePath = PATHS.messageCache) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(
    filePath,
    `${JSON.stringify({ messages: cache.messages, version: 1 }, null, 2)}\n`,
    "utf8",
  );
}

function registerTemplateInCache(template, paths = PATHS) {
  const fingerprint = getTemplateFingerprint(template);
  const cache = loadMessageCache(paths.messageCache);

  if (!cache.messages[fingerprint.hash]) {
    cache.messages[fingerprint.hash] = {
      content: fingerprint.content,
      createdAt: new Date().toISOString(),
      hash: fingerprint.hash,
    };
    saveMessageCache(cache, paths.messageCache);
  }

  return {
    cache,
    ...fingerprint,
  };
}

function getSendDecision(telefone, sentRecords, messageContext, options = {}) {
  const now = options.now || new Date();
  const resendAfterMs =
    (options.resendAfterHours ?? RESEND_AFTER_HOURS) * 3600000;
  const resendAfterHours = options.resendAfterHours ?? RESEND_AFTER_HOURS;
  const differenceThresholdPercent =
    options.messageDiffThresholdPercent ?? MESSAGE_DIFF_THRESHOLD_PERCENT;

  const records = sentRecords.filter((record) => record.telefone === telefone);

  if (records.length === 0) {
    return { shouldSend: true, reason: "Nenhum envio anterior para este telefone." };
  }

  let lastDifferentRecent;
  let lastExpired;

  for (const record of records) {
    const sentAtMs = parseDateMs(record.dataHora);
    const ageMs = sentAtMs === undefined ? 0 : now.getTime() - sentAtMs;
    const expired = sentAtMs !== undefined && ageMs > resendAfterMs;

    if (expired) {
      lastExpired = { ageMs, record };
      continue;
    }

    if (!record.mensagemHash) {
      return {
        code: "JA_ENVIADO_LEGADO",
        shouldSend: false,
        reason:
          "Telefone já consta em logs/enviados.csv em formato antigo; use --force-resend, --reset-sent ou aguarde o prazo de reenvio.",
      };
    }

    const previousContent =
      messageContext.cache.messages[record.mensagemHash]?.content;

    if (!previousContent) {
      return {
        code: "JA_ENVIADO_SEM_CACHE",
        shouldSend: false,
        reason:
          "Telefone já consta como enviado, mas o cache da versão anterior não foi encontrado; use --force-resend ou --reset-sent.",
      };
    }

    const differencePercent =
      record.mensagemHash === messageContext.hash
        ? 0
        : calculateDifferencePercent(messageContext.content, previousContent);

    if (differencePercent < differenceThresholdPercent) {
      return {
        code: "JA_ENVIADO_MENSAGEM_SIMILAR",
        differencePercent,
        shouldSend: false,
        reason: `Mensagem similar já enviada há ${formatAgeHours(ageMs)}h (${differencePercent.toFixed(1)}% diferente; limite ${differenceThresholdPercent}%).`,
      };
    }

    lastDifferentRecent = { differencePercent, record };
  }

  if (lastDifferentRecent) {
    return {
      shouldSend: true,
      reason: `Mensagem atual é ${lastDifferentRecent.differencePercent.toFixed(1)}% diferente da enviada anteriormente.`,
    };
  }

  if (lastExpired) {
    return {
      shouldSend: true,
      reason: `Último envio similar passou do prazo configurado (${formatAgeHours(lastExpired.ageMs)}h > ${resendAfterHours}h).`,
    };
  }

  return { shouldSend: true, reason: "Nenhum envio bloqueante encontrado." };
}

module.exports = {
  calculateDifferencePercent,
  getSendDecision,
  getTemplateFingerprint,
  loadMessageCache,
  normalizeTemplateForTracking,
  registerTemplateInCache,
  saveMessageCache,
};
