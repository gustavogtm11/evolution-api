# Migração Evolution API v2.3.7 com autenticação Firebase

## Estado

Esta branch é uma preparação isolada. A migração de código ainda não foi concluída nem validada; não fazer deploy nem integrar com `agenda-control` até que os critérios abaixo passem.

- Base atual: `fix/build-validation` (Evolution API 1.8.2 customizada).
- Alvo oficial: tag `v2.3.7`, commit `cd800f2976e1e5b682fbf86a01ee4d85ae61f370`.
- A v2.3.7 tem uma arquitetura significativamente diferente da 1.8.2, incluindo Prisma e modelos de instância/mensagem.
- O backend Firebase customizado atual está em `src/utils/use-multi-file-auth-state-firebase.ts` e é integrado ao serviço Baileys legado. Não basta trocar `package.json`, Dockerfile ou o nome da versão.

## Requisitos obrigatórios da migração

1. Portar a implementação da v2.3.7 integralmente, mantendo os arquivos upstream correspondentes à tag oficial.
2. Reimplementar o Firebase como provider de estado de autenticação compatível com a interface Baileys usada na v2.3.7, preservando os nomes de coleção/documento existentes quando possível e definindo estratégia de migração compatível.
3. Preservar serialização de `BufferJSON`, credenciais `creds`, chaves Signal, conversão de `app-state-sync-key`, gravação de `creds.update`, remoção de chaves e exclusão/logout de instância.
4. Garantir que o caminho Firebase seja selecionado por configuração explícita e que a ausência de credenciais de serviço falhe com erro claro, sem fallback silencioso para arquivos locais.
5. Atualizar Docker/Render, scripts, variáveis de ambiente e migrations conforme a arquitetura v2.3.7. Não reutilizar cegamente a configuração da v1.8.2.
6. Não alterar nem integrar `agenda-control` nesta etapa.

## Gate de validação antes de integrar

- [ ] Confirmar que o código corresponde à tag oficial `v2.3.7` e não a `main` mais recente.
- [ ] Instalar dependências de forma reproduzível e compilar TypeScript.
- [ ] Validar migrations Prisma e inicialização com banco de teste.
- [ ] Testar provider Firebase com emulador/projeto de teste: salvar e reler creds e cada tipo de chave, serialização de buffers, reinício do processo e reconexão sem novo QR.
- [ ] Testar atualização concorrente de credenciais, logout, exclusão de instância e remoção de chaves.
- [ ] Testar endpoints usados pelo `agenda-control`, autenticação por API key, webhook de entrada e envio de mensagem.
- [ ] Validar deploy em ambiente de homologação isolado. Nenhum deploy de produção nesta branch.

## Fonte upstream

- Release oficial: https://github.com/evolution-foundation/evolution-api/releases/tag/v2.3.7
- Commit da release: https://github.com/evolution-foundation/evolution-api/commit/cd800f2976e1e5b682fbf86a01ee4d85ae61f370
