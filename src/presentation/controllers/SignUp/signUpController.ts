import { badRequest, serverError, success } from '../../helpers';
import {
  HttpRequest,
  HttpResponse,
  Controller,
  EmailValidator,
  CreateUser,
} from './SignUpProtocols';
import { InvalidParamError, MissingParamError } from '../../errors';

export class SignUpController implements Controller {
  constructor(
    private emailValidator: EmailValidator,
    private createUser: CreateUser
  ) {}

  async handle(httpRequest: HttpRequest): Promise<HttpResponse> {
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

      const isValid = await this.emailValidator.isValid(email);

      if (!isValid) return badRequest(new InvalidParamError('email'));

      const user = await this.createUser.create({ name, email, password });

      return success(user);
    } catch (error) {
      return serverError();
    }
  }
}
