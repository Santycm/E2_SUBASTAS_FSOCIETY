import { describe, expect, it, jest } from '@jest/globals';
import { GetProfileUseCase } from '../../../src/application/use-cases/users/get-profile/get-profile';
import { UserRepository } from '../../../src/domain/ports/user.repository';
import { AuctionRepository } from '../../../src/domain/ports/auction.repository';
import { BidRepository } from '../../../src/domain/ports/bid.repository';

describe('GetProfileUseCase', () => {
  const user = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed-password',
  };

  function createUseCase() {
    const userRepository = {
      findById: jest.fn(),
    };

    const auctionRepository = {
      findBySellerId: jest.fn(),
      findById: jest.fn(),
    };

    const bidRepository = {
      findByBidderId: jest.fn(),
    };

    const useCase = new GetProfileUseCase(
      userRepository as unknown as UserRepository,
      auctionRepository as unknown as AuctionRepository,
      bidRepository as unknown as BidRepository,
    );

    return {
      useCase,
      userRepository,
      auctionRepository,
      bidRepository,
    };
  }

  it('returns null when the user does not exist', async () => {
    const { useCase, userRepository, auctionRepository, bidRepository } =
      createUseCase();

    userRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute('missing-user');

    expect(result).toBeNull();
    expect(userRepository.findById).toHaveBeenCalledWith('missing-user');
    expect(auctionRepository.findBySellerId).not.toHaveBeenCalled();
    expect(bidRepository.findByBidderId).not.toHaveBeenCalled();
  });

  it('returns the profile when the user has no bids', async () => {
    const { useCase, userRepository, auctionRepository, bidRepository } =
      createUseCase();

    const publishedAuctions = [{ id: 'auction-1' }];

    userRepository.findById.mockResolvedValue(user as never);
    auctionRepository.findBySellerId.mockResolvedValue(
      publishedAuctions as never,
    );
    bidRepository.findByBidderId.mockResolvedValue([]);

    const result = await useCase.execute(user.id);

    expect(result).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      publishedAuctions,
      participatedAuctions: [],
    });
    expect(auctionRepository.findBySellerId).toHaveBeenCalledWith(user.id);
    expect(bidRepository.findByBidderId).toHaveBeenCalledWith(user.id);
    expect(auctionRepository.findById).not.toHaveBeenCalled();
  });

  it('returns unique participated auctions and ignores auctions that no longer exist', async () => {
    const { useCase, userRepository, auctionRepository, bidRepository } =
      createUseCase();

    const publishedAuctions = [{ id: 'auction-published' }];
    const participatedAuction = { id: 'auction-1', title: 'Auction 1' };

    userRepository.findById.mockResolvedValue(user as never);
    auctionRepository.findBySellerId.mockResolvedValue(
      publishedAuctions as never,
    );
    bidRepository.findByBidderId.mockResolvedValue([
      { auctionId: 'auction-1' },
      { auctionId: 'auction-1' },
      { auctionId: 'auction-missing' },
      { auctionId: 'auction-2' },
    ] as never);

    auctionRepository.findById.mockImplementation(async (id) => {
      if (id === 'auction-1') return participatedAuction as never;
      if (id === 'auction-2') return { id: 'auction-2' } as never;
      return null;
    });

    const result = await useCase.execute(user.id);

    expect(auctionRepository.findById).toHaveBeenCalledTimes(3);
    expect(auctionRepository.findById).toHaveBeenNthCalledWith(1, 'auction-1');
    expect(auctionRepository.findById).toHaveBeenNthCalledWith(2, 'auction-missing');
    expect(auctionRepository.findById).toHaveBeenNthCalledWith(3, 'auction-2');

    expect(result).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      publishedAuctions,
      participatedAuctions: [
        participatedAuction,
        { id: 'auction-2' },
      ],
    });
  });
});
