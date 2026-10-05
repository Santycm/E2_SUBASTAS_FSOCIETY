import { Auction } from "../entities/auction";

export interface CreateAuctionData {
  title: string;
  description: string;
  categoryId: string;
  sellerId: string;
  basePrice: number;
  minimumIncrement: number;
  currentBid: number | null;
  status: Auction["status"];
  closesAt: Date;
  createdAt: Date;
}

export interface FindAuctionsFilters {
  categoryId?: string;
  status?: Auction["status"];
  page: number;
  limit: number;
}

export interface FindAuctionsResult {
  data: Auction[];
  total: number;
}

export interface AuctionRepository {
  findAll(filters: FindAuctionsFilters): Promise<FindAuctionsResult>;

  findById(id: string): Promise<Auction | null>;

  findBySellerId(sellerId: string): Promise<Auction[]>;

  save(data: CreateAuctionData): Promise<Auction>;

  updateStatus(id: string, status: Auction["status"]): Promise<Auction>;
}
