import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { Sobe, useTransicao } from '@/components/animacao';
import { NOME_DO_APP } from '@/components/marca/Logo';
import { LogoMoeda } from '@/components/marca/LogoMoeda';
import { useDados } from '@/lib/dados';
import { useSessao } from '@/lib/sessao';
import { cores, espaco, fonte } from '@/lib/theme';

const TAMANHO_LOGO = 200;
const DURACAO_SAIDA = 350;
const ESPERA_MAXIMA = 10000;

type Etapa = 'logo' | 'saudacao' | 'esperando';

export function Abertura({ aoConcluir }: { aoConcluir: () => void }) {
  const { carregando: verificandoSessao, logado, perfil } = useSessao();
  const { carregando: carregandoDados } = useDados();
  const [etapa, setEtapa] = useState<Etapa>('logo');
  const [desistiuDeEsperar, setDesistiuDeEsperar] = useState(false);

  const logoPronta = useCallback(() => setEtapa(logado ? 'saudacao' : 'esperando'), [logado]);
  const saudacaoPronta = useCallback(() => setEtapa('esperando'), []);

  useEffect(() => {
    const limite = setTimeout(() => setDesistiuDeEsperar(true), ESPERA_MAXIMA);
    return () => clearTimeout(limite);
  }, []);

  const appPronto = !verificandoSessao && (!logado || !carregandoDados);
  const saindo = desistiuDeEsperar || (etapa === 'esperando' && appPronto);
  const saida = useTransicao(saindo, aoConcluir, undefined, DURACAO_SAIDA);
  const estiloSaida = useAnimatedStyle(() => ({ opacity: 1 - saida.value }));

  const primeiroNome = perfil?.nome.trim().split(/\s+/)[0];

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, estilos.tela, estiloSaida, { pointerEvents: saindo ? 'none' : 'auto' }]}
    >
      <View style={estilos.centro}>
        <LogoMoeda tamanho={TAMANHO_LOGO} aoConcluir={logoPronta} />

        {etapa !== 'logo' ? (
          <Sobe aoTerminar={saudacaoPronta} style={estilos.saudacao}>
            <Text style={estilos.titulo}>{primeiroNome ? `Olá, ${primeiroNome}!` : NOME_DO_APP}</Text>
            <Text style={estilos.subtitulo}>
              {primeiroNome ? 'Preparando as finanças da família…' : 'As finanças da família, num lugar só.'}
            </Text>
          </Sobe>
        ) : (
          <View style={estilos.saudacao} />
        )}
      </View>
    </Animated.View>
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
});
