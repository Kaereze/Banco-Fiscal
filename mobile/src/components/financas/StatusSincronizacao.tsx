import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Cartao } from '@/components/ui';
import { tempoDesde } from '@/lib/format';
import { cores, espaco, fonte, raio } from '@/lib/theme';
import type { Sincronizacao } from '@/lib/types';

export function StatusSincronizacao({ ultimaSync }: { ultimaSync: Sincronizacao | null }) {
  const falhou = ultimaSync?.sucesso === false;
  const cor = falhou ? cores.saida : cores.entrada;

  return (
    <Cartao style={estilos.cartao}>
      <View style={[estilos.icone, { backgroundColor: falhou ? cores.saidaSuave : cores.entradaSuave }]}>
        <Ionicons name={falhou ? 'alert-circle' : 'checkmark-circle'} size={28} color={cor} />
      </View>
      <View style={estilos.textos}>
        <Text style={[estilos.titulo, { color: cor }]}>
          {falhou ? 'Falha na sincronização' : ultimaSync ? 'Sincronizado' : 'Ainda não sincronizado'}
        </Text>
        <Text style={estilos.texto}>
          Última sincronização: {tempoDesde(ultimaSync?.terminada_em ?? null)}
        </Text>
        {falhou && ultimaSync?.erro ? <Text style={estilos.erro}>{ultimaSync.erro}</Text> : null}
      </View>
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  cartao: { flexDirection: 'row', alignItems: 'center', gap: espaco.lg },
  icone: {
    width: 48,
    height: 48,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: { flex: 1, gap: 2 },
  titulo: { fontSize: fonte.corpo, fontWeight: '700' },
  texto: { fontSize: fonte.apoio, color: cores.textoSuave },
  erro: { fontSize: fonte.mini, color: cores.saida, marginTop: espaco.xs },
});
