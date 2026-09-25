import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import 'react-native-url-polyfill/auto';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const chaveAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !chaveAnon) {
  throw new Error(
    'Faltam EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copie mobile/.env.example para mobile/.env e preencha com os dados do seu projeto Supabase.',
  );
}

/**
 * A chave anon e publica por definicao — quem protege os dados e o Row
 * Level Security no banco. As credenciais da Pluggy nunca passam por aqui:
 * quem fala com a Pluggy e a Edge Function sync-pluggy.
 */
export const supabase = createClient(url, chaveAnon, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Sem deep link de OAuth: e login por e-mail e senha.
    detectSessionInUrl: false,
  },
});

// Em React Native o timer de refresh precisa acompanhar o ciclo de vida do
// app: sem isto a sessao expira enquanto o celular fica em segundo plano e
// o usuario volta para uma tela vazia.
AppState.addEventListener('change', (estado) => {
  if (estado === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
