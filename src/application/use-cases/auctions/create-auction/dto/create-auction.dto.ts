export interface CreateAuctionDto {
  title: string;
  description: string;
  categoryId: string;
  sellerId: string;
  basePrice: number;
  minimumIncrement: number;
  closesAt: string;
}