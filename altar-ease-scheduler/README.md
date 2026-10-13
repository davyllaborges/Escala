# Servir · Escala dos coroinhas

Aplicação para montar a escala mensal da pastoral dos coroinhas: distribui as
celebrações respeitando disponibilidades, feriados e solenidades, e gera um
texto pronto para enviar pelo WhatsApp.

## Funcionalidades

- Três abas em uma só tela: **Configurar**, **Escala** e **Resumo**.
- Distribuição automática com rodízio, folgas aos domingos e regras para
  feriados e solenidades.
- Restrições por coroinha (horários e datas em que não pode servir).
- Cópia da escala completa ou individual para o WhatsApp.
- Tempo litúrgico do mês e avisos de conferência na distribuição.

## Como funciona

Os dados ficam salvos apenas no navegador do aparelho (armazenamento local) —
nada é enviado para servidores. As regras de distribuição e os cálculos de
datas litúrgicas ficam em um módulo próprio (`src/lib/schedule.ts`), com
testes em `src/lib/schedule.test.ts`.

## Desenvolvimento

Requisitos: Node.js 20+ e npm.

```sh
npm install
npm run dev      # servidor de desenvolvimento
npm run test     # testes das regras de distribuição
npm run build    # versão de produção
```

## Tecnologias

- TanStack Start (React 19 + TypeScript)
- Tailwind CSS v4
- Vitest
