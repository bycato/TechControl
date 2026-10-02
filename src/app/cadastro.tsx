import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { buscarOrdem, cadastrarOrdem, editarOrdem } from '@/database';
import { useTheme } from '@/hooks/use-theme';
import type { DadosOrdem, OrdemServico, SituacaoServico } from '@/types';
import { mostrarAviso } from '@/utils/aviso';
import { dataParaBanco, dataParaTela } from '@/utils/datas';
import { apagarFoto, guardarFoto } from '@/utils/foto';

const situacoes: SituacaoServico[] = ['Em análise', 'Em manutenção', 'Pronto'];

export default function CadastroScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const ordemId = id && /^\d+$/.test(id) ? Number(id) : null;
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [nomeCliente, setNomeCliente] = useState('');
  const [equipamento, setEquipamento] = useState('');
  const [defeitoRelatado, setDefeitoRelatado] = useState('');
  const [dataEntrada, setDataEntrada] = useState('');
  const [previsaoEntrega, setPrevisaoEntrega] = useState('');
  const [situacao, setSituacao] = useState<SituacaoServico>('Em análise');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [ordemOriginal, setOrdemOriginal] = useState<OrdemServico | null>(null);
  const [carregando, setCarregando] = useState(!!id && ordemId !== null);
  const [salvando, setSalvando] = useState(false);

  // Na edição, a mesma tela carrega os valores já salvos antes de mostrar o formulário.
  useEffect(() => {
    if (!id || ordemId === null) return;

    let ativo = true;
    buscarOrdem(ordemId)
      .then((ordem) => {
        if (!ativo) return;
        if (!ordem) {
          mostrarAviso('Erro', 'Ordem de serviço não encontrada.');
          router.back();
          return;
        }
        setOrdemOriginal(ordem);
        setNomeCliente(ordem.nomeCliente);
        setEquipamento(ordem.equipamento);
        setDefeitoRelatado(ordem.defeitoRelatado);
        setDataEntrada(dataParaTela(ordem.dataEntrada));
        setPrevisaoEntrega(dataParaTela(ordem.previsaoEntrega));
        setFotoUri(ordem.fotoUri);
        setSituacao(ordem.situacao);
      })
      .catch(() => {
        if (ativo) mostrarAviso('Erro', 'Não foi possível carregar a ordem de serviço.');
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [id, ordemId]);

  function selecionarFoto() {
    if (Platform.OS === 'web') {
      void abrirGaleria();
      return;
    }
    Alert.alert('Foto do equipamento', 'Escolha como adicionar a foto.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Galeria', onPress: () => void abrirGaleria() },
      { text: 'Câmera', onPress: () => void tirarFoto() },
    ]);
  }

  async function abrirGaleria() {
    try {
      if (Platform.OS !== 'web') {
        const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissao.granted) {
          mostrarAviso('Permissão negada', 'Permita o acesso às fotos para selecionar uma imagem.');
          return;
        }
      }
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!resultado.canceled) setFotoUri(resultado.assets[0].uri);
    } catch {
      mostrarAviso('Erro', 'Não foi possível selecionar a foto.');
    }
  }

  async function tirarFoto() {
    try {
      const permissao = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissao.granted) {
        mostrarAviso('Permissão negada', 'Permita o acesso à câmera para tirar uma foto.');
        return;
      }
      const resultado = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!resultado.canceled) setFotoUri(resultado.assets[0].uri);
    } catch {
      mostrarAviso('Erro', 'Não foi possível tirar a foto.');
    }
  }

  async function salvar() {
    if (salvando) return;
    const cliente = nomeCliente.trim();
    const equipamentoLimpo = equipamento.trim();
    const defeito = defeitoRelatado.trim();
    if (!cliente || !equipamentoLimpo || !defeito) {
      mostrarAviso('Dados incompletos', 'Preencha cliente, equipamento e defeito relatado.');
      return;
    }
    const entrada = dataParaBanco(dataEntrada);
    const previsao = dataParaBanco(previsaoEntrega);
    if (!entrada || !previsao) {
      mostrarAviso('Data inválida', 'Informe datas reais no formato DD/MM/AAAA.');
      return;
    }
    if (previsao < entrada) {
      mostrarAviso('Data inválida', 'A previsão de entrega não pode ser anterior à entrada.');
      return;
    }

    setSalvando(true);
    let fotoNova: string | null = null;
    try {
      if (fotoUri && fotoUri !== ordemOriginal?.fotoUri) {
        fotoNova = await guardarFoto(fotoUri);
      }
      const dados: DadosOrdem = {
        nomeCliente: cliente,
        equipamento: equipamentoLimpo,
        defeitoRelatado: defeito,
        dataEntrada: entrada,
        previsaoEntrega: previsao,
        fotoUri: fotoNova ?? fotoUri,
        situacao,
      };

      if (ordemId !== null) {
        await editarOrdem(ordemId, dados);
      } else {
        await cadastrarOrdem(dados);
      }
      // Uma foto antiga só é removida depois que a atualização do banco termina.
      if (ordemOriginal?.fotoUri && ordemOriginal.fotoUri !== dados.fotoUri) {
        try {
          apagarFoto(ordemOriginal.fotoUri);
        } catch (erro) {
          console.warn('Não foi possível remover a foto antiga:', erro);
        }
      }
      mostrarAviso(
        'Sucesso',
        ordemId === null ? 'Ordem cadastrada com sucesso.' : 'Ordem atualizada com sucesso.',
        voltar
      );
    } catch (erro) {
      if (fotoNova) {
        try {
          apagarFoto(fotoNova);
        } catch (erroFoto) {
          console.warn('Não foi possível remover a foto após falha no salvamento:', erroFoto);
        }
      }
      console.warn('Falha ao salvar ordem de serviço:', erro);
      mostrarAviso('Erro', 'Não foi possível salvar a ordem de serviço.');
    } finally {
      setSalvando(false);
    }
  }

  function voltar() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  return (
    <ThemedView style={styles.container}>
      {id && ordemId === null ? (
        <ThemedView style={styles.invalid}>
          <ThemedText>Ordem de serviço inválida.</ThemedText>
          <Pressable accessibilityRole="button" onPress={voltar} style={styles.backButton}>
            <ThemedText>Voltar</ThemedText>
          </Pressable>
        </ThemedView>
      ) : carregando ? (
        <ActivityIndicator style={styles.loading} size="large" color={theme.text} />
      ) : (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + Spacing.three,
              paddingBottom: insets.bottom + Spacing.four,
              paddingLeft: insets.left + Spacing.four,
              paddingRight: insets.right + Spacing.four,
            },
          ]}>
          <Pressable accessibilityRole="button" onPress={voltar} style={styles.backButton}>
            <ThemedText>← Voltar</ThemedText>
          </Pressable>
          <ThemedText type="subtitle" accessibilityRole="header">
            {ordemId === null ? 'Cadastrar ordem' : 'Editar ordem'}
          </ThemedText>

          <Campo
            label="Nome do cliente"
            value={nomeCliente}
            onChangeText={setNomeCliente}
            autoCapitalize="words"
          />
          <Campo label="Equipamento" value={equipamento} onChangeText={setEquipamento} />
          <Campo
            label="Defeito relatado"
            value={defeitoRelatado}
            onChangeText={setDefeitoRelatado}
            multiline
          />
          <Campo
            label="Data de entrada (DD/MM/AAAA)"
            placeholder="Ex.: 02/10/2026"
            value={dataEntrada}
            onChangeText={setDataEntrada}
            maxLength={10}
            keyboardType="numbers-and-punctuation"
          />
          <Campo
            label="Previsão de entrega (DD/MM/AAAA)"
            placeholder="Ex.: 05/10/2026"
            value={previsaoEntrega}
            onChangeText={setPrevisaoEntrega}
            maxLength={10}
            keyboardType="numbers-and-punctuation"
          />

          <ThemedView style={styles.field}>
            <ThemedText type="smallBold">Foto do equipamento</ThemedText>
            {fotoUri && <Image source={{ uri: fotoUri }} style={styles.photo} contentFit="contain" />}
            <Pressable
              accessibilityRole="button"
              onPress={selecionarFoto}
              style={[styles.option, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText>{fotoUri ? 'Trocar foto' : 'Adicionar foto'}</ThemedText>
            </Pressable>
            {fotoUri && (
              <Pressable accessibilityRole="button" onPress={() => setFotoUri(null)} style={styles.backButton}>
                <ThemedText>Remover foto</ThemedText>
              </Pressable>
            )}
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText type="smallBold">Situação do serviço</ThemedText>
            {/* Atrasado não é uma escolha: ele é calculado a partir da previsão de entrega. */}
            {situacoes.map((opcao) => (
              <Pressable
                key={opcao}
                accessibilityRole="radio"
                accessibilityState={{ checked: situacao === opcao }}
                accessibilityLabel={opcao}
                onPress={() => setSituacao(opcao)}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: situacao === opcao ? theme.text : theme.backgroundElement,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}>
                <ThemedText>{situacao === opcao ? '●' : '○'} {opcao}</ThemedText>
              </Pressable>
            ))}
          </ThemedView>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: salvando }}
            disabled={salvando}
            onPress={salvar}
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: theme.text, opacity: pressed || salvando ? 0.7 : 1 },
            ]}>
            <ThemedText style={{ color: theme.background }} type="smallBold">
              {salvando ? 'Salvando...' : 'Salvar ordem'}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
      )}
    </ThemedView>
  );
}

// Reúne rótulo e entrada de texto para manter os campos com o mesmo estilo e acessibilidade.
function Campo({ label, style, ...props }: TextInputProps & { label: string }) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={theme.textSecondary}
        selectionColor={theme.text}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.backgroundElement },
          props.multiline && styles.multiline,
          style,
        ]}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1 },
  invalid: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.four,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 48,
    justifyContent: 'center',
    paddingRight: Spacing.three,
  },
  field: { gap: Spacing.two },
  input: {
    minHeight: 48,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  option: {
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  photo: { width: '100%', height: 220, borderRadius: Spacing.two },
  saveButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.two,
  },
});
