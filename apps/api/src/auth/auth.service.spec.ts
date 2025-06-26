import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
    });

    it('should return null when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      const userWithoutPassword = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };
      
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(userWithoutPassword as any);

      expect(result).toEqual({
        access_token: 'jwt-token',
        user: userWithoutPassword,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: userWithoutPassword.email,
        sub: userWithoutPassword.id,
      });
    });
  });

  describe('register', () => {
    it('should create user and return login response', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const name = 'Test User';
      const hashedPassword = 'hashedPassword';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(email, password, name);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email,
        password: hashedPassword,
        name,
      });
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
      });
    });
  });

  describe('validateToken', () => {
    it('should return decoded token when valid', async () => {
      const token = 'valid-token';
      const decoded = { sub: '1', email: 'test@example.com' };

      mockJwtService.verify.mockReturnValue(decoded);

      const result = await service.validateToken(token);

      expect(result).toEqual(decoded);
      expect(mockJwtService.verify).toHaveBeenCalledWith(token);
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      const token = 'invalid-token';

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.validateToken(token)).rejects.toThrow(UnauthorizedException);
    });
  });
});