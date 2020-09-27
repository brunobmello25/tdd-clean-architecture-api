import { User } from '../models';

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
}

export interface CreateUser {
  create(account: CreateUserDTO): Promise<User>;
}
