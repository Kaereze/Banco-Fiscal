import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDados } from '@/lib/dados';
import { chaveMes, deslocaMes, mesPorExtenso } from '@/lib/format';
import { cores, espaco, fonte, raio } from '@/lib/theme';

/** Navegação entre meses. Não deixa avançar para o futuro. */
export function SeletorMes() {
  const { mes, irParaMes } = useDados();
  const mesAtual = chaveMes(new Date());
  const podeAvancar = mes < mesAtual;

  return (
    <View style={estilos.linha}>
      <Seta
        direcao="anterior"
        onPress={() => irParaMes(deslocaMes(mes, -1))}
        habilitada
      />
      <Pressable
        onPress={() => irParaMes(mesAtual)}
        accessibilityRole="button"
        accessibilityLabel={`Mês em foco: ${mesPorExtenso(mes)}. Toque para voltar ao mês atual.`}
        style={estilos.centro}
      >
        <Text style={estilos.mes}>{mesPorExtenso(mes)}</Text>
        {mes !== mesAtual ? <Text style={estilos.voltar}>toque para voltar ao mês atual</Text> : null}
      </Pressable>
      <Seta
        direcao="proximo"
        onPress={() => podeAvancar && irParaMes(deslocaMes(mes, 1))}
        habilitada={podeAvancar}
      />
    </View>
  );
}

function Seta({
  direcao,
  onPress,
  habilitada,
}: {
  direcao: 'anterior' | 'proximo';
  onPress: () => void;
  habilitada: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!habilitada}
      accessibilityRole="button"
      accessibilityLabel={direcao === 'anterior' ? 'Mês anterior' : 'Próximo mês'}
      style={({ pressed }) => [
        estilos.seta,
        { opacity: !habilitada ? 0.25 : pressed ? 0.6 : 1 },
      ]}
    >
      <Text style={estilos.setaTexto}>{direcao === 'anterior' ? '‹' : '›'}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
  },
  mes: {
    fontSize: fonte.subtitulo,
    fontWeight: '700',
    color: cores.texto,
    textTransform: 'capitalize',
  },
  voltar: {
    fontSize: fonte.mini,
    color: cores.primaria,
  },
  seta: {
    width: 44,
    height: 44,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  setaTexto: {
    fontSize: 26,
    lineHeight: 30,
    color: cores.texto,
    fontWeight: '700',
  },
});
