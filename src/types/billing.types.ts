export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
export type PaymentMode = 'cash' | 'upi' | 'card' | 'bank' | 'razorpay';

export interface Invoice {
  id: string;
  gymId: string;
  memberId: string;
  memberName?: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  subtotal: number;
  gstAmount: number;
  discountAmount: number;
  totalAmount: number;
  dueDate: string;
  paidAt?: string;
  paymentMode?: PaymentMode;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
