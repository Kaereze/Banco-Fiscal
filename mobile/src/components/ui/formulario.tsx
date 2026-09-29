import { Ionicons } from '@expo/vector-icons';
import type { ReactNode, Ref } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Cartao, Rotulo } from '@/components/ui/blocos';
import type { NomeIcone } from '@/components/ui/icone';
import { ALTURA_CAMPO, cores, espaco, fonte, raio, textoSobre } from '@/lib/theme';

export function Campo({
  rotulo,
  dica,
  icone,
  style,
  ref,
  ...resto
}: TextInputProps & { rotulo?: string; dica?: string; icone?: NomeIcone; ref?: Ref<TextInput> }) {
  return (
    <View style={estilos.grupo}>
      {rotulo ? <Rotulo>{rotulo}</Rotulo> : null}
      <View style={estilos.campo}>
        {icone ? <Ionicons name={icone} size={20} color={cores.textoFraco} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={cores.textoFraco}
          accessibilityLabel={rotulo ?? resto.placeholder}
          style={[estilos.campoTexto, style]}
          {...resto}
        />
      </View>
      {dica ? <Text style={estilos.dica}>{dica}</Text> : null}
    </View>
  );
}

export function Pilula({
  texto,
  ativa,
  cor = cores.primaria,
  onPress,
}: {
  texto: string;
  ativa: boolean;
  cor?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: ativa }}
      style={({ pressed }) => [
        estilos.pilula,
        ativa
          ? { backgroundColor: cor, borderColor: cor }
          : { backgroundColor: cores.superficie, borderColor: cores.borda },
        pressed && estilos.pressionado,
      ]}
    >
      <Text style={[estilos.pilulaTexto, { color: ativa ? textoSobre(cor) : cores.textoSuave }]}>
        {texto}
      </Text>
    </Pressable>
  );
}

export function GradePilulas({ children }: { children: ReactNode }) {
  return <View style={estilos.grade}>{children}</View>;
}

export function Chave({
  titulo,
  texto,
  valor,
  aoMudar,
  cor = cores.primaria,
}: {
  titulo: string;
  texto: string;
  valor: boolean;
  aoMudar: (valor: boolean) => void;
  cor?: string;
}) {
  return (
    <Cartao style={estilos.chave}>
      <View style={estilos.chaveTextos}>
        <Text style={estilos.chaveTitulo}>{titulo}</Text>
        <Text style={estilos.chaveTexto}>{texto}</Text>
      </View>
      <Switch
        value={valor}
        onValueChange={aoMudar}
        trackColor={{ true: cor, false: cores.borda }}
        accessibilityLabel={titulo}
      />
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espaco.xs },
  pressionado: { opacity: 0.8 },
  campo: {
    minHeight: ALTURA_CAMPO,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.campo,
    paddingHorizontal: espaco.lg,
    backgroundColor: cores.superficie,
  },
  campoTexto: {
    flex: 1,
    minWidth: 0,
    minHeight: ALTURA_CAMPO - 2,
    fontSize: fonte.corpo,
    color: cores.texto,
  },
  dica: { fontSize: fonte.mini, color: cores.textoFraco },
  pilula: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: espaco.lg,
    borderRadius: raio.pilula,
    borderWidth: 1,
  },
  pilulaTexto: { fontSize: fonte.apoio, fontWeight: '600' },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  chave: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  chaveTextos: { flex: 1 },
  chaveTitulo: { fontSize: fonte.corpo, fontWeight: '700', color: cores.texto },
  chaveTexto: { fontSize: fonte.mini, color: cores.textoSuave, lineHeight: 19, marginTop: 2 },
});
