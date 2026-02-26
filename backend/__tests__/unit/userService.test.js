const { ConflictError } = require('../../utils/errors');

jest.mock('../../models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn()
  }
}));

const { User } = require('../../models');
const UserService = require('../../services/UserService');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createUser throws ConflictError when email exists', async () => {
    User.findOne.mockResolvedValue({ id: 1 });

    await expect(UserService.createUser({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    })).rejects.toBeInstanceOf(ConflictError);
  });

  test('createUser returns sanitized user', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      toJSON: () => ({
        id: 10,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed',
        role: 'student'
      })
    });

    const user = await UserService.createUser({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    expect(user).toMatchObject({
      id: 10,
      name: 'Test User',
      email: 'test@example.com',
      role: 'student'
    });
    expect(user.password).toBeUndefined();
  });
});
