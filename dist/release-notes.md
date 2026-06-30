# Rastreio

`7c279bc1d7d2b1796c1c8bfcc0b77eacb6dd238b → 7fd4f4f2966ed2a1482d36b3b12d7f67d809881d`

# Melhorias

- Adiciona barra de progresso fixa no topo da GUI durante envios, com avanço suave por destinatário concluído e estilo profissional.

# Correções

- Correções de instalação e inicialização.
- Remoção de sessões sem precisar alternar para elas; correções de problemas com sessões.
- Torna envio de OGG robusto com leitura em memória, retries para falhas transitórias do WhatsApp Web e fallback para áudio comum.
- Trata frame destacado do WhatsApp Web como falha transitória no envio de OGG, aguardando contexto estável antes de retentar.
- Exibe progresso visual para envio de anexos e OGG na GUI/terminal, incluindo retentativas, espera por estabilização do WhatsApp Web e fallback de voz para áudio comum; evita percepção de travamento durante retries demorados de mídia.
- Adiciona desligamento pela GUI, confirmação contextual antes do envio, aviso sobre aba do WhatsApp visível e inicialização GUI em segundo plano; reduz throttling do navegador e foca a aba controlada antes de mídia.
