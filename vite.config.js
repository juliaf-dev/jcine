/*
  Configura o Vite, usado para desenvolver e gerar a versão final do site.
  O plugin React transforma JSX e permite atualizar componentes ao editar.
  Os comandos npm run dev e npm run build usam esta configuração.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({ plugins: [react()] });
