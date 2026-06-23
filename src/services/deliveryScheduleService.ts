import { apiFetch } from "./api";

export type ApiDeliverySchedule = {
  _id: string;
  deliveryScheduleId: string;
  salesOrderId?: string;
  orderId?: string;
  invoiceId?: string;
  storeCode: string;
  customerPhone?: string;
  customerName?: string;
  deliveryOption: string;
  deliveryDate?: string;
  deliverySiteCode?: string;
  billingAddress?: any;
  shippingAddress?: any;
  status: "PENDING" | "SCHEDULED" | "DISPATCHED" | "DELIVERED";
};

export type CreateDeliverySchedulePayload = {
  orderId: string;
  invoiceId?: string;
  storeCode: string;
  storeName?: string;
  customerPhone?: string;
  customerName?: string;
  deliveryOption?: string;
  deliveryDate?: string;
  deliverySiteCode?: string;
  billingAddress?: string;
  shippingAddress?: string;
};

export const createDeliveryScheduleApi = (payload: CreateDeliverySchedulePayload) =>
  apiFetch<ApiDeliverySchedule>("/delivery-schedules", {
    method: "POST",
    body: JSON.stringify(payload),
  });
