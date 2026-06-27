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
