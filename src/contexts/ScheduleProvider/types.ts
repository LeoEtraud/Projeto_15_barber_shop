export interface IBarbers {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  data_nascimento: string;
  funcao: string;
  avatar?: string;
  qtd_atendimentos: number;
  nota_avaliacao: number;
  status: string;
}

export interface IProfessionals {
  id: string;
  barbeariaId: string;
  nome: string;
  telefone: string;
  email: string;
  data_nascimento: string;
  funcao: string;
  avatar?: string;
  qtd_atendimentos: number;
  nota_avaliacao: number;
  status: string;
}
export interface IServices {
  id: string;
  nome: string;
  preco: string;
  duracao: number;
  imagem?: string;
}

export interface ISchedules {
  id: string;
  hora_inicio: string; // DateTime ISO 8601 (ex: "2025-10-31T18:00:00.000Z")
  hora_fim: string; // DateTime ISO 8601 (ex: "2025-10-31T19:00:00.000Z")
}

export interface IAppointments {
  id?: string;
  data: string; // Formato DD/MM/YYYY
  horario: string; // Formato "HH:MM - HH:MM"
  valor: number;
  barbeiro?: string;
  cliente?: {
    nome: string;
  };
  status?: string;
  servicos?: string[]; // Array de nomes dos serviços
  // Campos antigos mantidos para compatibilidade
  data_agendamento?: string;
  hora_inicio?: string;
  hora_fim?: string;
  valor_pago?: number | string;
  servico?: {
    id: string;
    nome: string;
    preco: number;
    duracao: number;
  };
  profissional?: {
    id: string;
    nome: string;
  };
}

export interface IContext {
  barbers: IBarbers[];
  fetchBarbers: () => void;
  professionals: IProfessionals[];
  fetchProfessionals: () => void;
  services: IServices[];
  fetchServices: () => void;
  schedules: ISchedules[];
  fetchSchedules: (barbeiroId: string) => void;
  appointments: IAppointments[];
  fetchAppointments: (id: string) => Promise<void>;
  professionalAppointments: IAppointments[];
  fetchAppointmentsByProfessional: (profissionalId: string) => Promise<void>;
}

export interface IHorarioFuncionamento {
  id: string;
  id_barbearia: string;
  dia_da_semana: string;
  dia?: number;
  mes?: number;
  ano?: number;
  horario_abertura: string;
  horario_fechamento: string;
  tem_almoco: boolean;
  horario_almoco_inicio?: string;
  horario_almoco_fim?: string;
  is_feriado: boolean;
  profissionais?: IProfessionals[];
  profissionais_ids?: string[];
  tipo_regra?: "PADRAO" | "EXCECAO";
  data_excecao?: string | null;
  data_criacao?: string;
  data_atualizacao?: string;
}

export interface IScheduleProvider {
  children: JSX.Element;
}
