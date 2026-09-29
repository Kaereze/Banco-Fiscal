import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { TelaFormulario } from '@/components/layout/Tela';
import { Cartao, type NomeIcone } from '@/components/ui';
import { cores, espaco, fonte, raio } from '@/lib/theme';

const PASSOS: { icone: NomeIcone; titulo: string; texto: string }[] = [
  {
    icone: 'link-outline',
    titulo: 'Pluggy',
    texto: 'Seus bancos ficam conectados no Meu Pluggy, fora do app.',
  },
  {
    icone: 'server-outline',
    titulo: 'Servidor',
    texto: 'Uma função no Supabase guarda as chaves e busca os extratos. O app nunca vê as credenciais do banco.',
  },
  {
    icone: 'phone-portrait-outline',
    titulo: 'Este app',
    texto: 'Lê só o que já está organizado no banco de dados da família.',
  },
];

export default function Sobre() {
  return (
    <TelaFormulario>
      <Cartao style={estilos.lista}>
        {PASSOS.map((passo) => (
          <View key={passo.titulo} style={estilos.passo}>
            <View style={estilos.icone}>
              <Ionicons name={passo.icone} size={20} color={cores.verdeEscuro} />
            </View>
            <View style={estilos.textos}>
              <Text style={estilos.titulo}>{passo.titulo}</Text>
              <Text style={estilos.texto}>{passo.texto}</Text>
            </View>
          </View>
        ))}
      </Cartao>
    </TelaFormulario>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espaco.xl },
  passo: { flexDirection: 'row', gap: espaco.md, alignItems: 'flex-start' },
  icone: {
    width: 40,
    height: 40,
    borderRadius: raio.sm,
    backgroundColor: cores.primariaSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: { flex: 1, gap: 2 },
  titulo: { fontSize: fonte.corpo, fontWeight: '700', color: cores.texto },
  texto: { fontSize: fonte.apoio, color: cores.textoSuave, lineHeight: 21 },
});
