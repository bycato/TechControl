import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StatusBadge } from '@/components/status-badge';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { listarOrdens } from '@/database';
import { useTheme } from '@/hooks/use-theme';
import type { OrdemServico, StatusServico } from '@/types';
import { calcularStatus } from '@/utils/status';

const filtros: ('Todos' | StatusServico)[] = [
  'Todos', 'Em análise', 'Em manutenção', 'Pronto', 'Atrasado',
];

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function ListagemScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [tentativa, setTentativa] = useState(0);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'Todos' | StatusServico>('Todos');

  const ordensVisiveis = useMemo(() => {
    const termo = normalizar(busca.trim());
    return ordens.filter((ordem) => {
      const combinaTexto = !termo || normalizar(`${ordem.nomeCliente} ${ordem.equipamento} ${ordem.defeitoRelatado}`).includes(termo);
      const combinaStatus = filtro === 'Todos' || calcularStatus(ordem.situacao, ordem.previsaoEntrega) === filtro;
      return combinaTexto && combinaStatus;
    });
  }, [ordens, busca, filtro]);

  // Atualiza a lista sempre que a tela recebe foco ou o usuário repete uma consulta.
  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function carregarOrdens() {
        setEstado('carregando');
        try {
          const resultado = await listarOrdens();
          if (ativo) {
            setOrdens(resultado);
            setEstado('pronto');
          }
        } catch (erro) {
          console.warn(`Falha ao listar ordens (tentativa ${tentativa + 1}):`, erro);
          if (ativo) setEstado('erro');
        }
      }

      void carregarOrdens();

      // Evita que uma consulta antiga atualize a tela após a saída do usuário.
      return () => {
        ativo = false;
      };
    }, [tentativa])
  );

  return (
    <ThemedView style={styles.container}>
      {/* Afasta o conteúdo das bordas do sistema e da navegação inferior. */}
      <ThemedView
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: insets.bottom + Spacing.four,
            paddingLeft: insets.left + Spacing.four,
            paddingRight: insets.right + Spacing.four,
          },
        ]}>
        <ThemedView style={styles.header}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            TechControl
          </ThemedText>
          <ThemedText type="subtitle" accessibilityRole="header">
            Ordens de serviço
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/cadastro')}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
            ]}>
            <ThemedText type="smallBold">Cadastrar</ThemedText>
          </Pressable>
          <TextInput
            accessibilityLabel="Buscar ordens de serviço"
            placeholder="Buscar cliente, equipamento ou defeito"
            placeholderTextColor={theme.textSecondary}
            value={busca}
            onChangeText={setBusca}
            style={[styles.search, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {filtros.map((opcao) => (
              <Pressable
                key={opcao}
                accessibilityRole="button"
                accessibilityState={{ selected: filtro === opcao }}
                onPress={() => setFiltro(opcao)}
                style={[
                  styles.filter,
                  { backgroundColor: filtro === opcao ? theme.backgroundSelected : theme.backgroundElement },
                ]}>
                <ThemedText type="small">{opcao}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </ThemedView>

        {estado === 'carregando' ? (
          <ThemedView style={styles.emptyState}>
            <ActivityIndicator size="large" color={theme.text} />
            <ThemedText style={styles.message}>Carregando ordens de serviço...</ThemedText>
          </ThemedView>
        ) : estado === 'erro' ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.message} accessibilityRole="alert">
              Não foi possível carregar as ordens de serviço.
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setEstado('carregando');
                setTentativa((valor) => valor + 1);
              }}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
              ]}>
              <ThemedText>Tentar novamente</ThemedText>
            </Pressable>
          </ThemedView>
        ) : (
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={ordensVisiveis}
            keyExtractor={(ordem) => String(ordem.id)}
            ListEmptyComponent={
              <ThemedView style={styles.emptyState}>
                <ThemedText themeColor="textSecondary" style={styles.message}>
                  {ordens.length === 0
                    ? 'Nenhuma ordem de serviço cadastrada'
                    : 'Nenhuma ordem encontrada para esta busca ou filtro'}
                </ThemedText>
              </ThemedView>
            }
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ver ordem de ${item.nomeCliente}`}
                onPress={() => router.push({ pathname: '/detalhes', params: { id: String(item.id) } })}>
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText type="smallBold">Cliente: {item.nomeCliente}</ThemedText>
                  <ThemedText>Equipamento: {item.equipamento}</ThemedText>
                  <StatusBadge status={calcularStatus(item.situacao, item.previsaoEntrega)} />
                </ThemedView>
              </Pressable>
            )}
          />
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  header: {
    gap: Spacing.two,
  },
  search: { minHeight: 48, borderRadius: Spacing.two, paddingHorizontal: Spacing.three, fontSize: 16 },
  filters: { gap: Spacing.two, paddingVertical: Spacing.one },
  filter: { minHeight: 40, justifyContent: 'center', borderRadius: Spacing.five, paddingHorizontal: Spacing.three },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  list: {
    flex: 1,
    marginTop: Spacing.four,
  },
  listContent: {
    flexGrow: 1,
    gap: Spacing.three,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  message: {
    textAlign: 'center',
  },
});
