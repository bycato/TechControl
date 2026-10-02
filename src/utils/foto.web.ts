/** No navegador, guarda a imagem como data URL no mesmo registro SQLite da ordem. */
export async function guardarFoto(uriTemporaria: string): Promise<string> {
  const resposta = await fetch(uriTemporaria);
  const imagem = await resposta.blob();

  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(new Error('Não foi possível ler a foto.'));
    leitor.readAsDataURL(imagem);
  });
}

// A imagem web fica no registro SQLite, sem arquivo separado para apagar.
export function apagarFoto(_uri: string | null): void {}
