export interface Tool {
  id?: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  category: "Administração" | "Vendas" | "Atendimento" | "Utilitários";
  tags: string[];
  ownerId: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface ToolCategory {
  name: string;
  icon: string;
}
