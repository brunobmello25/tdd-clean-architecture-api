import { badRequest, serverError } from '../helpers';
import {
  Controller,
  EmailValidator,
  HttpRequest,
  HttpResponse,
} from '../protocols';
import { InvalidParamError, MissingParamError } from '../errors';
import { CreateUser } from '../../domain/useCases/createAccount';

export class SignUpController implements Controller {
  constructor(
    private emailValidator: EmailValidator,
    private createUser: CreateUser
  ) {}

  handle(httpRequest: HttpRequest): HttpResponse {
    try {
      const requiredFields = [
        'name',
        'email',
        'password',
        'passwordConfirmation',
      ];

      for (const field of requiredFields) {
        if (!httpRequest.body[field]) {
          return badRequest(new MissingParamError(field));
        }
      }

      const { name, email, password, passwordConfirmation } = httpRequest.body;

      if (password !== passwordConfirmation) {
        return badRequest(new InvalidParamError('passwordConfirmation'));
      }

      const isValid = this.emailValidator.isValid(email);

      if (!isValid) return badRequest(new InvalidParamError('email'));

      const user = this.createUser.create({ name, email, password });
    } catch (error) {
      return serverError();
    }
  }
}
