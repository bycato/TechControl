import { Alert, Platform } from 'react-native';

/** Mostra mensagens no celular e no navegador; a ação ocorre após o usuário fechar o aviso. */
export function mostrarAviso(titulo: string, mensagem: string, aoFechar?: () => void): void {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensagem}`);
    aoFechar?.();
    return;
  }

  Alert.alert(titulo, mensagem, [{ text: 'OK', onPress: aoFechar }]);
}
