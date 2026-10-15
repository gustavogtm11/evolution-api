<h1 align="center">Evolution Api</h1>

<div align="center">

[![Whatsapp Group](https://img.shields.io/badge/Group-WhatsApp-%2322BC18)](https://evolution-api.com/whatsapp)
[![Discord Community](https://img.shields.io/badge/Discord-Community-blue)](https://evolution-api.com/discord)
[![Postman Collection](https://img.shields.io/badge/Postman-Collection-orange)](https://evolution-api.com/postman) 
[![Documentation](https://img.shields.io/badge/Documentation-Official-green)](https://doc.evolution-api.com)
[![License](https://img.shields.io/badge/license-GPL--3.0-orange)](./LICENSE)
[![Support](https://img.shields.io/badge/Donation-picpay-green)](https://app.picpay.com/user/davidsongomes1998)
[![Support](https://img.shields.io/badge/Buy%20me-coffe-orange)](https://bmc.link/evolutionapi)

</div>
  
<div align="center"><img src="./public/images/cover.png"></div>

## WhatsApp-Api-NodeJs

This project is based on the [CodeChat](https://github.com/code-chat-br/whatsapp-api). The original project is an implementation of [Baileys](https://github.com/WhiskeySockets/Baileys), serving as a Restful API service that controls WhatsApp functions.</br> 
The code allows the creation of multiservice chats, service bots, or any other system that utilizes WhatsApp. The documentation provides instructions on how to set up and use the project, as well as additional information about its features and configuration options.

## SSL

To install the SSL certificate, follow the **[instructions](https://certbot.eff.org/instructions?ws=other&os=ubuntufocal)** below.

# Note

This code is in no way affiliated with WhatsApp. Use at your own discretion. Don't spam this.

This code was produced based on the baileys library and it is still under development.

# Donate to the project.

#### PicPay

<div align="center">
  <a href="https://app.picpay.com/user/davidsongomes1998" target="_blank" rel="noopener noreferrer">
    <img src="./public/images/picpay-qr.jpeg" style="width: 50% !important;">
  </a>
</div>

#### Buy me coffe - PIX

<div align="center">
  <a href="https://bmc.link/evolutionapi" target="_blank" rel="noopener noreferrer">
    <img src="./public/images/qrcode-pix.png" style="width: 50% !important;">
  </a>
  <p><b>CHAVE PIX (Telefone):</b> (74)99987-9409</p>
</div>

</br>

## Deploy no Render

Esta API pode ser hospedada como um serviço independente e consumida por outros sistemas através da API HTTP e dos webhooks.

### Escolha do Blueprint

- **Render pago:** use o arquivo `render-paid.yaml`. Ele monta um disco em `/evolution/data` e grava tanto as sessões quanto os arquivos de configuração em diretórios persistentes.
- **Render gratuito para testes:** use `render-free-test.yaml`. Ele usa o Firestore para persistir o estado de autenticação do WhatsApp e tentar recuperar as instâncias após reinícios. **É experimental e não deve ser usado para clientes de produção:** configurações de webhooks e outros dados locais da Evolution API ainda não são todos persistidos no Firestore e podem se perder quando o serviço gratuito reiniciar ou suspender.

No Render, crie um Blueprint e selecione o repositório e a branch `fix/build-validation`. No campo de caminho do Blueprint, informe o arquivo desejado, por exemplo `render-paid.yaml` ou `render-free-test.yaml`.

### Variáveis obrigatórias

- `SERVER_URL`: URL pública HTTPS do serviço, por exemplo `https://SEU-SERVICO.onrender.com`.
- `AUTHENTICATION_API_KEY`: crie uma chave longa, aleatória e exclusiva para produção. Guarde-a como segredo e não a coloque no código do seu outro projeto.

### Usar Firebase Firestore para autenticação do WhatsApp

A opção é ativada por `AUTH_STATE_STORAGE=firebase`. Ela grava as credenciais e chaves de autenticação em documentos do Cloud Firestore, identifica as instâncias cadastradas e tenta recuperá-las na inicialização.

1. No Firebase Console, abra ou crie um projeto e habilite o **Cloud Firestore**.
2. Em Configurações do projeto > Contas de serviço, gere uma chave privada de conta de serviço. Trate esse JSON como um segredo administrativo.
3. No Render, configure `FIREBASE_PROJECT_ID` com o ID do projeto e `FIREBASE_SERVICE_ACCOUNT_JSON` com o conteúdo completo do JSON da conta de serviço.
4. Configure `AUTH_STATE_STORAGE=firebase`.
5. Não coloque o JSON no GitHub, no frontend ou em variáveis expostas ao navegador. Restrinja o acesso ao painel do Render e à conta de serviço.

O adaptador utiliza a coleção `evolution_auth_sessions`, com documentos separados por instância e subcoleção `keys`. O SDK Admin usa privilégios de servidor; configure as permissões do projeto e monitore os custos e limites do Firestore.

**Limitação importante:** esse adaptador persiste o estado de autenticação do Baileys, não converte automaticamente todos os repositórios locais da Evolution API em armazenamento Firebase. No plano gratuito, webhooks, configurações, dados temporários e outros arquivos locais podem continuar efêmeros. Para operação comercial, prefira `render-paid.yaml` até que todo o estado necessário tenha persistência externa e os testes de reinicialização tenham passado.

### Verificação após o deploy

1. Abra `https://SEU-SERVICO.onrender.com/health`. A resposta esperada é semelhante a `{"status":"ok"}`.
2. Crie uma instância de teste e conecte o WhatsApp por QR Code.
3. No modo Firebase, reinicie o serviço de teste e confirme nos logs que a instância foi recuperada sem exigir novo QR Code. Faça isso antes de conectar qualquer número de cliente.
4. Configure o webhook da instância para apontar para uma URL pública HTTPS do projeto que receberá os eventos. `localhost` só funciona entre processos na mesma máquina, não entre o Render e seu computador.

### Segurança

- Nunca use chaves de teste local em produção.
- Armazene a chave da API e as credenciais de Firebase no gerenciador de segredos do Render e nas variáveis de ambiente do projeto consumidor.
- Não publique QR Codes, credenciais, tokens ou arquivos de sessão.
- O endpoint `/health` serve apenas para verificar se o serviço responde; ele não comprova que uma sessão do WhatsApp está conectada.

O workflow `.github/workflows/render-validation.yml` executa um build da imagem Docker nas atualizações desta branch e em pull requests direcionados à `main`. Ele valida a compilação, mas não publica nem faz deploy automaticamente.
