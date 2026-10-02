import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StatusBadge } from '@/components/status-badge';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { buscarOrdem, excluirOrdem } from '@/database';
import { useTheme } from '@/hooks/use-theme';
import type { OrdemServico } from '@/types';
import { dataParaTela } from '@/utils/datas';
import { apagarFoto } from '@/utils/foto';
import { mostrarAviso } from '@/utils/aviso';
import { calcularStatus } from '@/utils/status';

export default function DetalhesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ordemId = /^\d+$/.test(id) ? Number(id) : null;
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [excluindo, setExcluindo] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  // Recarrega a ordem ao voltar da edição para mostrar os dados atualizados.
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      async function carregar() {
        if (ordemId === null) {
          setEstado('erro');
          return;
        }
        setEstado('carregando');
        try {
          const resultado = await buscarOrdem(ordemId);
          if (ativo) {
            setOrdem(resultado);
            setEstado('pronto');
          }
        } catch (erro) {
          console.warn(`Falha ao carregar ordem (tentativa ${tentativa + 1}):`, erro);
          if (ativo) setEstado('erro');
        }
      }
      void carregar();
      return () => {
        ativo = false;
      };
    }, [ordemId, tentativa])
  );

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function confirmarExclusao() {
    if (!ordem || excluindo) return;
    if (Platform.OS === 'web') {
      if (window.confirm('Excluir ordem? Esta ação não pode ser desfeita.')) void excluir();
      return;
    }
    Alert.alert('Excluir ordem?', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => void excluir() },
    ]);
  }

  async function excluir() {
    if (!ordem || excluindo) return;
    setExcluindo(true);
    try {
      await excluirOrdem(ordem.id);
      try {
        apagarFoto(ordem.fotoUri);
      } catch (erro) {
        console.warn('Não foi possível remover a foto da ordem excluída:', erro);
      }
      voltar();
    } catch (erro) {
      console.warn('Falha ao excluir a ordem:', erro);
      mostrarAviso('Erro', 'Não foi possível excluir a ordem de serviço.');
      setExcluindo(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + Spacing.four,
            paddingLeft: insets.left + Spacing.four,
            paddingRight: insets.right + Spacing.four,
          },
        ]}>
        <Pressable accessibilityRole="button" onPress={voltar} style={styles.button}>
          <ThemedText>← Voltar</ThemedText>
        </Pressable>
        <ThemedText type="subtitle" accessibilityRole="header">Detalhes da ordem</ThemedText>

        {estado === 'carregando' ? (
          <ActivityIndicator size="large" color={theme.text} />
        ) : estado === 'erro' ? (
          <>
            <ThemedText>Não foi possível carregar a ordem.</ThemedText>
            <Pressable accessibilityRole="button" onPress={() => setTentativa((valor) => valor + 1)} style={styles.button}>
              <ThemedText>Tentar novamente</ThemedText>
            </Pressable>
          </>
        ) : !ordem ? (
          <ThemedText>Ordem de serviço não encontrada.</ThemedText>
        ) : (
          <>
            {ordem.fotoUri ? (
              <Image source={{ uri: ordem.fotoUri }} style={styles.photo} contentFit="contain" />
            ) : (
              <ThemedView type="backgroundElement" style={styles.photoPlaceholder}>
                <ThemedText themeColor="textSecondary">Sem foto do equipamento</ThemedText>
              </ThemedView>
            )}
            <Dado label="Cliente" valor={ordem.nomeCliente} />
            <Dado label="Equipamento" valor={ordem.equipamento} />
            <Dado label="Defeito relatado" valor={ordem.defeitoRelatado} />
            <Dado label="Data de entrada" valor={dataParaTela(ordem.dataEntrada)} />
            <Dado label="Previsão de entrega" valor={dataParaTela(ordem.previsaoEntrega)} />
            <Dado label="Situação do serviço" valor={ordem.situacao} />
            <ThemedView style={styles.field}>
              <ThemedText type="smallBold" themeColor="textSecondary">Status</ThemedText>
              <StatusBadge status={calcularStatus(ordem.situacao, ordem.previsaoEntrega)} />
            </ThemedView>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/cadastro', params: { id: String(ordem.id) } })}
              style={[styles.actionButton, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">Editar</ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: excluindo }}
              disabled={excluindo}
              onPress={confirmarExclusao}
              style={[styles.actionButton, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">{excluindo ? 'Excluindo...' : 'Excluir'}</ThemedText>
            </Pressable>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function Dado({ label, valor }: { label: string; valor: string }) {
  return (
    <ThemedView style={styles.field}>
      <ThemedText type="smallBold" themeColor="textSecondary">{label}</ThemedText>
      <ThemedText>{valor}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.three },
  button: { alignSelf: 'flex-start', minHeight: 48, justifyContent: 'center' },
  photo: { width: '100%', height: 300, borderRadius: Spacing.two },
  photoPlaceholder: { height: 180, alignItems: 'center', justifyContent: 'center', borderRadius: Spacing.two },
  field: { gap: Spacing.one },
  actionButton: { minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: Spacing.two },
});
