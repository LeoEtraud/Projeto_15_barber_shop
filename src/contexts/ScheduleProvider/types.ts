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

export interface IContext {
  barbers: IBarbers[];
  fetchBarbers: () => void;
  services: IServices[];
  fetchServices: () => void;
  schedules: ISchedules[];
  fetchSchedules: () => void;
}

export interface IScheduleProvider {
  children: JSX.Element;
}
