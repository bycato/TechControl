import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import type { StatusServico } from '@/types';

const cores = {
  light: {
    'Em análise': { fundo: '#DBEAFE', texto: '#1E40AF' },
    'Em manutenção': { fundo: '#FEF3C7', texto: '#92400E' },
    Pronto: { fundo: '#DCFCE7', texto: '#166534' },
    Atrasado: { fundo: '#FEE2E2', texto: '#991B1B' },
  },
  dark: {
    'Em análise': { fundo: '#1E3A8A', texto: '#DBEAFE' },
    'Em manutenção': { fundo: '#78350F', texto: '#FEF3C7' },
    Pronto: { fundo: '#14532D', texto: '#DCFCE7' },
    Atrasado: { fundo: '#7F1D1D', texto: '#FEE2E2' },
  },
} as const;

/** Mostra o status calculado como selo colorido na lista e nos detalhes. */
export function StatusBadge({ status }: { status: StatusServico }) {
  const tema = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cor = cores[tema][status];

  return (
    <View style={[styles.badge, { backgroundColor: cor.fundo }]}>
      <Text style={[styles.text, { color: cor.texto }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  text: { fontSize: 14, fontWeight: '700' },
});
