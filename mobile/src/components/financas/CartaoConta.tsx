import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Cartao } from '@/components/ui';
import { moeda } from '@/lib/format';
import { cores, espaco, fonte, raio } from '@/lib/theme';
import type { Conta } from '@/lib/types';

export function CartaoConta({ conta }: { conta: Conta }) {
  const cartao = conta.tipo === 'CREDIT';
  const saldo = conta.saldo ?? 0;

  return (
    <Cartao style={estilos.cartao}>
      <View style={estilos.topo}>
        <View style={estilos.icone}>
          <Ionicons name={cartao ? 'card-outline' : 'business-outline'} size={22} color={cores.verdeEscuro} />
        </View>
        <View style={estilos.textos}>
          <Text style={estilos.nome} numberOfLines={1}>
            {conta.nome}
          </Text>
          <Text style={estilos.detalhe} numberOfLines={1}>
            {[conta.instituicao, conta.numero, conta.dono].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {conta.sincronizado_em ? (
          <Ionicons name="checkmark-circle" size={22} color={cores.entrada} accessibilityLabel="Sincronizada" />
        ) : null}
      </View>

      <View style={estilos.rodape}>
        <Text style={estilos.rotulo}>{cartao ? 'Fatura atual' : 'Saldo'}</Text>
        <Text style={[estilos.saldo, saldo < 0 && estilos.negativo]}>
          {saldo < 0 ? '− ' : ''}
          {moeda(saldo)}
        </Text>
      </View>

      {cartao && conta.limite ? <Text style={estilos.detalhe}>Limite total {moeda(conta.limite)}</Text> : null}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  cartao: { gap: espaco.md },
  topo: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  icone: {
    width: 44,
    height: 44,
    borderRadius: raio.pilula,
    backgroundColor: cores.primariaSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: { flex: 1 },
  nome: { fontSize: fonte.corpo, fontWeight: '700', color: cores.texto },
  detalhe: { fontSize: fonte.mini, color: cores.textoFraco },
  rodape: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  rotulo: { fontSize: fonte.apoio, color: cores.textoSuave },
  saldo: { fontSize: fonte.subtitulo, fontWeight: '800', color: cores.verdeEscuro, fontVariant: ['tabular-nums'] },
  negativo: { color: cores.saida },
});
