export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  USER = 'USER'
}

export enum MeterType {
  WATER = 'WATER',
  ELECTRICITY = 'ELECTRICITY'
}

export interface User {
  id: number;
  lastName: string;
  firstName: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  refreshToken: string;
  user: User;
}

export interface District {
  id: number;
  name: string;
  code: string;
}

export interface Agent {
  id: number;
  lastName: string;
  firstName: string;
  personalPhone: string;
  professionalPhone?: string;
  districtId: number;
  districtName: string;
  districtCode: string;
}

export interface AgentPerformance {
  agentId: number;
  averagePerDay: number;
  totalReadings: number;
  daysWorked: number;
  period: number;
  dailyPerformance: Array<{
    date: string;
    readings: number;
  }>;
}

export interface Meter {
  id: string;
  type: MeterType;
  currentIndex: number;
  lastReadingDate?: string;
  addressId?: number;
  street?: string;
  buildingNumber?: string;
  districtName?: string;
  fullAddress?: string;
  clientFirstName?: string;
  clientLastName?: string;
}

export interface Reading {
  id: number;
  readingDate: string;
  consumption: number;
  newIndex: number;
  previousIndex: number;
  agentId: number;
  agentName?: string;
  agentFirstName?: string;
  agentLastName?: string;
  meterId: string;
  meterType: MeterType;
  street?: string;
  buildingNumber?: string;
  districtName?: string;
  districtId?: number;
  fullAddress?: string;
  clientFirstName?: string;
  clientLastName?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
}

export interface Address {
  id: number;
  street: string;
  buildingNumber: string;
  isBuilding: boolean;
  districtName: string;
  districtId: number;
  clientFirstName: string;
  clientLastName: string;
  fullAddress: string;
  meterCount: number;
  maxMeters: number;
}

export interface CoverageRate {
  overall: {
    totalMeters: number;
    metersRead: number;
    coverageRate: number;
  };
  breakdown: Array<{
    districtId: number;
    districtName: string;
    districtCode: string;
    totalMeters: number;
    metersRead: number;
    coverageRate: number;
  }>;
}

export interface ConsumptionEvolution {
  monthlyData: Array<{
    year: number;
    month: number;
    averageConsumption: number;
    totalConsumption: number;
    readingsCount: number;
  }>;
  months: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiError {
  error: string;
  details?: any;
}
