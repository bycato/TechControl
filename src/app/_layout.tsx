import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { inicializarBanco } from '@/database';
import { useTheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [estadoBanco, setEstadoBanco] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [tentativa, setTentativa] = useState(0);

  // Prepara o banco ao abrir o app e repete a operação quando o usuário tenta novamente.
  useEffect(() => {
    let ativo = true;

    async function prepararBanco() {
      try {
        await inicializarBanco();
        if (ativo) setEstadoBanco('pronto');
      } catch (erro) {
        console.warn('Não foi possível inicializar o banco do TechControl:', erro);
        if (ativo) setEstadoBanco('erro');
      }
    }

    void prepararBanco();

    // Ignora o resultado se o layout for desmontado durante a inicialização.
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  // Esconde a tela nativa do Expo quando a interface de carregamento já está montada.
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  function tentarNovamente() {
    setEstadoBanco('carregando');
    setTentativa((valor) => valor + 1);
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* As telas só ficam disponíveis depois que o banco estiver preparado. */}
      {estadoBanco === 'pronto' ? (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="cadastro" />
          <Stack.Screen name="detalhes" />
        </Stack>
      ) : (
        <ThemedView
          style={[
            styles.container,
            {
              paddingTop: insets.top + 24,
              paddingBottom: insets.bottom + 24,
              paddingLeft: insets.left + 24,
              paddingRight: insets.right + 24,
            },
          ]}>
          <ThemedText type="subtitle">TechControl</ThemedText>
          {estadoBanco === 'carregando' ? (
            <>
              <ActivityIndicator size="large" color={theme.text} />
              <ThemedText style={styles.message} accessibilityLiveRegion="polite">
                Preparando o aplicativo...
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText style={styles.message} accessibilityRole="alert">
                Não foi possível preparar o banco de dados. Tente novamente.
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                onPress={tentarNovamente}
                style={({ pressed }) => [
                  styles.button,
                  { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
                ]}>
                <ThemedText>Tentar novamente</ThemedText>
              </Pressable>
            </>
          )}
        </ThemedView>
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  message: {
    textAlign: 'center',
  },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
