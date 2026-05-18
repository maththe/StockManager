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

export type UserRole = 'ADMIN' | 'DECORADOR' | 'FUNCIONARIO';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}
