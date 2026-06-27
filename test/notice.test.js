// Autor: JeanCarloEM.com
// Site do Autor: https://jeancarloem.com
// Licenca: Mozilla Public License 2.0
// Site da Licenca: https://www.mozilla.org/MPL/2.0/
// Resumo da Licenca: uso, copia, modificacao e distribuicao permitidos conforme os termos da MPL-2.0.
// Disclaimer: fornecido "AS IS", sem garantias de qualquer tipo.

const assert = require("node:assert/strict");
const test = require("node:test");

const { buildNoticeText, buildTerminalNoticeBox, renderGuiHtml } = require("../main");

test("aviso mostra link do autor no terminal e na GUI", () => {
  assert.match(
    buildNoticeText(),
    /Autor: JeanCarloEM\.com \(https:\/\/jeancarloem\.com\)/,
  );
  assert.match(
    renderGuiHtml(),
    /<a href="https:\/\/jeancarloem\.com" target="_blank" rel="noreferrer">JeanCarloEM\.com<\/a>/,
  );
});

test("terminal destaca licença e disclaimer em caixa", () => {
  const box = buildTerminalNoticeBox({ color: false, width: 72 });
  const lines = box.split("\n");

  assert.match(lines[0], /^┌─+┐$/);
  assert.match(lines.at(-1), /^└─+┘$/);
  assert.match(box, /│ Licença: Mozilla Public License 2\.0/);
  assert.match(box, /│ Disclaimer:/);
  assert.doesNotMatch(box, /Autor:/);
  assert.doesNotMatch(box, /Repositório:/);
});
