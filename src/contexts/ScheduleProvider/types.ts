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

export interface IContext {
  barbers: IBarbers[];
  fetchBarbers: () => void;
}

export interface IScheduleProvider {
  children: JSX.Element;
}
