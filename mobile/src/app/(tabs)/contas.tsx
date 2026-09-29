import { StyleSheet, View } from 'react-native';

import { Desce, Sobe } from '@/components/animacao';
import { useBuscaNoBanco } from '@/components/carregamento/useBuscaNoBanco';
import { CartaoConta } from '@/components/financas/CartaoConta';
import { CartaoSaldo } from '@/components/financas/CartaoSaldo';
import { StatusSincronizacao } from '@/components/financas/StatusSincronizacao';
import { TelaAba } from '@/components/layout/Tela';
import { Aviso, Botao, CabecalhoTela, Carregando, Cartao, Secao, Titulo, Vazio } from '@/components/ui';
import { useDados } from '@/lib/dados';
import { espaco } from '@/lib/theme';

export default function Contas() {
  const { contas, ultimaSync, sincronizando, recarregar, carregando, erro } = useDados();
  const buscarNoBanco = useBuscaNoBanco();

  const emConta = contas.filter((c) => c.tipo !== 'CREDIT');
  const cartoes = contas.filter((c) => c.tipo === 'CREDIT');
  const totalEmConta = emConta.reduce((soma, c) => soma + (c.saldo ?? 0), 0);

  return (
    <TelaAba aoAtualizar={recarregar}>
      <Desce>
        <CabecalhoTela titulo="Minhas Contas" subtitulo="Bancos conectados pela Pluggy" />
      </Desce>

      <Sobe indice={1}>
        <StatusSincronizacao ultimaSync={ultimaSync} />
      </Sobe>

      {erro ? <Aviso texto={erro} /> : null}

      <Sobe indice={2} style={estilos.acoes}>
        <Botao
          titulo={sincronizando ? 'Sincronizando...' : 'Sincronizar agora'}
          icone="sync"
          carregando={sincronizando}
          onPress={() => void buscarNoBanco()}
        />
        <Botao
          titulo="Recarregar 2 anos de histórico"
          variante="secundario"
          desabilitado={sincronizando}
          onPress={() => void buscarNoBanco(true)}
        />
      </Sobe>

      {contas.length === 0 ? (
        <Cartao>
          {carregando ? (
            <Carregando />
          ) : (
            <Vazio
              icone="link-outline"
              titulo="Nenhuma conta conectada ainda"
              texto="Conecte seus bancos em meu.pluggy.ai e toque em Sincronizar agora."
            />
          )}
        </Cartao>
      ) : (
        <>
          <Sobe indice={3}>
            <CartaoSaldo rotulo="Saldo somado das contas" valor={totalEmConta} />
          </Sobe>

          {emConta.length > 0 ? (
            <Sobe indice={4}>
              <Secao>
                <Titulo>Contas</Titulo>
                <View style={estilos.lista}>
                  {emConta.map((conta) => (
                    <CartaoConta key={conta.id} conta={conta} />
                  ))}
                </View>
              </Secao>
            </Sobe>
          ) : null}

          {cartoes.length > 0 ? (
            <Sobe indice={5}>
              <Secao>
                <Titulo>Cartões de crédito</Titulo>
                <View style={estilos.lista}>
                  {cartoes.map((conta) => (
                    <CartaoConta key={conta.id} conta={conta} />
                  ))}
                </View>
              </Secao>
            </Sobe>
          ) : null}
        </>
      )}
    </TelaAba>
  );
}

const estilos = StyleSheet.create({
  acoes: { gap: espaco.md },
  lista: { gap: espaco.sm },
});
