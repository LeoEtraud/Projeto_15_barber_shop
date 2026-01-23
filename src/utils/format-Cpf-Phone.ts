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

// FUNÇÃO PARA CONVERTER DATA DE DD/MM/AAAA PARA YYYY-MM-DD (formato do input date)
export function convertDateToInputFormat(dateStr: string): string {
  if (!dateStr) return "";

  // Se já está no formato YYYY-MM-DD, retorna como está
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }

  // Tenta fazer parse do formato DD/MM/AAAA
  if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [day, month, year] = dateStr.split("/");
    return `${year}-${month}-${day}`;
  }

  // Remove caracteres não numéricos
  const digits = dateStr.replace(/\D/g, "");

  // Se não tem 8 dígitos, retorna string vazia
  if (digits.length !== 8) return "";

  const day = digits.substring(0, 2);
  const month = digits.substring(2, 4);
  const year = digits.substring(4, 8);

  return `${year}-${month}-${day}`;
}

// FUNÇÃO PARA CONVERTER DATA DE YYYY-MM-DD PARA DD/MM/AAAA (formato da API)
export function convertDateToAPIFormat(dateStr: string): string {
  if (!dateStr) return "";

  // Se já está no formato DD/MM/AAAA, retorna como está
  if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return dateStr;
  }

  // Remove caracteres não numéricos
  const parts = dateStr.split("-");

  if (parts.length !== 3) return dateStr;

  const [year, month, day] = parts;

  return `${day}/${month}/${year}`;
}

// FUNÇÃO PARA NORMALIZAR NOMES (Title Case)
// Converte strings em caixa alta para apenas iniciais maiúsculas
export function normalizeName(name: string): string {
  if (!name || typeof name !== "string") return name;

  // Remove espaços extras e divide em palavras
  const words = name.trim().split(/\s+/);

  // Processa cada palavra
  const normalizedWords = words.map((word) => {
    // Se a palavra está toda em maiúscula, converte para Title Case
    if (word === word.toUpperCase() && word.length > 1) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    // Se já está em formato misto, mantém como está
    return word;
  });

  return normalizedWords.join(" ");
}
