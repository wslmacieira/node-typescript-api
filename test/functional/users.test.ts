import { User } from '@src/models/users';
import AuthService from '@src/services/auth';

describe('Users functional tests', () => {
  beforeAll(async () => await User.deleteMany({}));
  describe('When creating a new user', () => {
    it('should successfully create a new user with encrypted password', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'john@email.com',
        password: '1234',
      };
      const response = await global.testRequest.post('/users').send(newUser);
      expect(response.status).toBe(201);
      await expect(
        AuthService.comparePassword(newUser.password, response.body.password)
      ).resolves.toBeTruthy();
      expect(response.body).toEqual(
        expect.objectContaining({
          ...newUser,
          ...{ password: expect.any(String) },
        })
      );
    });

    it('should return a validation error when as field is missing', async () => {
      const newUser = {
        email: 'john2@email.com',
        password: '1234',
      };
      const response = await global.testRequest.post('/users').send(newUser);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 400,
        error: 'Bad Request',
        message: 'User validation failed: name: Path `name` is required.',
      });
    });

    it('should return 409 when the email already exists', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'john@email.com',
        password: '1234',
      };
      const response = await global.testRequest.post('/users').send(newUser);
      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        code: 409,
        error: 'Conflict',
        message:
          'User validation failed: email: already exists in the database.',
      });
    });
  });

  describe('When authenticating a user', () => {
    it('should generate a token for a valid user', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'john2@email.com',
        password: '1234',
      };
      await new User(newUser).save();
      const response = await global.testRequest
        .post('/users/authenticate')
        .send({ email: newUser.email, password: newUser.password });
      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({ token: expect.any(String) })
      );
    });

    it('should return UNAUTHORIZED  if the user with the given email is not found', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'john3@email.com',
        password: '1234',
      };
      await new User(newUser).save();
      const response = await global.testRequest
        .post('/users/authenticate')
        .send({ email: newUser.email, password: 'different password' });
      expect(response.status).toBe(401);
    });

    it('should return UNAUTHORIZED  if the user is found but the password does not match', async () => {
      const response = await global.testRequest
        .post('/users/authenticate')
        .send({ email: 'some-email@mail.com', password: '1234' });
      expect(response.status).toBe(401);
    });
  });
});

describe('When getting user profile info', () => {
  it(`Should return the token's owner profile information`, async () => {
    const newUser = {
      name: 'John Doe',
      email: 'john@mail.com',
      password: '1234',
    };
    const user = await new User(newUser).save();
    const token = AuthService.generateToken(user.toJSON());
    const { body, status } = await global.testRequest
      .get('/users/me')
      .set({ 'x-access-token': token });

    expect(status).toBe(200);
    expect(body).toMatchObject(JSON.parse(JSON.stringify({ user })));
  });
});
