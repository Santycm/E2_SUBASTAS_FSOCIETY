import { Order } from '../../../../../domain/entities/order';

export interface GetOrdersDto {
  buyerId: string;
  page: number;
  limit: number;
  status?: Order['status'];
}