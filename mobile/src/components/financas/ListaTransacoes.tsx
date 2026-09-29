import { StyleSheet, View } from 'react-native';

import { ItemTransacao } from '@/components/financas/ItemTransacao';
import { espaco } from '@/lib/theme';
import type { Categoria, Transacao } from '@/lib/types';

export function ListaTransacoes({
  transacoes,
  categorias,
}: {
  transacoes: Transacao[];
  categorias: Categoria[];
}) {
  return (
    <View style={estilos.lista}>
      {transacoes.map((transacao) => (
        <ItemTransacao
          key={transacao.id}
          transacao={transacao}
          categoria={categorias.find((c) => c.id === transacao.categoria_id) ?? null}
        />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espaco.sm },
});
