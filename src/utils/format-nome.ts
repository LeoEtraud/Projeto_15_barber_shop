/**
 * Função para obter apenas o primeiro nome e último sobrenome
 * @param nomeCompleto - Nome completo do profissional
 * @returns String com primeiro nome e último sobrenome
 */
export function getNomeSobrenome(nomeCompleto: string): string {
  if (!nomeCompleto) return "";
  
  const nomes = nomeCompleto
    .trim()
    .split(" ")
    .filter((n) => n.length > 0);

  if (nomes.length === 0) return "";

  if (nomes.length === 1) {
    return nomes[0];
  }

  // Retorna o primeiro nome e o último sobrenome
  return `${nomes[0]} ${nomes[nomes.length - 1]}`;
}

