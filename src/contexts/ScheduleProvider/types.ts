export interface IBarbers {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  data_nascimento: string;
  especialidade: string;
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
  barbeiro: string;
  status?: string;
  // Campos antigos mantidos para compatibilidade
  data_agendamento?: string;
  hora_inicio?: string;
  hora_fim?: string;
  valor_pago?: number;
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
  services: IServices[];
  fetchServices: () => void;
  schedules: ISchedules[];
  fetchSchedules: () => void;
  appointments: IAppointments[];
  fetchAppointments: (id: string) => void;
}

export interface IScheduleProvider {
  children: JSX.Element;
}
