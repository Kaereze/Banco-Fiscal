import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { NomeIcone } from '@/components/ui/icone';
import {
  ALTURA_BOTAO,
  ALTURA_TOQUE,
  cores,
  espaco,
  fonte,
  raio,
  sombra,
  textoSobre,
} from '@/lib/theme';

type VarianteBotao = 'primario' | 'secundario' | 'perigo' | 'sutil';

const CORES_BOTAO: Record<VarianteBotao, { fundo: string; texto: string; borda: string }> = {
  primario: { fundo: cores.primaria, texto: textoSobre(cores.primaria), borda: cores.primaria },
  secundario: { fundo: 'transparent', texto: cores.primaria, borda: cores.primaria },
  perigo: { fundo: cores.saidaSuave, texto: cores.saida, borda: cores.saidaSuave },
  sutil: { fundo: cores.superficie, texto: cores.texto, borda: cores.borda },
};

export function Botao({
  titulo,
  onPress,
  variante = 'primario',
  icone,
  carregando = false,
  desabilitado = false,
}: {
  titulo: string;
  onPress: () => void;
  variante?: VarianteBotao;
  icone?: NomeIcone;
  carregando?: boolean;
  desabilitado?: boolean;
}) {
  const inativo = desabilitado || carregando;
  const { fundo, texto, borda } = CORES_BOTAO[variante];

  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: inativo, busy: carregando }}
      style={({ pressed }) => [
        estilos.botao,
        variante !== 'primario' && estilos.botaoSecundario,
        { backgroundColor: fundo, borderColor: borda, opacity: inativo ? 0.55 : pressed ? 0.85 : 1 },
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={texto} />
      ) : (
        <>
          {icone ? <Ionicons name={icone} size={20} color={texto} /> : null}
          <Text style={[estilos.botaoTexto, { color: texto }]}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

export function BotaoIcone({
  icone,
  rotulo,
  onPress,
}: {
  icone: NomeIcone;
  rotulo: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [estilos.botaoIcone, pressed && estilos.pressionado]}
    >
      <Ionicons name={icone} size={22} color={cores.verdeEscuro} />
    </Pressable>
  );
}

export function ItemMenu({
  icone,
  titulo,
  apoio,
  onPress,
}: {
  icone: NomeIcone;
  titulo: string;
  apoio?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={apoio ? `${titulo}. ${apoio}` : titulo}
      style={({ pressed }) => [estilos.itemMenu, pressed && estilos.pressionado]}
    >
      <View style={estilos.itemMenuIcone}>
        <Ionicons name={icone} size={22} color={cores.verdeEscuro} />
      </View>
      <View style={estilos.itemMenuTextos}>
        <Text style={estilos.itemMenuTitulo}>{titulo}</Text>
        {apoio ? <Text style={estilos.itemMenuApoio}>{apoio}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={cores.textoFraco} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pressionado: { opacity: 0.75 },
  botao: {
    minHeight: ALTURA_BOTAO,
    borderRadius: raio.botao,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.sm,
    paddingHorizontal: espaco.lg,
    borderWidth: 1,
  },
  botaoSecundario: { minHeight: 52 },
  botaoTexto: { fontSize: fonte.corpo, fontWeight: '700' },
  botaoIcone: {
    width: ALTURA_TOQUE,
    height: ALTURA_TOQUE,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.superficie,
    ...sombra,
  },
  itemMenu: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingHorizontal: espaco.lg,
    paddingVertical: espaco.md,
    borderRadius: raio.md,
    backgroundColor: cores.superficie,
    ...sombra,
  },
  itemMenuIcone: {
    width: 40,
    height: 40,
    borderRadius: raio.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.primariaSuave,
  },
  itemMenuTextos: { flex: 1 },
  itemMenuTitulo: { fontSize: fonte.corpo, fontWeight: '600', color: cores.texto },
  itemMenuApoio: { fontSize: fonte.mini, color: cores.textoFraco, marginTop: 2 },
});
