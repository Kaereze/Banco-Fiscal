import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Desce, Sobe } from '@/components/animacao';
import { TelaAba } from '@/components/layout/Tela';
import { Aviso, Botao, CabecalhoTela, ItemMenu } from '@/components/ui';
import { mesPorExtenso } from '@/lib/format';
import { useDados } from '@/lib/dados';
import { useSessao } from '@/lib/sessao';
import { cores, espaco, fonte, raio, textoSobre } from '@/lib/theme';

export default function Perfil() {
  const router = useRouter();
  const { sessao, perfil, perfilResolvido, sair } = useSessao();
  const { mes } = useDados();

  const corAvatar = perfil?.cor ?? cores.primaria;
  const nome = perfil?.nome ?? 'Sem perfil';
  const inicial = (perfil?.nome ?? sessao?.user.email ?? '?').charAt(0).toUpperCase();

  function confirmarSaida() {
    Alert.alert('Sair do app', 'Você precisará digitar o e-mail e a senha de novo.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void sair() },
    ]);
  }

  return (
    <TelaAba>
      <Desce>
        <CabecalhoTela titulo="Perfil" />
      </Desce>

      <Sobe indice={1} style={estilos.identidade}>
        <View style={[estilos.avatar, { backgroundColor: corAvatar }]}>
          <Text style={[estilos.avatarTexto, { color: textoSobre(corAvatar) }]}>{inicial}</Text>
        </View>
        <Text style={estilos.nome}>{nome}</Text>
        <Text style={estilos.email} numberOfLines={1}>
          {sessao?.user.email}
        </Text>
      </Sobe>

      {perfilResolvido && !perfil ? (
        <Aviso
          tipo="alerta"
          texto="Esta conta ainda não faz parte da família, então o app não enxerga nenhum dado. Peça para quem administra rodar o cadastro com este e-mail."
        />
      ) : null}

      <Sobe indice={2} style={estilos.menu}>
        <ItemMenu
          icone="pie-chart-outline"
          titulo="Orçamento do mês"
          apoio={`Limites por categoria em ${mesPorExtenso(mes)}`}
          onPress={() => router.push('/orcamento')}
        />
        <ItemMenu
          icone="shield-checkmark-outline"
          titulo="Como os dados chegam"
          apoio="Pluggy, servidor e segurança"
          onPress={() => router.push('/sobre')}
        />
      </Sobe>

      <Sobe indice={3}>
        <Botao titulo="Sair" variante="sutil" icone="log-out-outline" onPress={confirmarSaida} />
      </Sobe>
    </TelaAba>
  );
}

const estilos = StyleSheet.create({
  identidade: { alignItems: 'center', gap: espaco.xs },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaco.sm,
  },
  avatarTexto: { fontSize: fonte.titulo, fontWeight: '800' },
  nome: { fontSize: fonte.subtitulo, fontWeight: '800', color: cores.verdeEscuro },
  email: { fontSize: fonte.apoio, color: cores.textoSuave },
  menu: { gap: espaco.sm },
});
