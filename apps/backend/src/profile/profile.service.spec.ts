import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../libs/prisma/prisma.service';

import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;

  const mockPrismaService = {
    userProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockUserId = 'user-123';
  const mockProfile = {
    id: 'profile-123',
    userId: mockUserId,
    name: 'John Doe',
    profilePicUrl: 'https://example.com/avatar.jpg',
    preferredAirlines: ['United', 'Delta'],
    preferredCabinClass: 'business',
    frequentFlyerNumbers: { UA: '12345', DL: '67890' },
    socialAccounts: { twitter: '@johndoe' },
    resumeUrl: 'https://example.com/resume.pdf',
    linkedInUrl: 'https://linkedin.com/in/johndoe',
    githubUrl: 'https://github.com/johndoe',
    portfolioUrl: 'https://johndoe.com',
    timezone: 'America/New_York',
    notifications: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return a profile when it exists', async () => {
      mockPrismaService.userProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getProfile(mockUserId);

      expect(result).toEqual({
        id: mockProfile.id,
        userId: mockProfile.userId,
        name: mockProfile.name,
        profilePicUrl: mockProfile.profilePicUrl,
        preferredAirlines: mockProfile.preferredAirlines,
        preferredCabinClass: mockProfile.preferredCabinClass,
        frequentFlyerNumbers: mockProfile.frequentFlyerNumbers,
        socialAccounts: mockProfile.socialAccounts,
        resumeUrl: mockProfile.resumeUrl,
        linkedInUrl: mockProfile.linkedInUrl,
        githubUrl: mockProfile.githubUrl,
        portfolioUrl: mockProfile.portfolioUrl,
        timezone: mockProfile.timezone,
        notifications: mockProfile.notifications,
        createdAt: mockProfile.createdAt,
        updatedAt: mockProfile.updatedAt,
      });
      expect(mockPrismaService.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      mockPrismaService.userProfile.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(mockUserId)).rejects.toThrow(
        'Profile not found'
      );
      expect(mockPrismaService.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });

    it('should handle null fields correctly', async () => {
      const profileWithNulls = {
        ...mockProfile,
        name: null,
        profilePicUrl: null,
        preferredCabinClass: null,
        resumeUrl: null,
        linkedInUrl: null,
        githubUrl: null,
        portfolioUrl: null,
      };
      mockPrismaService.userProfile.findUnique.mockResolvedValue(profileWithNulls);

      const result = await service.getProfile(mockUserId);

      expect(result?.name).toBeUndefined();
      expect(result?.profilePicUrl).toBeUndefined();
      expect(result?.preferredCabinClass).toBeUndefined();
      expect(result?.resumeUrl).toBeUndefined();
    });
  });

  describe('updateProfile', () => {
    const updateDto = {
      name: 'Jane Smith',
      preferredAirlines: ['Southwest', 'JetBlue'],
      timezone: 'America/Los_Angeles',
    };

    it('should create a new profile if one does not exist', async () => {
      mockPrismaService.userProfile.findUnique.mockResolvedValue(null);
      mockPrismaService.userProfile.create.mockResolvedValue({
        ...mockProfile,
        ...updateDto,
        userId: mockUserId,
      });

      const result = await service.updateProfile(mockUserId, updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(result.preferredAirlines).toEqual(updateDto.preferredAirlines);
      expect(result.timezone).toBe(updateDto.timezone);
      expect(mockPrismaService.userProfile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          ...updateDto,
        }),
      });
    });

    it('should update an existing profile', async () => {
      mockPrismaService.userProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrismaService.userProfile.update.mockResolvedValue({
        ...mockProfile,
        ...updateDto,
      });

      const result = await service.updateProfile(mockUserId, updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(mockPrismaService.userProfile.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: expect.objectContaining(updateDto),
      });
    });

    it('should handle optional fields correctly', async () => {
      const sparseDto = {
        name: 'John',
        timezone: 'UTC',
      };
      mockPrismaService.userProfile.findUnique.mockResolvedValue(null);
      mockPrismaService.userProfile.create.mockResolvedValue({
        ...mockProfile,
        ...sparseDto,
      });

      await service.updateProfile(mockUserId, sparseDto);

      expect(mockPrismaService.userProfile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          name: 'John',
          timezone: 'UTC',
        }),
      });
    });

    it('should handle arrays correctly', async () => {
      const dtoWithArrays = {
        preferredAirlines: ['United', 'Delta', 'American'],
        timezone: 'UTC',
      };
      mockPrismaService.userProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrismaService.userProfile.update.mockResolvedValue({
        ...mockProfile,
        ...dtoWithArrays,
      });

      const result = await service.updateProfile(mockUserId, dtoWithArrays);

      expect(result.preferredAirlines).toEqual(['United', 'Delta', 'American']);
    });

    it('should handle empty arrays correctly', async () => {
      const dtoWithEmptyArray = {
        preferredAirlines: [],
        timezone: 'UTC',
      };
      mockPrismaService.userProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrismaService.userProfile.update.mockResolvedValue({
        ...mockProfile,
        preferredAirlines: [],
      });

      const result = await service.updateProfile(mockUserId, dtoWithEmptyArray);

      expect(result.preferredAirlines).toEqual([]);
    });
  });

  describe('deleteProfile', () => {
    it('should delete a profile', async () => {
      mockPrismaService.userProfile.delete.mockResolvedValue(mockProfile);

      await service.deleteProfile(mockUserId);

      expect(mockPrismaService.userProfile.delete).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });

    it('should handle errors when profile does not exist', async () => {
      mockPrismaService.userProfile.delete.mockRejectedValue(
        new Error('Profile not found')
      );

      await expect(service.deleteProfile(mockUserId)).rejects.toThrow(
        'Profile not found'
      );
    });
  });
});
