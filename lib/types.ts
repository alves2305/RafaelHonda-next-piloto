export type ClientProfile = {
  id: string;
  nome: string;
  slug: string;
  fotoUrl: string;
  fotoDesktopUrl: string | null;
  logoUrl: string | null;
  whatsapp: string;
  instagramUrl: string | null;
  slogan: string;
  corPrimaria: string;
  corSecundaria: string;
  marcaDaguaUrl: string | null;
  ativo: boolean;
};

export type MotorcycleDetail = {
  rotulo: string;
  valor: string;
};

export type MotorcycleBenefit = {
  titulo: string;
  descricao: string;
  icone: "economia" | "praticidade" | "conforto" | "desempenho";
};

export type ConsortiumPlan = {
  id: string;
  parcelas: number;
  valorParcela: number;
  destaque: boolean;
  ordem: number;
};

export type FinancingInfo = {
  id: string;
  titulo: string;
  descricao: string;
  observacao: string;
};

export type Motorcycle = {
  id: string;
  slug: string;
  nome: string;
  categoria: string;
  imagemUrl: string;
  selo: string | null;
  tituloDescricao: string;
  descricao: string;
  detalhes: MotorcycleDetail[];
  beneficios: MotorcycleBenefit[];
  tituloConsorcio: string;
  ativo: boolean;
  ordem: number;
  planosConsorcio: ConsortiumPlan[];
  financiamento: FinancingInfo | null;
};

export type ClientCatalog = {
  client: ClientProfile;
  motorcycles: Motorcycle[];
};
