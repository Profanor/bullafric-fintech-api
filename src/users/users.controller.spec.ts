/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TransactionType } from '../../generated/prisma/client';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockProfile = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    phoneNumber: '08012345678',
    createdAt: new Date(),
    wallet: {
      balance: 1000,
      currency: 'NGN',
    },
  };

  const mockTransactions = [
    {
      id: 1,
      createdAt: new Date(),
      amount: 100,
      type: TransactionType.FUND,
      fromUserId: null,
      toUserId: 1,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            getProfile: jest.fn(),
            getUserTransactions: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should call UsersService.getProfile', async () => {
      jest.spyOn(usersService, 'getProfile').mockResolvedValue(mockProfile);

      const result = await controller.getProfile(1);
      expect(result).toEqual(mockProfile);
      expect(usersService.getProfile).toHaveBeenCalledWith(1);
    });
  });

  describe('getUserTransactions', () => {
    it('should call UsersService.getUserTransactions', async () => {
      jest
        .spyOn(usersService, 'getUserTransactions')
        .mockResolvedValue(mockTransactions);

      const result = await controller.getMyTransactions(1);
      expect(result).toEqual(mockTransactions);
      expect(usersService.getUserTransactions).toHaveBeenCalledWith(1);
    });
  });
});
