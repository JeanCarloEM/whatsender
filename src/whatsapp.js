const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

const { PATHS } = require("./config");
const { buildPuppeteerConfig, getWhatsAppClientId } = require("./browser");
const { processCampaign } = require("./campaign");

function createWhatsAppClient(paths = PATHS) {
  return new Client({
    authStrategy: new LocalAuth({
      dataPath: paths.auth,
      clientId: getWhatsAppClientId(),
    }),

    puppeteer: buildPuppeteerConfig(),
  });
}

function registerClientHandlers(client, paths = PATHS, options = {}) {
  client.on("qr", (qr) => {
    console.clear();
    console.log("Escaneie o QR Code:");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", async () => {
    console.log("WhatsApp conectado.");

    try {
      await processCampaign(client, paths, options);
      console.log("Processamento concluído.");
    } catch (err) {
      console.error("Processamento interrompido:", err.message);
      process.exitCode = 1;
    }
  });

  client.on("auth_failure", (msg) => {
    console.error("Falha de autenticação:", msg);
    process.exitCode = 1;
  });

  client.on("disconnected", (reason) => {
    console.error("Desconectado:", reason);
  });
}

module.exports = {
  createWhatsAppClient,
  registerClientHandlers,
};
