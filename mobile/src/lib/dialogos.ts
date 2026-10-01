import { Alert, Platform } from 'react-native';

const NO_NAVEGADOR = Platform.OS === 'web';

export function avisar(titulo: string, mensagem: string): void {
  if (NO_NAVEGADOR) {
    window.alert(`${titulo}\n\n${mensagem}`);
    return;
  }
  Alert.alert(titulo, mensagem);
}

export function confirmar(titulo: string, mensagem: string, acao: string): Promise<boolean> {
  if (NO_NAVEGADOR) return Promise.resolve(window.confirm(`${titulo}\n\n${mensagem}`));

  return new Promise((resolver) => {
    Alert.alert(
      titulo,
      mensagem,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolver(false) },
        { text: acao, style: 'destructive', onPress: () => resolver(true) },
      ],
      { cancelable: true, onDismiss: () => resolver(false) },
    );
  });
}

export function mensagemDeErro(erro: unknown, padrao = 'Tente de novo.'): string {
  return erro instanceof Error ? erro.message : padrao;
}
