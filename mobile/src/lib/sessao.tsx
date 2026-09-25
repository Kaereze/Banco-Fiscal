import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import type { Perfil } from '@/lib/types';

type ContextoSessao = {
  sessao: Session | null;
  perfil: Perfil | null;
  /** true enquanto ainda não sabemos se há sessão salva no aparelho. */
  carregando: boolean;
  /**
   * Já terminamos de procurar o perfil? Serve para separar "ainda buscando"
   * de "esta conta não faz parte da família" — nos dois casos `perfil` é
   * null, e sem essa distinção a tela ficaria carregando para sempre.
   */
  perfilResolvido: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
};

const Contexto = createContext<ContextoSessao | null>(null);

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [perfilResolvido, setPerfilResolvido] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setCarregando(false);
    });

    const { data: inscricao } = supabase.auth.onAuthStateChange((_evento, nova) => {
      setSessao(nova);
    });
    return () => inscricao.subscription.unsubscribe();
  }, []);

  // O perfil diz que este usuário faz parte da família — é ele que as
  // policies do banco consultam. Sem perfil, as tabelas voltam vazias.
  useEffect(() => {
    if (!sessao?.user) {
      setPerfil(null);
      setPerfilResolvido(false);
      return;
    }
    let cancelado = false;
    setPerfilResolvido(false);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', sessao.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelado) return;
        setPerfil(data as Perfil | null);
        setPerfilResolvido(true);
      });
    return () => {
      cancelado = true;
    };
  }, [sessao?.user?.id]);

  const valor = useMemo<ContextoSessao>(
    () => ({
      sessao,
      perfil,
      carregando,
      perfilResolvido,
      entrar: async (email, senha) => {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });
        if (error) throw new Error(traduzErroDeLogin(error.message));
      },
      sair: async () => {
        await supabase.auth.signOut();
      },
    }),
    [sessao, perfil, carregando, perfilResolvido],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): ContextoSessao {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useSessao precisa estar dentro de <ProvedorSessao>.');
  return contexto;
}

function traduzErroDeLogin(mensagem: string): string {
  if (mensagem.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (mensagem.includes('Email not confirmed')) return 'Confirme o e-mail antes de entrar.';
  if (mensagem.toLowerCase().includes('network')) return 'Sem conexão com a internet.';
  return mensagem;
}
