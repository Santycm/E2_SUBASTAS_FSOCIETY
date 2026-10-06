import { Order } from '../../../../../domain/entities/order';

export interface GetSellerOrdersDto {
  sellerId: string;
  page: number;
  limit: number;
  status?: Order['status'];
}
