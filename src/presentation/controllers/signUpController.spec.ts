import SignUpController from './signUpController';
import { MissingParamError, InvalidParamError, ServerError } from '../errors';
import { EmailValidator } from '../protocols/emailValidator';

interface SutTypes {
  sut: SignUpController;
  emailValidatorStub: EmailValidator;
}

function createSut(): SutTypes {
  class EmailValidatorStub implements EmailValidator {
    isValid(email: string): boolean {
      return true;
    }
  }

  const emailValidatorStub = new EmailValidatorStub();
  const sut = new SignUpController(emailValidatorStub);

  return {
    emailValidatorStub,
    sut,
  };
}

describe('SignUpController', () => {
  test('should return 400 if no name is provided', () => {
    const { sut } = createSut();
    const httpRequest = {
      body: {
        email: 'any_email@email.com',
        password: 'any_password',
        passwordConfirmation: 'any_password',
      },
    };

    const httpResponse = sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(new MissingParamError('name'));
  });

  test('should return 400 if no email is provided', () => {
    const { sut } = createSut();
    const httpRequest = {
      body: {
        name: 'any_name',
        password: 'any_password',
        passwordConfirmation: 'any_password',
      },
    };

    const httpResponse = sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(new MissingParamError('email'));
  });

  test('should return 400 if no password is provided', () => {
    const { sut } = createSut();
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_email@email.com',
        passwordConfirmation: 'any_password',
      },
    };

    const httpResponse = sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(new MissingParamError('password'));
  });

  test('should return 400 if no password confirmation is provided', () => {
    const { sut } = createSut();
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_email@email.com',
        password: 'any_password',
      },
    };

    const httpResponse = sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(
      new MissingParamError('passwordConfirmation')
    );
  });

  test('should return 400 if an invalid email is provided', () => {
    const { sut, emailValidatorStub } = createSut();
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'invalid_email@email.com',
        password: 'any_password',
        passwordConfirmation: 'any_password',
      },
    };
    jest.spyOn(emailValidatorStub, 'isValid').mockReturnValueOnce(false);

    const httpResponse = sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(new InvalidParamError('email'));
  });

  test('should call email validator if correct email', () => {
    const { sut, emailValidatorStub } = createSut();
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_email@email.com',
        password: 'any_password',
        passwordConfirmation: 'any_password',
      },
    };
    const isValidSpy = jest.spyOn(emailValidatorStub, 'isValid');

    sut.handle(httpRequest);

    expect(isValidSpy).toHaveBeenCalledWith('any_email@email.com');
  });

  test('should return 500 if EmailValidator throws', () => {
    class EmailValidatorStub implements EmailValidator {
      isValid(_: string): boolean {
        throw new Error();
      }
    }

    const emailValidatorStub = new EmailValidatorStub();
    const sut = new SignUpController(emailValidatorStub);

    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'invalid_email@email.com',
        password: 'any_password',
        passwordConfirmation: 'any_password',
      },
    };

    const httpResponse = sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body).toEqual(new ServerError());
  });
});
