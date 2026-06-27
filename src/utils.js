// Autor: JeanCarloEM.com
// Site do Autor: https://jeancarloem.com
// Licenca: Mozilla Public License 2.0
// Site da Licenca: https://www.mozilla.org/MPL/2.0/
// Resumo da Licenca: uso, copia, modificacao e distribuicao permitidos conforme os termos da MPL-2.0.
// Disclaimer: fornecido "AS IS", sem garantias de qualquer tipo.

const crypto = require("crypto");
const fs = require("fs");

const {
  DEFAULT_COUNTRY_CODE,
  MAX_DELAY_MS,
  MIN_DELAY_MS,
} = require("./config");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(min = MIN_DELAY_MS, max = MAX_DELAY_MS) {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  return Math.floor(Math.random() * (upper - lower + 1)) + lower;
}

function sanitizePhone(phone, countryCode = DEFAULT_COUNTRY_CODE) {
  let cleaned = String(phone || "").replace(/\D/g, "");

  if (cleaned && !cleaned.startsWith(countryCode)) {
    cleaned = countryCode + cleaned;
  }

  return cleaned;
}

function formatNameForMessage(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(capitalizeNamePart)
    .join(" ");
}

function capitalizeNamePart(part) {
  return part
    .split("-")
    .map((piece) => {
      const lower = piece.toLocaleLowerCase("pt-BR");
      return lower.replace(/^\p{L}/u, (letter) =>
        letter.toLocaleUpperCase("pt-BR"),
      );
    })
    .join("-");
}

function normalizeFieldName(field) {
  return String(field || "").trim().toLocaleLowerCase("pt-BR");
}

function buildCaseInsensitiveDataMap(data) {
  const map = new Map();

  for (const [key, value] of Object.entries(data || {})) {
    const normalizedKey = normalizeFieldName(key);

    if (!map.has(normalizedKey)) {
      map.set(normalizedKey, { key, value });
    }
  }

  return map;
}

function getRecordValue(data, field) {
  const record = buildCaseInsensitiveDataMap(data).get(normalizeFieldName(field));
  return record ? record.value : undefined;
}

function hashValue(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeTemplateForTracking(template) {
  return String(template || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function calculateDifferencePercent(a, b) {
  const left = normalizeTemplateForTracking(a);
  const right = normalizeTemplateForTracking(b);
  const maxLength = Math.max(left.length, right.length);

  if (maxLength === 0) {
    return 0;
  }

  return (levenshteinDistance(left, right) / maxLength) * 100;
}

function levenshteinDistance(a, b) {
  if (a === b) {
    return 0;
  }

  if (a.length === 0) {
    return b.length;
  }

  if (b.length === 0) {
    return a.length;
  }

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  let current = new Array(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
    }

    [previous, current] = [current, previous];
  }

  return previous[b.length];
}

function parseDateMs(value) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function formatAgeHours(ageMs) {
  return (ageMs / 3600000).toFixed(1);
}

function stripWrappingQuotes(value) {
  let result = String(value || "").trim();

  while (result.length >= 2) {
    const first = result[0];
    const last = result[result.length - 1];

    if (!["'", '"'].includes(first) || first !== last) {
      break;
    }

    const closingIndex = result.indexOf(first, 1);

    if (closingIndex !== result.length - 1) {
      break;
    }

    result = result.slice(1, -1).trim();
  }

  return result;
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

module.exports = {
  buildCaseInsensitiveDataMap,
  calculateDifferencePercent,
  ensureDirectory,
  formatAgeHours,
  formatNameForMessage,
  getRecordValue,
  hashValue,
  normalizeFieldName,
  normalizeTemplateForTracking,
  parseDateMs,
  randomDelay,
  sanitizePhone,
  sleep,
  stripWrappingQuotes,
  uniqueValues,
};
