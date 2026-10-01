import { StyleSheet, View } from 'react-native';

import { Desce, SaiDeLado, Sobe } from '@/components/animacao';
import { CartaoContaAPagar } from '@/components/financas/CartaoContaAPagar';
import { CartaoMetrica, LinhaMetricas } from '@/components/financas/CartaoMetrica';
import { FormularioContaAPagar } from '@/components/financas/FormularioContaAPagar';
import { SeletorMes } from '@/components/financas/SeletorMes';
import { TelaAba } from '@/components/layout/Tela';
import { Aviso, CabecalhoTela, Carregando, Cartao, Secao, Titulo, Vazio } from '@/components/ui';
import { useContasAPagar } from '@/lib/contasAPagar';
import { useDados } from '@/lib/dados';
import { avisar, confirmar, mensagemDeErro } from '@/lib/dialogos';
import { cores, espaco } from '@/lib/theme';
import type { ContaAPagar } from '@/lib/types';

export default function ContasAPagar() {
  const { mes } = useDados();
  const { contas, carregando, erro, recarregar, adicionar, editar, alternarPaga, remover } =
    useContasAPagar(mes);

  const total = contas.reduce((soma, c) => soma + (c.valor ?? 0), 0);
  const pago = contas.reduce((soma, c) => soma + (c.paga ? (c.valor ?? 0) : 0), 0);

  async function tentar(acao: () => Promise<void>) {
    try {
      await acao();
    } catch (e) {
      avisar('Não consegui salvar', mensagemDeErro(e));
      await recarregar();
    }
  }

  async function apagar(conta: ContaAPagar) {
    const quer = await confirmar('Apagar conta', `"${conta.descricao}" sai da lista deste mês.`, 'Apagar');
    if (quer) await tentar(() => remover(conta.id));
  }

  return (
    <TelaAba aoAtualizar={recarregar}>
      <Desce>
        <CabecalhoTela titulo="Contas a pagar" subtitulo="O que vence no mês, num lugar só" />
      </Desce>
      <Desce indice={1}>
        <SeletorMes />
      </Desce>

      {erro ? <Aviso texto={erro} /> : null}

      <Sobe indice={2}>
        <LinhaMetricas>
          <CartaoMetrica titulo="Total" valor={total} icone="receipt-outline" cor={cores.verdeEscuro} />
          <CartaoMetrica titulo="Pago" valor={pago} icone="checkmark-circle-outline" cor={cores.entrada} />
          <CartaoMetrica titulo="Falta" valor={total - pago} icone="time-outline" cor={cores.saida} />
        </LinhaMetricas>
      </Sobe>

      <Sobe indice={3}>
        <FormularioContaAPagar mes={mes} aoAdicionar={adicionar} />
      </Sobe>

      <Sobe indice={4}>
        <Secao>
          <Titulo>Contas do mês</Titulo>
          {carregando ? (
            <Carregando />
          ) : contas.length === 0 ? (
            <Cartao>
              <Vazio
                icone="receipt-outline"
                titulo="Nenhuma conta anotada"
                texto="Adicione acima as contas que vencem neste mês."
              />
            </Cartao>
          ) : (
            <View style={estilos.lista}>
              {contas.map((conta) => (
                <SaiDeLado key={conta.id}>
                  <CartaoContaAPagar
                    conta={conta}
                    aoAlternarPaga={() => void tentar(() => alternarPaga(conta))}
                    aoEditar={(mudancas) => void tentar(() => editar(conta.id, mudancas))}
                    aoApagar={() => void apagar(conta)}
                  />
                </SaiDeLado>
              ))}
            </View>
          )}
        </Secao>
      </Sobe>
    </TelaAba>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espaco.sm },
});
