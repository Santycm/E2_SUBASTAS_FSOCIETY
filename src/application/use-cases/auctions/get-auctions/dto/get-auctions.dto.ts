import { AuctionStatus } from '../../../../../domain/entities/auction';

export interface GetAuctionsDto {
  categoryId?: string;
  status?: AuctionStatus;
  page?: number;
  limit?: number;
}