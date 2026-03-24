export type MemberStatus = 'active' | 'expired' | 'frozen' | 'cancelled';

export interface Member {
  id: string;
  gymId: string;
  userId: string;
  memberCode: string;
  status: MemberStatus;
  fullName: string;
  phone: string;
  email?: string;
  photoUrl?: string;
  planId?: string;
  planName?: string;
  planStartDate?: string;
  planEndDate?: string;
  healthNotes?: string;
  fitnessGoals?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  churnRiskScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPlan {
  id: string;
  gymId: string;
  name: string;
  durationDays: number;
  price: number;
  gstRate: number;
  maxFreezeDays: number;
  includesClasses: boolean;
  classCredits?: number;
  isActive: boolean;
}
