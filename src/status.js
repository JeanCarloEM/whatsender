const readline = require("readline");

const { COLORS } = require("./config");

function supportsStatusUi() {
  return Boolean(process.stdout.isTTY && !process.env.NO_STATUS_UI);
}

function colorize(text, color) {
  if (!supportsStatusUi()) {
    return text;
  }

  return `${COLORS[color] || ""}${text}${COLORS.reset}`;
}

function progressBar(done, total, width = 18) {
  const safeTotal = Math.max(total, 1);
  const filled = Math.round((Math.min(done, safeTotal) / safeTotal) * width);
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

function maskPhone(phone) {
  const digits = String(phone || "");

  if (digits.length <= 4) {
    return digits || "sem telefone";
  }

  return `***${digits.slice(-4)}`;
}

function createStatusReporter(total) {
  const interactive = supportsStatusUi();
  const state = {
    current: "Preparando envio",
    errors: 0,
    processed: 0,
    sent: 0,
    skipped: 0,
    total,
    warnings: 0,
  };

  function render() {
    if (!interactive) {
      return;
    }

    const line = [
      colorize("Envio WhatsApp", "bold"),
      colorize(progressBar(state.processed, state.total), "cyan"),
      `${state.processed}/${state.total}`,
      colorize(`OK ${state.sent}`, "green"),
      colorize(`Pulos ${state.skipped}`, "yellow"),
      colorize(`Erros ${state.errors}`, "red"),
      colorize(`Avisos ${state.warnings}`, "blue"),
      colorize(state.current, "dim"),
    ].join("  ");

    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(line.slice(0, process.stdout.columns || line.length));
  }

  return {
    current(message) {
      state.current = message;
      render();
    },
    error(message) {
      state.errors += 1;
      state.processed += 1;
      state.current = message;
      render();
    },
    event(message, color = "dim") {
      if (interactive) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
      }

      console.log(colorize(message, color));
      render();
    },
    finish() {
      if (interactive) {
        process.stdout.write("\n");
      }

      console.log(
        [
          colorize("Resumo:", "bold"),
          colorize(`${state.sent} enviados`, "green"),
          colorize(`${state.skipped} pulados`, "yellow"),
          colorize(`${state.errors} erros`, "red"),
          colorize(`${state.warnings} avisos`, "blue"),
        ].join("  "),
      );
    },
    sent(message) {
      state.sent += 1;
      state.processed += 1;
      state.current = message;
      render();
    },
    skip(message) {
      state.skipped += 1;
      state.processed += 1;
      state.current = message;
      render();
    },
    warning(message) {
      state.warnings += 1;
      state.current = message;
      render();
    },
  };
}

module.exports = {
  createStatusReporter,
  maskPhone,
};
