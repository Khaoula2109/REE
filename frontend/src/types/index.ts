// User types
export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  USER = 'USER',
}

export interface User {
  id: number;
  lastName: string;
  firstName: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: User;
}

// District types
export interface District {
  id: number;
  name: string;
  code: string;
}

// Agent types
export interface Agent {
  id: number;
  lastName: string;
  firstName: string;
  personalPhone: string;
  professionalPhone?: string;
  districtId: number;
  district?: District;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgentPerformance {
  period: {
    start: Date;
    end: Date;
  };
  dailyReadings: Array<{
    date: string;
    count: number;
  }>;
  avgReadingsPerDay: number;
  totalReadings: number;
  daysWorked: number;
}

// Client types
export interface Client {
  id: number;
  clientId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

// Address types
export enum AddressType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  BUILDING = 'BUILDING',
}

export interface Address {
  id: number;
  street: string;
  number: string;
  floor?: string;
  apartmentNumber?: string;
  addressType: AddressType;
  districtId: number;
  clientId: number;
  district?: District;
  client?: Client;
}

// Meter types
export enum MeterType {
  WATER = 'WATER',
  ELECTRICITY = 'ELECTRICITY',
}

export interface Meter {
  id: number;
  meterId: string;
  meterType: MeterType;
  addressId: number;
  currentIndex: number;
  lastReadingDate?: string;
  address?: Address;
  createdAt?: string;
  updatedAt?: string;
}

// Reading types
export interface Reading {
  id: number;
  meterId: number;
  agentId: number;
  previousIndex: number;
  currentIndex: number;
  consumption: number;
  readingDate: string;
  meter?: Meter;
  agent?: Agent;
  createdAt?: string;
  updatedAt?: string;
}

// Dashboard types
export interface CoverageData {
  districtId: number;
  districtName: string;
  districtCode: string;
  totalMeters: number;
  readingsCount: number;
  coverageRate: number;
}

export interface AgentReadingStats {
  agentId: number;
  agentName: string;
  districtId: number;
  districtName: string;
  totalReadings: number;
  daysWorked: number;
  avgReadingsPerDay: number;
}

export interface ConsumptionData {
  meterType: MeterType;
  month: string;
  avgConsumption: number;
  totalConsumption: number;
  readingsCount: number;
  unit: string;
}

export interface OverallStats {
  totalMeters: number;
  monthlyReadings: number;
  totalAgents: number;
  avgConsumption: number;
}

// Pagination
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}
