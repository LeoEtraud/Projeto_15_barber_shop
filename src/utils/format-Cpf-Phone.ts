// FUNÇÃO PARA FORMATAÇÃO DE CPF
export const formatCpf = (value: string) => {
  value = value.replace(/\D/g, ""); // Remove caracteres não numéricos
  value = value.replace(/(\d{3})(\d)/, "$1.$2"); // Adiciona ponto entre o terceiro e quarto dígitos
  value = value.replace(/(\d{3})(\d)/, "$1.$2"); // Adiciona ponto entre o sexto e sétimo dígitos
  value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2"); // Adiciona hífen entre o nono e décimo dígitos

  return value;
};

// FUNÇÃO PARA FORMATAÇÃO DE NÚMERO DE TELEFONE
export const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{4})/, "$1-$2");
};

// FUNÇÃO PARA FORMATAÇÃO DE DATA
export function formatDate(input: any) {
  // Remove todos os caracteres que não são dígitos
  let value = input.replace(/\D/g, "");

  // Adiciona a primeira barra após o segundo dígito (dia)
  if (value.length > 2) {
    value = value.replace(/(\d{2})(\d)/, "$1/$2");
  }

  // Adiciona a segunda barra após o quarto dígito (mês)
  if (value.length > 5) {
    value = value.replace(/(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
  }

  // Limita o valor a 10 caracteres no máximo (formato DD/MM/AAAA)
  return value.substring(0, 10);
}
