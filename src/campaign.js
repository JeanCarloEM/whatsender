const fs = require("fs");

const { PATHS } = require("./config");
const { loadClientes, loadTemplate } = require("./data");
const { applyTemplate } = require("./template");
const { validateTemplateMediaReferences, sendRenderedTemplate } = require("./media");
const { initLogFiles, appendLog, loadSentRecords } = require("./logs");
const { registerTemplateInCache, getSendDecision } = require("./tracking");
const { getRecordValue, randomDelay, sanitizePhone, sleep } = require("./utils");
const { createStatusReporter, maskPhone } = require("./status");
const { getExistingBrowserConnectionConfig, getWhatsAppClientId, resolveBrowserExecutablePath } = require("./browser");

function validateRuntimeFiles(paths = PATHS, options = {}) {
  const checkBrowser = options.checkBrowser !== false;
  const issues = [];
  let clientes = [];
  let template = "";

  try {
    template = loadTemplate(paths.template);

    if (template.trim().length === 0) {
      issues.push("Template inválido: texto.md está vazio.");
    }

    issues.push(...validateTemplateMediaReferences(template, paths));
  } catch (err) {
    issues.push(err.message);
  }

  try {
    clientes = loadClientes(paths);
  } catch (err) {
    issues.push(err.message);
  }

  try {
    initLogFiles(paths);
  } catch (err) {
    issues.push(`Estrutura de logs inválida: ${err.message}`);
  }

  if (fs.existsSync(paths.auth) && !fs.statSync(paths.auth).isDirectory()) {
    issues.push(`Sessão inválida: ${paths.auth} não é um diretório.`);
  }

  if (checkBrowser) {
    try {
      const existingBrowserConfig = getExistingBrowserConnectionConfig();
      const executablePath = existingBrowserConfig
        ? null
        : resolveBrowserExecutablePath();

      if (!existingBrowserConfig && !executablePath) {
        issues.push("Chrome/Chromium/Edge não encontrado.");
      }

      getWhatsAppClientId();
    } catch (err) {
      issues.push(err.message);
    }
  }

  if (issues.length > 0) {
    throw new Error(`Pré-validação RCF falhou:\n- ${issues.join("\n- ")}`);
  }

  return {
    clientesCount: clientes.length,
    templateVariables: [...template.matchAll(/\$\{([^}]+)\}/g)].map((match) =>
      match[1].trim(),
    ),
  };
}

async function processCampaign(client, paths = PATHS, options = {}) {
  const forceResend = Boolean(options.forceResend);
  const sentRecords = loadSentRecords(paths.sent);
  const template = loadTemplate(paths.template);
  const messageContext = registerTemplateInCache(template, paths);
  const clientes = loadClientes(paths);
  const status = createStatusReporter(clientes.length);

  console.log(`Clientes encontrados: ${clientes.length}`);

  for (const cliente of clientes) {
    const telefoneOriginal = getRecordValue(cliente, "telefone");
    const telefone = sanitizePhone(telefoneOriginal);
    status.current(`Validando ${maskPhone(telefone)}`);

    try {
      if (!telefone) {
        const reason = "Telefone vazio ou sem dígitos.";

        appendLog(paths.errors, [
          telefoneOriginal,
          "TELEFONE_INVALIDO",
          reason,
          new Date().toISOString(),
        ]);

        status.event(`Pulando registro: ${reason}`, "red");
        status.error("Telefone inválido");
        continue;
      }

      const sendDecision = getSendDecision(
        telefone,
        sentRecords,
        messageContext,
        options,
      );

      if (!forceResend && !sendDecision.shouldSend) {
        appendLog(paths.skipped, [
          telefone,
          sendDecision.code || "JA_ENVIADO",
          sendDecision.reason,
          new Date().toISOString(),
        ]);

        status.event(
          `Pulando ${maskPhone(telefone)}: ${sendDecision.reason}`,
          "yellow",
        );
        status.skip(`Já enviado ${maskPhone(telefone)}`);
        continue;
      }

      if (forceResend && sentRecords.some((record) => record.telefone === telefone)) {
        status.event(
          `Reenviando ${maskPhone(telefone)}: --force-resend ativo.`,
          "yellow",
        );
      } else if (sendDecision.reason && sendDecision.reason !== "Nenhum envio anterior para este telefone.") {
        status.event(`Enviando ${maskPhone(telefone)}: ${sendDecision.reason}`, "yellow");
      }

      const numberId = await client.getNumberId(telefone);

      if (!numberId) {
        const reason = "Número não encontrado no WhatsApp.";

        appendLog(paths.errors, [
          telefone,
          "NAO_REGISTRADO",
          reason,
          new Date().toISOString(),
        ]);

        status.event(`Pulando ${maskPhone(telefone)}: ${reason}`, "red");
        status.error(`Sem WhatsApp ${maskPhone(telefone)}`);
        continue;
      }

      const missingVariables = new Set();
      const mensagem = applyTemplate(template, cliente, {
        onMissingVariable: (field) => missingVariables.add(field),
      });

      for (const field of missingVariables) {
        appendLog(paths.warnings, [
          telefone,
          "VARIAVEL_AUSENTE",
          field,
          new Date().toISOString(),
        ]);

        status.warning(`Variável ausente: ${field}`);
      }

      await sendRenderedTemplate(client, numberId._serialized, mensagem, paths);

      const sentAt = new Date().toISOString();

      appendLog(paths.sent, [telefone, messageContext.hash, sentAt]);
      sentRecords.push({
        dataHora: sentAt,
        mensagemHash: messageContext.hash,
        telefone,
      });

      status.sent(`Enviado ${maskPhone(telefone)}`);

      const delay = randomDelay();
      status.current(`Aguardando ${Math.round(delay / 1000)}s`);
      await sleep(delay);
    } catch (err) {
      appendLog(paths.errors, [
        telefone || telefoneOriginal,
        "ERRO_ENVIO",
        err.message,
        new Date().toISOString(),
      ]);

      status.error(`Erro ${maskPhone(telefone)}: ${err.message}`);
    }
  }

  status.finish();
}

module.exports = {
  processCampaign,
  validateRuntimeFiles,
};
