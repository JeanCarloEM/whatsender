const {
  buildCaseInsensitiveDataMap,
  formatNameForMessage,
  normalizeFieldName,
} = require("./utils");

function applyTemplate(template, data, options = {}) {
  const missingVariables = new Set();
  const dataMap = buildCaseInsensitiveDataMap(data);

  return replaceDayPeriodMarkers(
    String(template || "").replace(/\$\{([^}]+)\}/g, (_, field) => {
      const key = String(field).trim();
      const normalizedKey = normalizeFieldName(key);
      const record = dataMap.get(normalizedKey);

      if (!record) {
        if (!missingVariables.has(key) && options.onMissingVariable) {
          options.onMissingVariable(key);
        }

        missingVariables.add(key);
        return "";
      }

      const value = record.value ?? "";
      return normalizedKey === "nome" ? formatNameForMessage(value) : value;
    }),
    options.now || new Date(),
  );
}

function replaceDayPeriodMarkers(template, now = new Date()) {
  return String(template || "").replace(/\$diatarde\$/gi, (marker, offset) => {
    const phrase = Number(now.getHours()) >= 12 ? "boa tarde" : "bom dia";

    if (shouldCapitalizeDayPeriodMarker(template, offset)) {
      return phrase.replace(/^\p{L}/u, (letter) =>
        letter.toLocaleUpperCase("pt-BR"),
      );
    }

    return phrase;
  });
}

function shouldCapitalizeDayPeriodMarker(template, offset) {
  const before = String(template || "").slice(0, offset);
  return before.trim().length === 0 || /\.\s*$/.test(before);
}

function parseTemplateParts(renderedTemplate) {
  const parts = [];
  const mediaPattern = /!\[[^\]]*]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = mediaPattern.exec(renderedTemplate)) !== null) {
    const text = renderedTemplate.slice(lastIndex, match.index);

    if (text.trim()) {
      parts.push({ type: "text", value: text });
    }

    parts.push({
      type: "media",
      source: normalizeMediaSource(match[1]),
      raw: match[0],
    });

    lastIndex = mediaPattern.lastIndex;
  }

  const tail = renderedTemplate.slice(lastIndex);

  if (tail.trim()) {
    parts.push({ type: "text", value: tail });
  }

  return parts;
}

function normalizeMediaSource(source) {
  return String(source || "")
    .trim()
    .replace(/^<(.+)>$/, "$1")
    .replace(/^["'](.+)["']$/, "$1")
    .trim();
}

module.exports = {
  applyTemplate,
  normalizeMediaSource,
  parseTemplateParts,
};
