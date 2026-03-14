export interface CreateUserInput {
  email: string;
  name: string;
  senha: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  senha?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}