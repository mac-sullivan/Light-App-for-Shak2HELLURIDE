import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { size, theme } from '../theme';

export function SectionCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderRadius: size.radius,
    borderWidth: 1,
    borderColor: theme.border,
    padding: size.gap,
    marginBottom: size.gap,
  },
  title: {
    color: theme.textDim,
    fontSize: size.fontSm,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
});
