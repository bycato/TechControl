import { Directory, File, Paths } from 'expo-file-system';

const pastaFotos = new Directory(Paths.document, 'fotos-ordens');

/** Copia a foto escolhida para uma pasta permanente do aplicativo. */
export async function guardarFoto(uriTemporaria: string): Promise<string> {
  pastaFotos.create({ idempotent: true, intermediates: true });
  const origem = new File(uriTemporaria);
  const extensao = origem.extension || '.jpg';
  const destino = new File(pastaFotos, `${Date.now()}-${Math.random().toString(36).slice(2)}${extensao}`);
  await origem.copy(destino);
  return destino.uri;
}

/** Apaga somente fotos guardadas pelo TechControl. */
export function apagarFoto(uri: string | null): void {
  const prefixo = `${pastaFotos.uri.replace(/\/$/, '')}/`;
  if (!uri || !uri.startsWith(prefixo)) return;
  const arquivo = new File(uri);
  if (arquivo.exists) arquivo.delete();
}
