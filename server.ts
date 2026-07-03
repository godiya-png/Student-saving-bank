/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'EDUSAVE_SUPER_SECRET_KEY_FOR_STUDENTS_2026';

app.use(express.json());

// Initialize Gemini SDK with custom user agent telemetry
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log("Gemini API successfully initialized on server side.");
  } else {
    console.warn("GEMINI_API_KEY is not defined. AI insights will fallback to rule-based advice.");
  }
} catch (error) {
  console.error("Failed to initialize Gemini SDK:", error);
}

// Local File Database setup
const DB_FILE = path.join(process.cwd(), 'db.json');

// Prebuilt static saving challenges
const STATIC_CHALLENGES = [
  {
    id: 'ch_daily_100',
    name: 'Save ₦100 Every Day',
    description: 'Build consistency by saving ₦100 (or equivalent) daily for a full week.',
    targetAmount: 700,
    durationDays: 7,
    badgeId: 'badge_30_day',
    category: 'Daily'
  },
  {
    id: 'ch_no_fast_food',
    name: 'No Fast Food Challenge',
    description: 'Commit to home-cooked meals or hostel food for 5 days. Save ₦2,000 per day skipped!',
    targetAmount: 10000,
    durationDays: 5,
    badgeId: 'badge_savings_master',
    category: 'Wants'
  },
  {
    id: 'ch_fifty_notes',
    name: 'Save All ₦50 Notes',
    description: 'Collect and deposit every ₦50 bill you get in pocket money over 10 days.',
    targetAmount: 1500,
    durationDays: 10,
    badgeId: 'badge_saved_5k',
    category: 'Cash'
  },
  {
    id: 'ch_weekend_lock',
    name: 'Weekend Savings Challenge',
    description: 'Freeze non-essential spending on Saturday and Sunday. Save ₦3,000.',
    targetAmount: 3000,
    durationDays: 2,
    badgeId: 'badge_saved_20k',
    category: 'Weekend'
  },
  {
    id: 'ch_no_impulse',
    name: 'One Week No Impulse Buying',
    description: 'Do not buy any unbudgeted item for 7 days. Move your impulsive funds into books!',
    targetAmount: 5000,
    durationDays: 7,
    badgeId: 'badge_goal_completed',
    category: 'Impulse'
  }
];

// Prebuilt static badges
const STATIC_BADGES = [
  { id: 'badge_first_save', name: 'First Save', description: 'Deposited your first savings into EduSave!', icon: '🥉', thresholdAmount: 1 },
  { id: 'badge_saved_5k', name: 'Savings Star', description: 'Accumulated ₦5,000 in savings.', icon: '🥈', thresholdAmount: 5000 },
  { id: 'badge_saved_20k', name: 'Super Saver', description: 'Accumulated ₦20,000 in savings.', icon: '🥇', thresholdAmount: 20000 },
  { id: 'badge_savings_master', name: 'Savings Master', description: 'Accumulated ₦100,000 in savings.', icon: '💎', thresholdAmount: 100000 },
  { id: 'badge_30_day', name: '30-Day Streak', description: 'Maintained a saving habit for 30 consecutive days.', icon: '🔥', thresholdDays: 30 },
  { id: 'badge_goal_completed', name: 'Goal Achieved', description: 'Successfully hit the target for a savings goal!', icon: '🏆' }
];

function getInitialDemoData() {
  const demoUserId = 'user_demo_student';
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync('password123', salt);

  const demoUser = {
    id: demoUserId,
    name: 'Tunde Alabi',
    email: 'student@edusave.ng',
    password: hashedPassword,
    currency: 'NGN' as const,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() // Joined 45 days ago
  };

  const demoGoals = [
    {
      id: 'goal_tuition',
      userId: demoUserId,
      name: 'Tuition Fees (Semester 2)',
      targetAmount: 150000,
      currentAmount: 120000,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active' as const,
      category: 'Tuition Fees',
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'goal_textbooks',
      userId: demoUserId,
      name: 'Engineering Textbooks',
      targetAmount: 25000,
      currentAmount: 25000,
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'completed' as const,
      category: 'Textbooks',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'goal_laptop',
      userId: demoUserId,
      name: 'Coding Laptop (MacBook Refurb)',
      targetAmount: 320000,
      currentAmount: 65000,
      deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active' as const,
      category: 'Laptop',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'goal_emergency',
      userId: demoUserId,
      name: 'Hostel Rent Buffer',
      targetAmount: 80000,
      currentAmount: 15000,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'paused' as const,
      category: 'Hostel Rent',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Past transactions (daily savings & spending)
  const demoTransactions = [
    {
      id: 't_1',
      userId: demoUserId,
      amount: 15000,
      type: 'saving' as const,
      category: 'Income',
      date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      note: 'Initial seed deposit from monthly pocket allowance',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 't_2',
      userId: demoUserId,
      amount: 4500,
      type: 'expense' as const,
      category: 'Food',
      date: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      note: 'Groceries at main market',
      createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 't_3',
      userId: demoUserId,
      amount: 1200,
      type: 'saving' as const,
      category: 'Miscellaneous',
      date: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      note: 'Skipped off-campus pizza, cooked noodles instead!',
      createdAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 't_4',
      userId: demoUserId,
      amount: 25000,
      type: 'saving' as const,
      category: 'Scholarship',
      date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      note: 'Federal scholarship monthly disbursement',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 't_5',
      userId: demoUserId,
      amount: 3500,
      type: 'expense' as const,
      category: 'Data',
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      note: 'MTN 20GB monthly subscription for online research',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 't_6',
      userId: demoUserId,
      amount: 50000,
      type: 'saving' as const,
      category: 'Side Hustle',
      date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      note: 'Earnings from freelance UI design gig',
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 't_7',
      userId: demoUserId,
      amount: 1500,
      type: 'expense' as const,
      category: 'Transport',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      note: 'Campus shuttle and bike rides',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 't_8',
      userId: demoUserId,
      amount: 5000,
      type: 'expense' as const,
      category: 'School Materials',
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      note: 'Scientific calculator and drafting papers',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 't_9',
      userId: demoUserId,
      amount: 25000,
      type: 'expense' as const,
      category: 'Miscellaneous',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      note: 'Engineering textbooks goal fulfillment purchase',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 't_10',
      userId: demoUserId,
      amount: 1000,
      type: 'saving' as const,
      category: 'Food',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      note: 'Walked to school instead of taxi, packed lunch',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 't_11',
      userId: demoUserId,
      amount: 2000,
      type: 'saving' as const,
      category: 'Entertainment',
      date: new Date(Date.now()).toISOString().split('T')[0],
      note: 'Stayed in for movie night instead of expensive bar lounge',
      createdAt: new Date(Date.now()).toISOString()
    }
  ];

  const demoBudget = {
    userId: demoUserId,
    allowance: 30000,
    income: 0,
    pocketMoney: 20000,
    scholarship: 25000,
    sideHustle: 50000,
    needsPercent: 50,
    wantsPercent: 30,
    savingsPercent: 20
  };

  const demoUserChallenges = [
    {
      userId: demoUserId,
      challengeId: 'ch_no_fast_food',
      startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currentAmount: 8000,
      status: 'active' as const
    },
    {
      userId: demoUserId,
      challengeId: 'ch_daily_100',
      startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currentAmount: 700,
      status: 'completed' as const
    }
  ];

  const demoNotifications = [
    {
      id: 'notif_1',
      userId: demoUserId,
      message: "Welcome to EduSave! You've activated your companion workspace.",
      type: 'info' as const,
      date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      read: true
    },
    {
      id: 'notif_2',
      userId: demoUserId,
      message: "Congratulations! You saved for 7 consecutive days on 'Save ₦100 Every Day'!",
      type: 'success' as const,
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      read: false
    },
    {
      id: 'notif_3',
      userId: demoUserId,
      message: "Goal alert: You have fully completed theEngineering Textbooks goal. Splendid work!",
      type: 'success' as const,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      read: false
    }
  ];

  return {
    users: [demoUser],
    goals: demoGoals,
    transactions: demoTransactions,
    budgets: [demoBudget],
    userChallenges: demoUserChallenges,
    notifications: demoNotifications
  };
}

// Read database
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialDB = getInitialDemoData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2));
    return initialDB;
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file, returning default initial data:", err);
    return getInitialDemoData();
  }
}

// Write database
function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Failed to write to database file:", err);
  }
}

// JWT Authentication Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Access token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired access token.' });
    }
    req.user = user;
    next();
  });
}

// Recalculate streak helper based on savings transactions
function calculateStreak(userId: string, transactions: any[]): number {
  const savingsDates = Array.from(
    new Set(
      transactions
        .filter(t => t.userId === userId && t.type === 'saving')
        .map(t => t.date)
    )
  ).sort().reverse() as string[];

  if (savingsDates.length === 0) return 0;

  let streak = 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // If there's no saving logged today or yesterday, streak is broken
  if (savingsDates[0] !== todayStr && savingsDates[0] !== yesterdayStr) {
    return 0;
  }

  let expectedDate = new Date(savingsDates[0]);
  for (let i = 0; i < savingsDates.length; i++) {
    const dStr = savingsDates[i];
    const d = new Date(dStr);

    // Calculate diff in days
    const diffTime = Math.abs(expectedDate.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      streak++;
      expectedDate = d; // move pointer back
    } else {
      break;
    }
  }

  return streak;
}

// Sync unlocked badges on each savings change
function checkAndUnlockBadges(userId: string, db: any): string[] {
  const userTransactions = db.transactions.filter((t: any) => t.userId === userId);
  const userGoals = db.goals.filter((g: any) => g.userId === userId);
  const userChallenges = db.userChallenges.filter((uc: any) => uc.userId === userId);

  // Calculate total savings
  const totalSavings = userTransactions
    .filter((t: any) => t.type === 'saving')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  // Calculate streak
  const streak = calculateStreak(userId, userTransactions);

  // Completed goals count
  const completedGoalsCount = userGoals.filter((g: any) => g.status === 'completed').length;

  const user = db.users.find((u: any) => u.id === userId);
  if (!user) return [];

  // Initialize unlocked list
  if (!user.unlockedBadges) {
    user.unlockedBadges = [];
  }

  const newlyUnlocked: string[] = [];

  STATIC_BADGES.forEach(badge => {
    // If already unlocked, skip
    if (user.unlockedBadges.includes(badge.id)) return;

    let unlock = false;

    if (badge.id === 'badge_first_save') {
      unlock = userTransactions.some((t: any) => t.type === 'saving');
    } else if (badge.id === 'badge_saved_5k' && badge.thresholdAmount) {
      unlock = totalSavings >= badge.thresholdAmount;
    } else if (badge.id === 'badge_saved_20k' && badge.thresholdAmount) {
      unlock = totalSavings >= badge.thresholdAmount;
    } else if (badge.id === 'badge_savings_master' && badge.thresholdAmount) {
      unlock = totalSavings >= badge.thresholdAmount;
    } else if (badge.id === 'badge_30_day' && badge.thresholdDays) {
      unlock = streak >= badge.thresholdDays;
    } else if (badge.id === 'badge_goal_completed') {
      unlock = completedGoalsCount >= 1;
    }

    if (unlock) {
      user.unlockedBadges.push(badge.id);
      newlyUnlocked.push(badge.name);

      // Create a notification for unlocking the badge
      db.notifications.push({
        id: `notif_badge_${Date.now()}_${badge.id}`,
        userId,
        message: `🏆 Badge Unlocked: "${badge.name}"! ${badge.description} ${badge.icon}`,
        type: 'success',
        date: new Date().toISOString(),
        read: false
      });
    }
  });

  return newlyUnlocked;
}

// AUTH API ENDPOINTS

// Sign Up
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, currency } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const db = readDB();
  const existingUser = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const userId = `user_${Date.now()}`;
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  const newUser = {
    id: userId,
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    currency: currency || 'NGN',
    createdAt: new Date().toISOString(),
    unlockedBadges: []
  };

  db.users.push(newUser);

  // Initialize standard default budget planner
  db.budgets.push({
    userId,
    allowance: 0,
    income: 0,
    pocketMoney: 0,
    scholarship: 0,
    sideHustle: 0,
    needsPercent: 50,
    wantsPercent: 30,
    savingsPercent: 20
  });

  // Welcome notification
  db.notifications.push({
    id: `notif_welcome_${Date.now()}`,
    userId,
    message: `Welcome to EduSave, ${name}! Your student savings companion workspace has been created. Start saving for your books, laptop, or tuition fees!`,
    type: 'info',
    date: new Date().toISOString(),
    read: false
  });

  writeDB(db);

  const token = jwt.sign({ id: userId, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    message: 'User registered successfully!',
    token,
    user: {
      id: userId,
      name: newUser.name,
      email: newUser.email,
      currency: newUser.currency,
      createdAt: newUser.createdAt,
      bankDetails: undefined
    }
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const db = readDB();
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    message: 'Logged in successfully!',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      createdAt: user.createdAt,
      bankDetails: user.bankDetails
    }
  });
});

// Forgot Password (Simulated)
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const db = readDB();
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(404).json({ error: 'No user found with this email address.' });
  }

  res.json({
    message: `Password reset link sent! Check ${email} for further instructions. (Note: In production, this would dispatch a real transactional email. On our sandbox, your password remains unchanged.)`
  });
});

// Verify Email (Simulated)
app.post('/api/auth/verify-email', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  res.json({
    message: `Verification email triggered! A secured activation sequence has been sent to ${email}.`
  });
});


// DATA RETRIEVAL & SYNC APIS (Requires JWT)

app.get('/api/data', authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const db = readDB();

  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const userTransactions = db.transactions.filter((t: any) => t.userId === userId);
  const userGoals = db.goals.filter((g: any) => g.userId === userId);
  const userBudget = db.budgets.find((b: any) => b.userId === userId) || {
    userId, allowance: 0, income: 0, pocketMoney: 0, scholarship: 0, sideHustle: 0,
    needsPercent: 50, wantsPercent: 30, savingsPercent: 20
  };
  const userJoinedChallenges = db.userChallenges.filter((uc: any) => uc.userId === userId);
  const userNotifications = db.notifications.filter((n: any) => n.userId === userId);

  // Calculate balance
  const totalSavings = userTransactions
    .filter((t: any) => t.type === 'saving')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const totalExpenses = userTransactions
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const balance = totalSavings - totalExpenses;

  // Streak
  const streak = calculateStreak(userId, userTransactions);

  // Today's savings
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySavings = userTransactions
    .filter((t: any) => t.userId === userId && t.type === 'saving' && t.date === todayStr)
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  // Weekly savings (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklySavings = userTransactions
    .filter((t: any) => t.userId === userId && t.type === 'saving' && new Date(t.date) >= oneWeekAgo)
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  // Monthly Goal
  const monthlyGoal = (userBudget.allowance + userBudget.income + userBudget.pocketMoney + userBudget.scholarship + userBudget.sideHustle) * (userBudget.savingsPercent / 100);

  // Badge mapping
  const badges = STATIC_BADGES.map(badge => {
    const isUnlocked = user.unlockedBadges && user.unlockedBadges.includes(badge.id);
    return {
      ...badge,
      unlockedAt: isUnlocked ? user.createdAt : undefined // Simulated date
    };
  });

  res.json({
    balance: Math.max(0, balance),
    monthlyGoal: monthlyGoal || 10000,
    todaySavings,
    weeklySavings,
    totalDeposits: totalSavings,
    streak,
    recentTransactions: userTransactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    goals: userGoals,
    budget: userBudget,
    challenges: {
      available: STATIC_CHALLENGES,
      joined: userJoinedChallenges
    },
    badges,
    notifications: userNotifications.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
  });
});


// User Profile Update
app.put('/api/user/profile', authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const { name, currency, bankDetails } = req.body;

  const db = readDB();
  const userIndex = db.users.findIndex((u: any) => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (name) db.users[userIndex].name = name;
  if (currency) db.users[userIndex].currency = currency;
  if (bankDetails !== undefined) db.users[userIndex].bankDetails = bankDetails;

  writeDB(db);

  res.json({
    message: 'Profile updated successfully!',
    user: {
      id: db.users[userIndex].id,
      name: db.users[userIndex].name,
      email: db.users[userIndex].email,
      currency: db.users[userIndex].currency,
      createdAt: db.users[userIndex].createdAt,
      bankDetails: db.users[userIndex].bankDetails
    }
  });
});


// SAVINGS GOAL CRUD

// Create savings goal
app.post('/api/goals', authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const { name, targetAmount, deadline, category } = req.body;

  if (!name || !targetAmount || !deadline || !category) {
    return res.status(400).json({ error: 'Goal name, target amount, deadline, and category are required.' });
  }

  const db = readDB();
  const newGoal = {
    id: `goal_${Date.now()}`,
    userId,
    name,
    targetAmount: Number(targetAmount),
    currentAmount: 0,
    deadline,
    status: 'active' as const,
    category,
    createdAt: new Date().toISOString()
  };

  db.goals.push(newGoal);

  db.notifications.push({
    id: `notif_goal_${Date.now()}`,
    userId,
    message: `🎯 Target set! You created a new goal: "${name}" to save ₦${Number(targetAmount).toLocaleString()} by ${deadline}.`,
    type: 'success',
    date: new Date().toISOString(),
    read: false
  });

  writeDB(db);

  res.status(201).json({ message: 'Goal created successfully!', goal: newGoal });
});

// Update Goal (supports pausing, completing, adding savings specifically, or editing core metadata)
app.put('/api/goals/:id', authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const goalId = req.params.id;
  const { name, targetAmount, currentAmount, deadline, status, category } = req.body;

  const db = readDB();
  const goalIndex = db.goals.findIndex((g: any) => g.id === goalId && g.userId === userId);

  if (goalIndex === -1) {
    return res.status(404).json({ error: 'Goal not found or access denied.' });
  }

  const goal = db.goals[goalIndex];

  if (name) goal.name = name;
  if (targetAmount !== undefined) goal.targetAmount = Number(targetAmount);
  if (currentAmount !== undefined) {
    goal.currentAmount = Number(currentAmount);
    // If saving goal is fully hit, change status to completed
    if (goal.currentAmount >= goal.targetAmount && goal.status !== 'completed') {
      goal.status = 'completed';
      db.notifications.push({
        id: `notif_comp_${Date.now()}`,
        userId,
        message: `🏆 Victory! You reached your goal for "${goal.name}"! Outstanding financial discipline!`,
        type: 'success',
        date: new Date().toISOString(),
        read: false
      });
    }
  }
  if (deadline) goal.deadline = deadline;
  if (status) goal.status = status;
  if (category) goal.category = category;

  // Recheck badges to see if "Goal Completed" unlocks
  checkAndUnlockBadges(userId, db);

  writeDB(db);

  res.json({ message: 'Goal updated successfully!', goal });
});

// Delete Goal
app.delete('/api/goals/:id', authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const goalId = req.params.id;

  const db = readDB();
  const goalIndex = db.goals.findIndex((g: any) => g.id === goalId && g.userId === userId);

  if (goalIndex === -1) {
    return res.status(404).json({ error: 'Goal not found or access denied.' });
  }

  const deletedGoal = db.goals.splice(goalIndex, 1)[0];

  db.notifications.push({
    id: `notif_del_${Date.now()}`,
    userId,
    message: `🗑️ Savings goal "${deletedGoal.name}" has been deleted. Your savings are safe, but the tracking target was removed.`,
    type: 'warning',
    date: new Date().toISOString(),
    read: false
  });

  writeDB(db);

  res.json({ message: 'Goal deleted successfully!', id: goalId });
});


// TRANSACTION CRUD (Savings & Expenses)

// Log a transaction
app.post('/api/transactions', authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const { amount, type, category, date, note, allocateToGoalId } = req.body;

  if (!amount || !type || !category || !date) {
    return res.status(400).json({ error: 'Amount, type, category, and date are required.' });
  }

  const db = readDB();
  const transactionId = `t_${Date.now()}`;

  const newTransaction = {
    id: transactionId,
    userId,
    amount: Number(amount),
    type: type as 'saving' | 'expense',
    category,
    date,
    note,
    createdAt: new Date().toISOString()
  };

  db.transactions.push(newTransaction);

  let goalMsg = '';

  // Handle optional direct allocation to a Savings Goal
  if (type === 'saving' && allocateToGoalId) {
    const goalIndex = db.goals.findIndex((g: any) => g.id === allocateToGoalId && g.userId === userId);
    if (goalIndex !== -1) {
      const targetGoal = db.goals[goalIndex];
      targetGoal.currentAmount += Number(amount);
      goalMsg = ` Allocated ₦${Number(amount).toLocaleString()} to your "${targetGoal.name}" goal.`;

      if (targetGoal.currentAmount >= targetGoal.targetAmount && targetGoal.status !== 'completed') {
        targetGoal.status = 'completed';
        db.notifications.push({
          id: `notif_comp_${Date.now()}`,
          userId,
          message: `🏆 Victory! You reached your savings target for "${targetGoal.name}"! Great habit!`,
          type: 'success',
          date: new Date().toISOString(),
          read: false
        });
      }
    }
  }

  // Auto update active challenge progress if matching
  if (type === 'saving') {
    db.userChallenges.forEach((uc: any) => {
      if (uc.userId === userId && uc.status === 'active') {
        const challenge = STATIC_CHALLENGES.find(c => c.id === uc.challengeId);
        if (challenge) {
          // Add savings to challenge progress
          uc.currentAmount += Number(amount);
          if (uc.currentAmount >= challenge.targetAmount) {
            uc.status = 'completed';
            db.notifications.push({
              id: `notif_ch_comp_${Date.now()}`,
              userId,
              message: `🔥 Challenge Completed: "${challenge.name}"! Outstanding work! You have earned your reward.`,
              type: 'success',
              date: new Date().toISOString(),
              read: false
            });
          }
        }
      }
    });
  }

  // Auto trigger dynamic badge checking
  const newlyUnlocked = checkAndUnlockBadges(userId, db);

  writeDB(db);

  res.status(201).json({
    message: `Transaction logged successfully!${goalMsg}`,
    transaction: newTransaction,
    newlyUnlocked
  });
});

// Delete transaction
app.delete('/api/transactions/:id', authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const transactionId = req.params.id;

  const db = readDB();
  const index = db.transactions.findIndex((t: any) => t.id === transactionId && t.userId === userId);

  if (index === -1) {
    return res.status(404).json({ error: 'Transaction not found or access denied.' });
  }

  db.transactions.splice(index, 1);
  writeDB(db);

  res.json({ message: 'Transaction removed successfully!', id: transactionId });
});


// SMART BUDGET PLANNER

// Update budget setup
app.put('/api/budget', authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const { allowance, income, pocketMoney, scholarship, sideHustle, needsPercent, wantsPercent, savingsPercent } = req.body;

  const db = readDB();
  let budgetIndex = db.budgets.findIndex((b: any) => b.userId === userId);

  const updatedBudget = {
    userId,
    allowance: allowance !== undefined ? Number(allowance) : 0,
    income: income !== undefined ? Number(income) : 0,
    pocketMoney: pocketMoney !== undefined ? Number(pocketMoney) : 0,
    scholarship: scholarship !== undefined ? Number(scholarship) : 0,
    sideHustle: sideHustle !== undefined ? Number(sideHustle) : 0,
    needsPercent: needsPercent !== undefined ? Number(needsPercent) : 50,
    wantsPercent: wantsPercent !== undefined ? Number(wantsPercent) : 30,
    savingsPercent: savingsPercent !== undefined ? Number(savingsPercent) : 20
  };

  if (budgetIndex !== -1) {
    db.budgets[budgetIndex] = updatedBudget;
  } else {
    db.budgets.push(updatedBudget);
  }

  writeDB(db);
  res.json({ message: 'Smart Budget updated successfully!', budget: updatedBudget });
});


// CHALLENGES SYSTEM

// Join Challenge
app.post('/api/challenges/join', authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const { challengeId } = req.body;

  if (!challengeId) {
    return res.status(400).json({ error: 'Challenge ID is required.' });
  }

  const challenge = STATIC_CHALLENGES.find(c => c.id === challengeId);
  if (!challenge) {
    return res.status(404).json({ error: 'Challenge not found.' });
  }

  const db = readDB();
  const existing = db.userChallenges.find((uc: any) => uc.userId === userId && uc.challengeId === challengeId);

  if (existing) {
    if (existing.status === 'active') {
      return res.status(400).json({ error: 'You are already active in this savings challenge!' });
    }
    // Restart if completed previously
    existing.status = 'active';
    existing.startDate = new Date().toISOString().split('T')[0];
    existing.currentAmount = 0;
  } else {
    db.userChallenges.push({
      userId,
      challengeId,
      startDate: new Date().toISOString().split('T')[0],
      currentAmount: 0,
      status: 'active'
    });
  }

  db.notifications.push({
    id: `notif_ch_join_${Date.now()}`,
    userId,
    message: `🚀 Challenge Accepted: "${challenge.name}" has begun! Let's hit that savings goal together.`,
    type: 'info',
    date: new Date().toISOString(),
    read: false
  });

  writeDB(db);

  res.json({ message: `Successfully joined "${challenge.name}" savings challenge!`, challengeId });
});


// NOTIFICATIONS READ SYNC

app.put('/api/notifications/read', authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const db = readDB();

  db.notifications.forEach((n: any) => {
    if (n.userId === userId) {
      n.read = true;
    }
  });

  writeDB(db);
  res.json({ message: 'All notifications marked as read.' });
});


// GEMINI AI-POWERED INSIGHTS GENERATION (Uses modern @google/genai SDK)

app.post('/api/ai/insights', authenticateToken, async (req: any, res) => {
  const userId = req.user.id;
  const db = readDB();

  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const userTransactions = db.transactions.filter((t: any) => t.userId === userId);
  const userGoals = db.goals.filter((g: any) => g.userId === userId);
  const userBudget = db.budgets.find((b: any) => b.userId === userId) || {
    userId, allowance: 0, income: 0, pocketMoney: 0, scholarship: 0, sideHustle: 0,
    needsPercent: 50, wantsPercent: 30, savingsPercent: 20
  };

  // Compile user context to send to Gemini
  const totalSavings = userTransactions
    .filter((t: any) => t.type === 'saving')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const totalExpenses = userTransactions
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const balance = totalSavings - totalExpenses;

  const expenseCategories: Record<string, number> = {};
  userTransactions
    .filter((t: any) => t.type === 'expense')
    .forEach((t: any) => {
      expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amount;
    });

  const activeGoals = userGoals.filter((g: any) => g.status === 'active');

  const contextPrompt = `
You are the AI Financial Companion inside EduSave, a smart savings web application for students.
Analyze the following student financial dashboard context and provide hyper-personalized, encouraging, and highly specific money-saving tips and coaching advice.

STUDENT PROFILE:
- Name: ${user.name}
- Account Currency: ${user.currency || 'NGN'}
- Joined: ${user.createdAt}

FINANCIAL OVERVIEW:
- Total Savings Balance: ${user.currency || '₦'}${balance}
- Total Savings Accumulated: ${user.currency || '₦'}${totalSavings}
- Total Expenses Recorded: ${user.currency || '₦'}${totalExpenses}

MONTHLY SMART BUDGET SETTINGS:
- Allowance: ${user.currency || '₦'}${user.budget?.allowance || userBudget.allowance || 0}
- Part-time Income: ${user.currency || '₦'}${user.budget?.income || userBudget.income || 0}
- Pocket Money: ${user.currency || '₦'}${user.budget?.pocketMoney || userBudget.pocketMoney || 0}
- Scholarship Funds: ${user.currency || '₦'}${user.budget?.scholarship || userBudget.scholarship || 0}
- Side Hustle Income: ${user.currency || '₦'}${user.budget?.sideHustle || userBudget.sideHustle || 0}
- Targeted Allocation Ratio: Needs ${userBudget.needsPercent}%, Wants ${userBudget.wantsPercent}%, Savings ${userBudget.savingsPercent}%

SPENDING CATEGORY BREAKDOWN:
${Object.entries(expenseCategories).map(([cat, val]) => `- ${cat}: ${user.currency || '₦'}${val}`).join('\n') || 'No expenses logged yet.'}

ACTIVE SAVINGS GOALS:
${activeGoals.map((g: any) => `- "${g.name}": Target ${user.currency || '₦'}${g.targetAmount}, Currently Saved: ${user.currency || '₦'}${g.currentAmount} (Progress: ${Math.round((g.currentAmount / g.targetAmount) * 100)}%), Deadline: ${g.deadline}`).join('\n') || 'No active savings goals yet.'}

RECENT LOGGED TRANSACTIONS (MAX 5):
${userTransactions.slice(0, 5).map((t: any) => `- [${t.type.toUpperCase()}] ${user.currency || '₦'}${t.amount} on ${t.category} (${t.date}) - Note: ${t.note || 'None'}`).join('\n') || 'No transactions yet.'}

INSTRUCTIONS:
1. Provide a professional, engaging, and highly motivating student coaching review. Speak directly to ${user.name}.
2. Give exactly three (3) highly actionable, concrete financial coaching insights tailored to their spending and goals.
3. Calculate real percentages (e.g., "You spend X% of your money on Food") and show them their status.
4. Give them a highly creative student budget-saving tip based on Nigerian / global student experiences (e.g. sharing data bundles, buying second-hand textbooks, bulk meal prepping in hostels, avoiding fast-food cafeteria premiums).
5. Format your response cleanly using Markdown with elegant headers and structured bullet points. Keep it punchy, visual, and highly helpful.
`;

  // Check if Gemini is enabled, otherwise use smart rule-based fallback
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contextPrompt,
        config: {
          systemInstruction: 'You are EduSave Coach, a helpful, student-friendly personal finance AI. You write elegant, actionable, markdown-based financial reports with encouragement.',
        }
      });

      const adviceText = response.text || "Your financial reports are looking great. Let's keep saving consistently to reach your objectives!";
      return res.json({ advice: adviceText, isAI: true });
    } catch (aiError) {
      console.error("Gemini content generation failed, falling back to rule-based advice:", aiError);
    }
  }

  // Beautiful Rule-Based fallback if GEMINI_API_KEY is not defined or failed
  const foodSpend = expenseCategories['Food'] || 0;
  const foodPct = totalExpenses > 0 ? Math.round((foodSpend / totalExpenses) * 100) : 0;
  const totalInflow = userBudget.allowance + userBudget.income + userBudget.pocketMoney + userBudget.scholarship + userBudget.sideHustle;
  const suggestedSavings = totalInflow * (userBudget.savingsPercent / 100);

  let fallbackAdvice = `### 🌟 EduSave Rule-Based Financial Insights

Welcome back, **${user.name}**! Our live AI server is in offline backup mode, but here is your instant smart portfolio breakdown:

#### 📊 Spending & Budget Breakdown:
- **Food Premium**: ${foodPct > 0 ? `You spend **${foodPct}%** of your active expenses on Food. Hostels and off-campus canteens add up fast! Try group meal prepping with friends to split costs.` : "You have kept your food expenses tightly regulated. Superb!"}
- **Budget Goal Alignment**: Your monthly income inflow is **₦${totalInflow.toLocaleString()}**, which recommends a monthly savings target of **₦${suggestedSavings.toLocaleString()}** (at ${userBudget.savingsPercent}% savings rate). You have already accumulated **₦${totalSavings.toLocaleString()}**!

#### 🎯 Active Milestone Tracking:
${activeGoals.length > 0 ? activeGoals.map((g: any) => {
  const goalPct = Math.round((g.currentAmount / g.targetAmount) * 100);
  return `- **${g.name}**: You are **${goalPct}%** of the way to hitting your target. You only need **₦${(g.targetAmount - g.currentAmount).toLocaleString()}** more before **${g.deadline}**!`;
}).join('\n') : "- You don't have any active goals right now. Set a textbook, computer, or rent target today to focus your savings energy!"}

#### 💡 Student Saving Secret of the Week:
* **The Bundle Freeze**: School materials and mobile data take up a high percentage of student budgets. Check if your university offers campus Wi-Fi packages, or pool a single high-gigabyte data bundle hotspot with hostel roommates to cut data costs by 40%.`;

  res.json({ advice: fallbackAdvice, isAI: false });
});


// STATIC ENTRY POINT ROUTING WITH VITE COMPATIBILITY
async function startServer() {
  // Setup Vite Dev Server / Static files
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with compiled assets...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduSave full-stack server successfully running on http://localhost:${PORT}`);
  });
}

startServer();
