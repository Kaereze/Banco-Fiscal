import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { seloDaConta } from '@/lib/marcasDasContas';
import { cores, raio, sombra } from '@/lib/theme';

const TAMANHO = 44;

export function SeloConta({ descricao, identificador }: { descricao: string; identificador: string | null }) {
  const selo = seloDaConta(descricao, identificador);
  const [logoFalhou, setLogoFalhou] = useState(false);
  const mostrarLogo = selo.logo !== null && !logoFalhou;

  return (
    <View
      style={[estilos.selo, mostrarLogo ? estilos.seloLogo : estilos.seloEmoji]}
      accessibilityRole="image"
      accessibilityLabel={selo.marca ?? descricao}
    >
      {mostrarLogo ? (
        <Image source={{ uri: selo.logo as string }} style={estilos.logo} onError={() => setLogoFalhou(true)} />
      ) : (
        <Text style={estilos.emoji}>{selo.emoji}</Text>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  selo: {
    width: TAMANHO,
    height: TAMANHO,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  seloLogo: { backgroundColor: cores.superficie, ...sombra },
  seloEmoji: { backgroundColor: cores.primariaSuave },
  logo: { width: 28, height: 28 },
  emoji: { fontSize: 22 },
});
