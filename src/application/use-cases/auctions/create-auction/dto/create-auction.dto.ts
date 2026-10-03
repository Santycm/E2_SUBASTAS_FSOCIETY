export interface CreateAuctionDto {
  title: string;
  description: string;
  categoryId: string;
  basePrice: number;
  minimumIncrement: number;
  closesAt: string;
}