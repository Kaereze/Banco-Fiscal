import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { aoTerminar, Sobe } from '@/components/animacao';
import { NOME_DO_APP } from '@/components/marca/Logo';
import { LogoMoeda } from '@/components/marca/LogoMoeda';
import { useDados } from '@/lib/dados';
import { cores, espaco, fonte } from '@/lib/theme';

const TAMANHO_LOGO = 200;
const DURACAO_SAIDA = 350;
const ESPERA_MAXIMA_DOS_DADOS = 8000;

type Etapa = 'logo' | 'saudacao' | 'esperando';

export function Abertura({ nome, aoConcluir }: { nome?: string | null; aoConcluir: () => void }) {
  const { carregando } = useDados();
  const [etapa, setEtapa] = useState<Etapa>('logo');
  const [desistiuDeEsperar, setDesistiuDeEsperar] = useState(false);
  const opacidade = useSharedValue(1);

  const logoPronta = useCallback(() => setEtapa('saudacao'), []);
  const saudacaoPronta = useCallback(() => setEtapa('esperando'), []);

  useEffect(() => {
    const limite = setTimeout(() => setDesistiuDeEsperar(true), ESPERA_MAXIMA_DOS_DADOS);
    return () => clearTimeout(limite);
  }, []);

  const saindo = desistiuDeEsperar || (etapa === 'esperando' && !carregando);

  useEffect(() => {
    if (!saindo) return;
    opacidade.value = withTiming(0, { duration: DURACAO_SAIDA }, aoTerminar(aoConcluir));
  }, [saindo, opacidade, aoConcluir]);

  const estiloTela = useAnimatedStyle(() => ({ opacity: opacidade.value }));
  const primeiroNome = nome?.trim().split(/\s+/)[0];

  return (
    <Animated.View
      pointerEvents={saindo ? 'none' : 'auto'}
      style={[StyleSheet.absoluteFill, estilos.tela, estiloTela]}
    >
      <View style={estilos.centro}>
        <LogoMoeda tamanho={TAMANHO_LOGO} aoConcluir={logoPronta} />

        {etapa !== 'logo' ? (
          <Sobe aoTerminar={saudacaoPronta} style={estilos.saudacao}>
            <Text style={estilos.titulo}>{primeiroNome ? `Olá, ${primeiroNome}!` : 'Bem-vindo!'}</Text>
            <Text style={estilos.subtitulo}>Preparando as finanças da família…</Text>
          </Sobe>
        ) : (
          <View style={estilos.saudacao} />
        )}
      </View>
    </Animated.View>
  );
}

export function TelaDeEspera() {
  return (
    <View style={[estilos.tela, estilos.centro]}>
      <LogoMoeda tamanho={TAMANHO_LOGO} />
      <Text style={estilos.marca}>{NOME_DO_APP}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { backgroundColor: cores.fundo, zIndex: 10, elevation: 10 },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaco.xxl,
    gap: espaco.md,
  },
  saudacao: { alignItems: 'center', gap: espaco.sm, minHeight: 88, marginTop: espaco.lg },
  titulo: { fontSize: fonte.titulo, fontWeight: '800', color: cores.verdeEscuro, textAlign: 'center' },
  subtitulo: { fontSize: fonte.corpo, color: cores.textoSuave, textAlign: 'center' },
  marca: { fontSize: fonte.subtitulo, fontWeight: '800', color: cores.verdeEscuro, marginTop: espaco.lg },
});
