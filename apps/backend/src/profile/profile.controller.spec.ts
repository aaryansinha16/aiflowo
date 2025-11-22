import { Test, TestingModule } from '@nestjs/testing';

import { UpdateProfileDto } from './dto/profile.dto';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

describe('ProfileController', () => {
  let controller: ProfileController;
  let service: ProfileService;

  const mockUserId = 'user-123';
  const mockUser = { id: mockUserId, email: 'test@example.com' };
  
  const mockProfileResponse = {
    id: 'profile-123',
    userId: mockUserId,
    name: 'John Doe',
    profilePicUrl: 'https://example.com/avatar.jpg',
    preferredAirlines: ['United', 'Delta'],
    preferredCabinClass: 'business',
    frequentFlyerNumbers: { UA: '12345' },
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

  const mockProfileService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    deleteProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
    service = module.get<ProfileService>(ProfileService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockProfileService.getProfile.mockResolvedValue(mockProfileResponse);

      const result = await controller.getProfile(mockUser);

      expect(result).toEqual(mockProfileResponse);
      expect(service.getProfile).toHaveBeenCalledWith(mockUserId);
    });

    it('should throw exception when profile does not exist', async () => {
      mockProfileService.getProfile.mockRejectedValue(
        new Error('Profile not found')
      );

      await expect(controller.getProfile(mockUser)).rejects.toThrow(
        'Profile not found'
      );
      expect(service.getProfile).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('updateProfile', () => {
    const updateDto: UpdateProfileDto = {
      name: 'Jane Smith',
      preferredAirlines: ['Southwest'],
      timezone: 'America/Los_Angeles',
      notifications: false,
    };

    it('should update and return profile', async () => {
      const updatedProfile = { ...mockProfileResponse, ...updateDto };
      mockProfileService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(mockUser, updateDto);

      expect(result).toEqual(updatedProfile);
      expect(service.updateProfile).toHaveBeenCalledWith(mockUserId, updateDto);
    });

    it('should handle empty update', async () => {
      const emptyDto: UpdateProfileDto = {
        timezone: 'UTC',
        notifications: true,
      };
      mockProfileService.updateProfile.mockResolvedValue(mockProfileResponse);

      const result = await controller.updateProfile(mockUser, emptyDto);

      expect(result).toEqual(mockProfileResponse);
      expect(service.updateProfile).toHaveBeenCalledWith(mockUserId, emptyDto);
    });

    it('should handle partial updates', async () => {
      const partialDto: UpdateProfileDto = {
        name: 'New Name',
        timezone: 'UTC',
        notifications: true,
      };
      const partiallyUpdated = { ...mockProfileResponse, name: 'New Name' };
      mockProfileService.updateProfile.mockResolvedValue(partiallyUpdated);

      const result = await controller.updateProfile(mockUser, partialDto);

      expect(result.name).toBe('New Name');
      expect(service.updateProfile).toHaveBeenCalledWith(mockUserId, partialDto);
    });
  });

  describe('deleteProfile', () => {
    it('should delete profile and return success message', async () => {
      mockProfileService.deleteProfile.mockResolvedValue(undefined);

      const result = await controller.deleteProfile(mockUser);

      expect(result).toEqual({
        success: true,
        message: 'Profile deleted successfully',
      });
      expect(service.deleteProfile).toHaveBeenCalledWith(mockUserId);
    });

    it('should handle deletion errors', async () => {
      mockProfileService.deleteProfile.mockRejectedValue(
        new Error('Profile not found')
      );

      await expect(controller.deleteProfile(mockUser)).rejects.toThrow(
        'Profile not found'
      );
      expect(service.deleteProfile).toHaveBeenCalledWith(mockUserId);
    });
  });
});
