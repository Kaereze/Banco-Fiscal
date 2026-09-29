import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDados } from '@/lib/dados';
import { chaveMes, deslocaMes, mesPorExtenso, primeiraMaiuscula } from '@/lib/format';
import { ALTURA_TOQUE, cores, espaco, fonte, raio, sombra } from '@/lib/theme';

export function SeletorMes() {
  const { mes, irParaMes } = useDados();
  const mesAtual = chaveMes(new Date());
  const podeAvancar = mes < mesAtual;

  return (
    <View style={estilos.linha}>
      <Seta direcao="anterior" habilitada onPress={() => irParaMes(deslocaMes(mes, -1))} />
      <Pressable
        onPress={() => irParaMes(mesAtual)}
        accessibilityRole="button"
        accessibilityLabel={`Mês em foco: ${mesPorExtenso(mes)}. Toque para voltar ao mês atual.`}
        style={estilos.centro}
      >
        <Text style={estilos.mes}>{primeiraMaiuscula(mesPorExtenso(mes))}</Text>
        {mes !== mesAtual ? <Text style={estilos.voltar}>voltar ao mês atual</Text> : null}
      </Pressable>
      <Seta
        direcao="proximo"
        habilitada={podeAvancar}
        onPress={() => irParaMes(deslocaMes(mes, 1))}
      />
    </View>
  );
}

function Seta({
  direcao,
  habilitada,
  onPress,
}: {
  direcao: 'anterior' | 'proximo';
  habilitada: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!habilitada}
      accessibilityRole="button"
      accessibilityLabel={direcao === 'anterior' ? 'Mês anterior' : 'Próximo mês'}
      accessibilityState={{ disabled: !habilitada }}
      style={({ pressed }) => [estilos.seta, { opacity: !habilitada ? 0.3 : pressed ? 0.6 : 1 }]}
    >
      <Ionicons
        name={direcao === 'anterior' ? 'chevron-back' : 'chevron-forward'}
        size={20}
        color={cores.verdeEscuro}
      />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    padding: espaco.xs,
    borderRadius: raio.pilula,
    backgroundColor: cores.superficie,
    ...sombra,
  },
  centro: { flex: 1, alignItems: 'center' },
  mes: {
    fontSize: fonte.corpo,
    fontWeight: '700',
    color: cores.verdeEscuro,
  },
  voltar: { fontSize: fonte.mini, color: cores.primaria, fontWeight: '600' },
  seta: {
    width: ALTURA_TOQUE,
    height: ALTURA_TOQUE,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.primariaSuave,
  },
});
