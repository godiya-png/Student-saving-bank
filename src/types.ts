/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  isLinked: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currency: 'NGN' | 'USD' | 'GBP' | 'EUR';
  createdAt: string;
  bankDetails?: BankDetails;
}

export type GoalStatus = 'active' | 'paused' | 'completed';

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  status: GoalStatus;
  category: string;
  createdAt: string;
}

export type TransactionType = 'saving' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  note?: string;
  createdAt: string;
}

export interface Budget {
  userId: string;
  allowance: number;
  income: number;
  pocketMoney: number;
  scholarship: number;
  sideHustle: number;
  // Allocation overrides if custom, default is 50/30/20
  needsPercent: number;
  wantsPercent: number;
  savingsPercent: number;
}

export type ChallengeStatus = 'not_started' | 'active' | 'completed';

export interface SavingsChallenge {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  durationDays: number;
  badgeId: string;
  category: string;
}

export interface UserChallenge {
  userId: string;
  challengeId: string;
  startDate: string;
  currentAmount: number;
  status: ChallengeStatus;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  thresholdAmount?: number;
  thresholdDays?: number;
  unlockedAt?: string; // If undefined, not unlocked yet
}

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  date: string;
  read: boolean;
}

export interface DashboardData {
  balance: number;
  monthlyGoal: number;
  todaySavings: number;
  weeklySavings: number;
  totalDeposits: number;
  streak: number;
  recentTransactions: Transaction[];
  goals: SavingsGoal[];
  budget: Budget;
  challenges: {
    available: SavingsChallenge[];
    joined: UserChallenge[];
  };
  badges: Badge[];
  notifications: AppNotification[];
}
