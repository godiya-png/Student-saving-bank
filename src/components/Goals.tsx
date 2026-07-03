/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Target, Plus, Trash2, Edit2, Play, Pause, CheckCircle, Calendar, RefreshCw } from 'lucide-react';
import { SavingsGoal } from '../types';

interface GoalsProps {
  goals: SavingsGoal[];
  weeklySavings: number;
  onAddGoal: (name: string, targetAmount: number, deadline: string, category: string) => Promise<void>;
  onUpdateGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
  currencySymbol: string;
}

const PRESET_GOAL_CATEGORIES = [
  'Tuition Fees', 'Hostel Rent', 'Textbooks', 'Laptop', 
  'Transport', 'Feeding', 'Emergency Fund', 'NYSC Preparation', 
  'Graduation Fund', 'Miscellaneous'
];

export default function Goals({ goals, weeklySavings, onAddGoal, onUpdateGoal, onDeleteGoal, currencySymbol }: GoalsProps) {
  // Modal/Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('Textbooks');
  const [loading, setLoading] = useState(false);

  // Edit Goal Mode
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || !deadline) return;
    setLoading(true);
    try {
      await onAddGoal(name, Number(targetAmount), deadline, category);
      setName('');
      setTargetAmount('');
      setDeadline('');
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (goal: SavingsGoal) => {
    setEditingGoalId(goal.id);
    setEditName(goal.name);
    setEditTarget(String(goal.targetAmount));
    setEditDeadline(goal.deadline);
    setEditCategory(goal.category);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName || !editTarget || !editDeadline) return;
    setLoading(true);
    try {
      await onUpdateGoal(id, {
        name: editName,
        targetAmount: Number(editTarget),
        deadline: editDeadline,
        category: editCategory
      });
      setEditingGoalId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePause = async (goal: SavingsGoal) => {
    const newStatus = goal.status === 'paused' ? 'active' : 'paused';
    await onUpdateGoal(goal.id, { status: newStatus });
  };

  const handleMarkCompleted = async (goal: SavingsGoal) => {
    await onUpdateGoal(goal.id, { 
      currentAmount: goal.targetAmount,
      status: 'completed' 
    });
  };

  // Helper: Estimate Completion Date based on current rate
  const getEstimatedCompletionText = (goal: SavingsGoal) => {
    if (goal.status === 'completed') return 'Goal hit!';
    if (goal.currentAmount >= goal.targetAmount) return 'Ready to finalize!';
    
    const remaining = goal.targetAmount - goal.currentAmount;
    // Assume minimum saving of ₦1,000/week if user has 0 weekly savings to give a realistic fallback
    const effectiveWeeklySavings = Math.max(1000, weeklySavings);
    const weeksRemaining = remaining / effectiveWeeklySavings;
    const daysRemaining = Math.ceil(weeksRemaining * 7);

    const estDate = new Date();
    estDate.setDate(estDate.getDate() + daysRemaining);
    
    return estDate.toISOString().split('T')[0];
  };

  return (
    <div id="goals_view" className="space-y-6">
      
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Savings Goals</h2>
          <p className="text-xs text-gray-500">Plan and secure your major academic milestones</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-500/10"
        >
          <Plus className="w-4 h-4" />
          Create Savings Goal
        </button>
      </div>

      {/* Grid containing Active Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map(goal => {
          const isEditing = editingGoalId === goal.id;
          const progressPercentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const isCompleted = goal.status === 'completed' || progressPercentage >= 100;

          return (
            <motion.div 
              key={goal.id}
              layout
              className={`bg-white dark:bg-slate-800 p-5 rounded-2xl border ${
                isCompleted 
                  ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/5 dark:bg-emerald-950/5' 
                  : 'border-gray-100 dark:border-slate-700/60 shadow-xs'
              } flex flex-col justify-between space-y-4`}
            >
              
              {/* Card Header */}
              <div className="flex items-start justify-between">
                {isEditing ? (
                  <div className="space-y-2 w-full pr-4">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full text-xs font-bold p-1 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                    />
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full text-xs p-1 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                    >
                      {PRESET_GOAL_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300">
                        {goal.category}
                      </span>
                      {goal.status === 'paused' && (
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
                          Paused
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5">
                          Completed
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-gray-950 dark:text-white mt-1.5">{goal.name}</h3>
                  </div>
                )}

                {/* Target Icons */}
                <div className="p-2.5 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Target className="w-4 h-4" />
                </div>
              </div>

              {/* Editing Input Details */}
              {isEditing ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-gray-400">Target ({currencySymbol})</label>
                    <input
                      type="number"
                      value={editTarget}
                      onChange={(e) => setEditTarget(e.target.value)}
                      className="w-full p-1 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400">Deadline</label>
                    <input
                      type="date"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      className="w-full p-1 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between text-xs font-semibold">
                    <span className="text-gray-400">Target Saved progress</span>
                    <span className="text-gray-900 dark:text-white">
                      {currencySymbol}{goal.currentAmount.toLocaleString()} / <span className="text-gray-400">{currencySymbol}{goal.targetAmount.toLocaleString()}</span>
                    </span>
                  </div>

                  {/* Progress Gauge */}
                  <div className="w-full bg-gray-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-400">
                    <span>{progressPercentage}% Completed</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Deadline: {goal.deadline}
                    </span>
                  </div>
                </div>
              )}

              {/* Goal Coaching Card Footer */}
              {!isEditing && (
                <div className="bg-gray-50/50 dark:bg-slate-900/40 p-2.5 rounded-xl text-[11px] text-gray-500 flex justify-between items-center">
                  <span>Est. Completion:</span>
                  <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                    {getEstimatedCompletionText(goal)}
                  </span>
                </div>
              )}

              {/* Card Operation Controls */}
              <div className="flex items-center justify-end gap-2 border-t border-gray-50 dark:border-slate-700/50 pt-3">
                {isEditing ? (
                  <>
                    <button 
                      onClick={() => handleSaveEdit(goal.id)}
                      disabled={loading}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[10px] px-3 py-1 rounded-md cursor-pointer inline-flex items-center gap-1"
                    >
                      {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Save'}
                    </button>
                    <button 
                      onClick={() => setEditingGoalId(null)}
                      className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 font-medium text-[10px] px-3 py-1 rounded-md cursor-pointer"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {!isCompleted && (
                      <>
                        <button
                          onClick={() => handleTogglePause(goal)}
                          className="text-gray-400 hover:text-amber-500 p-1 rounded-md transition-colors"
                          title={goal.status === 'paused' ? 'Resume Goal' : 'Pause Goal'}
                        >
                          {goal.status === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleMarkCompleted(goal)}
                          className="text-gray-400 hover:text-emerald-500 p-1 rounded-md transition-colors"
                          title="Mark as Completed"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleStartEdit(goal)}
                      className="text-gray-400 hover:text-indigo-500 p-1 rounded-md transition-colors"
                      title="Edit Goal Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="text-gray-400 hover:text-rose-500 p-1 rounded-md transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

            </motion.div>
          );
        })}

        {goals.length === 0 && (
          <div className="col-span-full bg-white dark:bg-slate-800 p-12 text-center rounded-2xl border border-gray-100 dark:border-slate-700/60">
            <Target className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">No active savings goals</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">Create a goal for your tuition, computer, textbooks, or student welfare to direct your savings habit!</p>
          </div>
        )}
      </div>

      {/* Add Goal Drawer/Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100 dark:border-slate-700/80"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-slate-700/80">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-500" />
                Create New Savings Target
              </h3>
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-500 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Goal Title / Milestone Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next Semester Hostel Rent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-950 dark:text-white focus:outline-none"
                  >
                    {PRESET_GOAL_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Target Amount ({currencySymbol})</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 50000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Deadline Date</label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-1 shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Set Saving Milestone'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
