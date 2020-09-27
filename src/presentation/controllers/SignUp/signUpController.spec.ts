import { SignUpController } from './signUpController';
import {
  MissingParamError,
  InvalidParamError,
  ServerError,
} from '../../errors';
import {
  CreateUser,
  CreateUserDTO,
  User,
  EmailValidator,
} from './SignUpProtocols';

interface SutTypes {
  sut: SignUpController;
  emailValidatorStub: EmailValidator;
  createUserStub: CreateUser;
}

function createEmailValidatorStub() {
  class EmailValidatorStub implements EmailValidator {
    async isValid(email: string): Promise<boolean> {
      return true;
    }
  }

  return new EmailValidatorStub();
}

function createCreateUserStub(): CreateUser {
  class CreateUserStub implements CreateUser {
    async create(_: CreateUserDTO): Promise<User> {
      const fakeUser: User = {
        id: 'valid_id',
        name: 'valid_name',
        email: 'valid_email@email.com',
        password: 'valid_password',
      };
      return fakeUser;
    }
  }

  return new CreateUserStub();
}

function createSut(): SutTypes {
  const emailValidatorStub = createEmailValidatorStub();
  const createUserStub = createCreateUserStub();
  const sut = new SignUpController(emailValidatorStub, createUserStub);

  return {
    emailValidatorStub,
    sut,
    createUserStub,
  };
}

describe('SignUpController', () => {
  test('should return 400 if no name is provided', async () => {
    const { sut } = createSut();
    const httpRequest = {
      body: {
        email: 'any_email@email.com',
        password: 'any_password',
        passwordConfirmation: 'any_password',
      },
    };

    const httpResponse = await sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(new MissingParamError('name'));
  });

  test('should return 400 if no email is provided', async () => {
    const { sut } = createSut();
    const httpRequest = {
      body: {
        name: 'any_name',
        password: 'any_password',
        passwordConfirmation: 'any_password',
      },
    };

    const httpResponse = await sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(new MissingParamError('email'));
  });

  test('should return 400 if no password is provided', async () => {
    const { sut } = createSut();
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_email@email.com',
        passwordConfirmation: 'any_password',
      },
    };

    const httpResponse = await sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(new MissingParamError('password'));
  });

  test('should return 400 if no password confirmation is provided', async () => {
    const { sut } = createSut();
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_email@email.com',
        password: 'any_password',
      },
    };

    const httpResponse = await sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(
      new MissingParamError('passwordConfirmation')
    );
  });

  test('should return 400 if password confirmation fails', async () => {
    const { sut } = createSut();
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_email@email.com',
        password: 'any_password',
        passwordConfirmation: 'invalid_password',
      },
    };

    const httpResponse = await sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(
      new InvalidParamError('passwordConfirmation')
    );
  });

  test('should return 400 if an invalid email is provided', async () => {
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

    const httpResponse = await sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(new InvalidParamError('email'));
  });

  test('should call email validator if correct email', async () => {
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

    await sut.handle(httpRequest);

    expect(isValidSpy).toHaveBeenCalledWith('any_email@email.com');
  });

  test('should return 500 if EmailValidator throws', async () => {
    const { sut, emailValidatorStub } = createSut();
    jest
      .spyOn(emailValidatorStub, 'isValid')
      .mockImplementationOnce(async () => {
        throw new Error();
      });

    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'invalid_email@email.com',
        password: 'any_password',
        passwordConfirmation: 'any_password',
      },
    };

    const httpResponse = await sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body).toEqual(new ServerError());
  });

  test('should call CreateAccount with correct values', async () => {
    const { sut, createUserStub } = createSut();
    const createUser = jest.spyOn(createUserStub, 'create');

    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_email@email.com',
        password: 'any_password',
        passwordConfirmation: 'any_password',
      },
    };

    await sut.handle(httpRequest);

    expect(createUser).toHaveBeenCalledWith({
      name: httpRequest.body.name,
      email: httpRequest.body.email,
      password: httpRequest.body.password,
    });
  });

  test('should return 500 if CreateUser throws', async () => {
    const { sut, createUserStub } = createSut();
    jest.spyOn(createUserStub, 'create').mockImplementationOnce(async () => {
      throw new Error();
    });

    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'invalid_email@email.com',
        password: 'any_password',
        passwordConfirmation: 'any_password',
      },
    };

    const httpResponse = await sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body).toEqual(new ServerError());
  });

  test('should return 200 if valid data is provided', async () => {
    const { sut } = createSut();

    const httpRequest = {
      body: {
        name: 'valid_name',
        email: 'valid_email@email.com',
        password: 'valid_password',
        passwordConfirmation: 'valid_password',
      },
    };

    const httpResponse = await sut.handle(httpRequest);

    expect(httpResponse.statusCode).toBe(200);
    expect(httpResponse.body).toEqual({
      id: 'valid_id',
      name: 'valid_name',
      email: 'valid_email@email.com',
      password: 'valid_password',
    });
  });
});
