import { Request } from 'express';

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
  password: string;
  role: UserRole;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: UserRole;
  };
}

export interface District {
  id: number;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: number;
  street: string;
  buildingNumber: string;
  districtId: number;
  clientId: number;
  isBuilding: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: number;
  lastName: string;
  firstName: string;
  personalPhone: string;
  professionalPhone?: string;
  districtId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Meter {
  id: string;
  addressId: number;
  type: MeterType;
  currentIndex: number;
  lastReadingDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reading {
  id: number;
  meterId: string;
  agentId: number;
  previousIndex: number;
  newIndex: number;
  consumption: number;
  readingDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  id: number;
  email: string;
  role: UserRole;
}
