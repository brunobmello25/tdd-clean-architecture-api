import { HttpRequest, HttpResponse } from '../protocols/http';
import { MissingParamError } from '../errors/missingParamError';
import { badRequest } from '../helpers/httpHelper';
import { Controller } from '../protocols/controller';
import { EmailValidator } from '../protocols/emailValidator';
import { InvalidParamError } from '../errors/invalidParamError';
import { ServerError } from '../errors/serverError';

export default class SignUpController implements Controller {
  constructor(private emailValidator: EmailValidator) {}

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

      const isValid = this.emailValidator.isValid(httpRequest.body.email);

      if (!isValid) return badRequest(new InvalidParamError('email'));
    } catch (error) {
      return { statusCode: 500, body: new ServerError() };
    }
  }
}
