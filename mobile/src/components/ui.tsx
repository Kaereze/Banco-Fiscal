import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from 'react-native';

import { ALTURA_TOQUE, cores, espaco, fonte, raio, sombra, textoSobre } from '@/lib/theme';

// ------------------------------------------------------------
export function Cartao({ style, ...resto }: ViewProps) {
  return <View style={[estilos.cartao, style]} {...resto} />;
}

// ------------------------------------------------------------
export function Titulo({ children }: { children: React.ReactNode }) {
  return <Text style={estilos.titulo}>{children}</Text>;
}

export function Rotulo({ children }: { children: React.ReactNode }) {
  return <Text style={estilos.rotulo}>{children}</Text>;
}

// ------------------------------------------------------------
type BotaoProps = {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'perigo';
  carregando?: boolean;
  desabilitado?: boolean;
};

export function Botao({
  titulo,
  onPress,
  variante = 'primario',
  carregando = false,
  desabilitado = false,
}: BotaoProps) {
  const inativo = desabilitado || carregando;
  const fundo =
    variante === 'primario' ? cores.primaria : variante === 'perigo' ? cores.saidaSuave : cores.superficieSuave;
  const corTexto =
    variante === 'primario' ? textoSobre(cores.primaria) : variante === 'perigo' ? cores.saida : cores.texto;

  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo, busy: carregando }}
      style={({ pressed }) => [
        estilos.botao,
        { backgroundColor: fundo, opacity: inativo ? 0.55 : pressed ? 0.85 : 1 },
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <Text style={[estilos.botaoTexto, { color: corTexto }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

// ------------------------------------------------------------
type CampoProps = TextInputProps & { rotulo: string; dica?: string };

export function Campo({ rotulo, dica, style, ...resto }: CampoProps) {
  return (
    <View style={{ gap: espaco.xs }}>
      <Rotulo>{rotulo}</Rotulo>
      <TextInput
        placeholderTextColor={cores.textoFraco}
        style={[estilos.campo, style]}
        {...resto}
      />
      {dica ? <Text style={estilos.dica}>{dica}</Text> : null}
    </View>
  );
}

// ------------------------------------------------------------
export function Vazio({ emoji, titulo, texto }: { emoji: string; titulo: string; texto?: string }) {
  return (
    <View style={estilos.vazio}>
      <Text style={estilos.vazioEmoji}>{emoji}</Text>
      <Text style={estilos.vazioTitulo}>{titulo}</Text>
      {texto ? <Text style={estilos.vazioTexto}>{texto}</Text> : null}
    </View>
  );
}

// ------------------------------------------------------------
export function Aviso({ tipo = 'erro', texto }: { tipo?: 'erro' | 'alerta'; texto: string }) {
  const fundo = tipo === 'erro' ? cores.saidaSuave : cores.alertaSuave;
  const cor = tipo === 'erro' ? cores.saida : cores.alerta;
  return (
    <View style={[estilos.aviso, { backgroundColor: fundo }]}>
      <Text style={[estilos.avisoTexto, { color: cor }]}>{texto}</Text>
    </View>
  );
}

// ------------------------------------------------------------
/** Pílula selecionável — usada para filtros e escolha de categoria. */
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
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={[estilos.pilulaTexto, { color: ativa ? textoSobre(cor) : cores.textoSuave }]}>
        {texto}
      </Text>
    </Pressable>
  );
}

// ------------------------------------------------------------
const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    padding: espaco.lg,
    ...sombra,
  },
  titulo: {
    fontSize: fonte.subtitulo,
    fontWeight: '700',
    color: cores.texto,
  },
  rotulo: {
    fontSize: fonte.apoio,
    fontWeight: '600',
    color: cores.textoSuave,
  },
  botao: {
    minHeight: ALTURA_TOQUE,
    borderRadius: raio.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espaco.lg,
  },
  botaoTexto: {
    fontSize: fonte.corpo,
    fontWeight: '700',
  },
  campo: {
    minHeight: ALTURA_TOQUE,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.md,
    paddingHorizontal: espaco.md,
    fontSize: fonte.corpo,
    color: cores.texto,
    backgroundColor: cores.superficie,
  },
  dica: {
    fontSize: fonte.mini,
    color: cores.textoFraco,
  },
  vazio: {
    alignItems: 'center',
    gap: espaco.sm,
    paddingVertical: espaco.xxl,
    paddingHorizontal: espaco.lg,
  },
  vazioEmoji: { fontSize: 40 },
  vazioTitulo: {
    fontSize: fonte.subtitulo,
    fontWeight: '700',
    color: cores.texto,
    textAlign: 'center',
  },
  vazioTexto: {
    fontSize: fonte.apoio,
    color: cores.textoSuave,
    textAlign: 'center',
    lineHeight: 22,
  },
  aviso: {
    borderRadius: raio.md,
    padding: espaco.md,
  },
  avisoTexto: {
    fontSize: fonte.apoio,
    fontWeight: '600',
    lineHeight: 21,
  },
  pilula: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: espaco.md,
    borderRadius: raio.pilula,
    borderWidth: 1,
  },
  pilulaTexto: {
    fontSize: fonte.apoio,
    fontWeight: '600',
  },
});
