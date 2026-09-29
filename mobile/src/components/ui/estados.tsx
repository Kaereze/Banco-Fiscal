import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import type { NomeIcone } from '@/components/ui/icone';
import { cores, espaco, fonte, raio } from '@/lib/theme';

export function Vazio({ icone, titulo, texto }: { icone: NomeIcone; titulo: string; texto?: string }) {
  return (
    <View style={estilos.vazio}>
      <View style={estilos.vazioIcone}>
        <Ionicons name={icone} size={28} color={cores.primaria} />
      </View>
      <Text style={estilos.vazioTitulo}>{titulo}</Text>
      {texto ? <Text style={estilos.vazioTexto}>{texto}</Text> : null}
    </View>
  );
}

export function Carregando() {
  return (
    <View style={estilos.carregando}>
      <ActivityIndicator color={cores.primaria} accessibilityLabel="Carregando" />
    </View>
  );
}

export function Aviso({ tipo = 'erro', texto }: { tipo?: 'erro' | 'alerta'; texto: string }) {
  const fundo = tipo === 'erro' ? cores.saidaSuave : cores.alertaSuave;
  const cor = tipo === 'erro' ? cores.saida : cores.alerta;
  return (
    <View style={[estilos.aviso, { backgroundColor: fundo }]} accessibilityRole="alert">
      <Ionicons name={tipo === 'erro' ? 'alert-circle' : 'information-circle'} size={20} color={cor} />
      <Text style={[estilos.avisoTexto, { color: cor }]}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  vazio: {
    alignItems: 'center',
    gap: espaco.sm,
    paddingVertical: espaco.xxl,
    paddingHorizontal: espaco.lg,
  },
  vazioIcone: {
    width: 56,
    height: 56,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.primariaSuave,
    marginBottom: espaco.xs,
  },
  vazioTitulo: { fontSize: fonte.secao, fontWeight: '700', color: cores.texto, textAlign: 'center' },
  vazioTexto: { fontSize: fonte.apoio, color: cores.textoSuave, textAlign: 'center', lineHeight: 22 },
  carregando: { paddingVertical: espaco.xxl, alignItems: 'center' },
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaco.sm,
    borderRadius: raio.campo,
    padding: espaco.md,
  },
  avisoTexto: { flex: 1, fontSize: fonte.apoio, fontWeight: '600', lineHeight: 21 },
});
