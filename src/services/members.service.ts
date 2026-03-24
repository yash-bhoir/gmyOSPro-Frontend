import api from './api';
import type { Member } from '@/types/member.types';

export const membersService = {
  async getAll(gymId: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ items: Member[]; total: number }> {
    const { data } = await api.get(`/gyms/${gymId}/members`, { params });
    return data.data;
  },

  async getById(gymId: string, memberId: string): Promise<Member> {
    const { data } = await api.get(`/gyms/${gymId}/members/${memberId}`);
    return data.data;
  },

  async create(gymId: string, payload: Partial<Member>): Promise<Member> {
    const { data } = await api.post(`/gyms/${gymId}/members`, payload);
    return data.data;
  },

  async update(gymId: string, memberId: string, payload: Partial<Member>): Promise<Member> {
    const { data } = await api.put(`/gyms/${gymId}/members/${memberId}`, payload);
    return data.data;
  },

  async getMyProfile(): Promise<Member> {
    const { data } = await api.get('/me/member-profile');
    return data.data;
  },

  async getMyAttendance(): Promise<any[]> {
    const { data } = await api.get('/me/attendance');
    return data.data;
  },

  async getMyQrToken(): Promise<string> {
    const { data } = await api.get('/me/qr-token');
    return data.data.token;
  },
};
