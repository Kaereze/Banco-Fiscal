import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { supabase } from '@/lib/supabase';
import type { Perfil } from '@/lib/types';

type ContextoSessao = {
  sessao: Session | null;
  perfil: Perfil | null;
  carregando: boolean;
  perfilResolvido: boolean;
  logado: boolean;
  concluirLogin: () => void;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
};

type PerfilBuscado = { usuarioId: string; perfil: Perfil | null };

const Contexto = createContext<ContextoSessao | null>(null);

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [perfilBuscado, setPerfilBuscado] = useState<PerfilBuscado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [confirmandoLogin, setConfirmandoLogin] = useState(false);

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

  const usuarioId = sessao?.user.id ?? null;

  useEffect(() => {
    if (!usuarioId) return;
    let cancelado = false;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', usuarioId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelado) setPerfilBuscado({ usuarioId, perfil: data as Perfil | null });
      });
    return () => {
      cancelado = true;
    };
  }, [usuarioId]);

  const perfilResolvido = usuarioId !== null && perfilBuscado?.usuarioId === usuarioId;
  const perfil = perfilResolvido ? (perfilBuscado?.perfil ?? null) : null;

  const logado = sessao !== null && !confirmandoLogin;

  const concluirLogin = useCallback(() => setConfirmandoLogin(false), []);

  const entrar = useCallback(async (email: string, senha: string) => {
    setConfirmandoLogin(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    if (error) {
      setConfirmandoLogin(false);
      throw new Error(traduzErroDeLogin(error.message));
    }
  }, []);

  const sair = useCallback(async () => {
    setConfirmandoLogin(false);
    await supabase.auth.signOut();
  }, []);

  const valor = useMemo<ContextoSessao>(
    () => ({
      sessao,
      perfil,
      carregando,
      perfilResolvido,
      logado,
      concluirLogin,
      entrar,
      sair,
    }),
    [
      sessao,
      perfil,
      carregando,
      perfilResolvido,
      logado,
      concluirLogin,
      entrar,
      sair,
    ],
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
