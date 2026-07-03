/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Award, Zap, ShieldCheck, Play, Flame, RefreshCw } from 'lucide-react';
import { DashboardData, SavingsChallenge } from '../types';

interface ChallengesProps {
  data: DashboardData;
  onJoinChallenge: (challengeId: string) => Promise<void>;
  currencySymbol: string;
}

export default function Challenges({ data, onJoinChallenge, currencySymbol }: ChallengesProps) {
  const [loadingChallengeId, setLoadingChallengeId] = useState<string | null>(null);

  const handleJoinChallenge = async (challengeId: string) => {
    setLoadingChallengeId(challengeId);
    try {
      await onJoinChallenge(challengeId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChallengeId(null);
    }
  };

  const getChallengeProgress = (challengeId: string) => {
    const uc = data.challenges.joined.find(j => j.challengeId === challengeId);
    if (!uc) return null;
    return uc;
  };

  return (
    <div id="challenges_view" className="space-y-8">
      
      {/* View Title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gamified Savings Challenges</h2>
        <p className="text-xs text-gray-500">Engage in micro-savings and secure reward badges</p>
      </div>

      {/* Grid of Challenges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.challenges.available.map((challenge) => {
          const joinedProgress = getChallengeProgress(challenge.id);
          const isJoined = !!joinedProgress;
          const isActive = isJoined && joinedProgress.status === 'active';
          const isCompleted = isJoined && joinedProgress.status === 'completed';
          
          const progressPercentage = joinedProgress 
            ? Math.min(100, Math.round((joinedProgress.currentAmount / challenge.targetAmount) * 100))
            : 0;

          return (
            <motion.div 
              key={challenge.id}
              whileHover={{ y: -3 }}
              className={`bg-white dark:bg-slate-800 p-5 rounded-2xl border ${
                isCompleted 
                  ? 'border-emerald-200 bg-emerald-500/5' 
                  : isActive 
                  ? 'border-indigo-100 dark:border-indigo-950 shadow-xs' 
                  : 'border-gray-100 dark:border-slate-700/60 shadow-xs'
              } flex flex-col justify-between space-y-4`}
            >
              
              {/* Challenge Details Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300">
                    {challenge.category} Segment
                  </span>
                  {isCompleted ? (
                    <span className="text-[10px] text-emerald-600 font-bold inline-flex items-center gap-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Completed
                    </span>
                  ) : isActive ? (
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold animate-pulse">
                      Active Progress
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-semibold">
                      Open Challenge
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                  {challenge.name}
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-400 leading-relaxed">
                  {challenge.description}
                </p>
              </div>

              {/* Reward and Target summary */}
              <div className="bg-gray-50 dark:bg-slate-900/40 p-3 rounded-xl space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-[10px] text-gray-500">
                  <span>Milestone Target:</span>
                  <span className="font-bold text-gray-950 dark:text-white">
                    {currencySymbol}{challenge.targetAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-500">
                  <span>Duration limit:</span>
                  <span className="font-bold text-gray-950 dark:text-white">
                    {challenge.durationDays} Days
                  </span>
                </div>

                {/* Progress bars if joined */}
                {isJoined && (
                  <div className="space-y-1.5 pt-1.5 border-t border-gray-100 dark:border-slate-700/50">
                    <div className="flex justify-between items-baseline text-[10px] text-gray-500">
                      <span>Saved progress:</span>
                      <span className="font-mono text-gray-950 dark:text-white font-bold">
                        {currencySymbol}{joinedProgress.currentAmount.toLocaleString()} / {currencySymbol}{challenge.targetAmount.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-[9px] text-gray-400 block text-right">{progressPercentage}% Completed</span>
                  </div>
                )}
              </div>

              {/* CTA Join Challenge */}
              {!isJoined && (
                <button
                  onClick={() => handleJoinChallenge(challenge.id)}
                  disabled={loadingChallengeId === challenge.id}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shadow-indigo-500/10"
                >
                  {loadingChallengeId === challenge.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      Accept Challenge
                    </>
                  )}
                </button>
              )}

              {isActive && (
                <div className="text-center py-1 text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg">
                  Progressing automatically on daily deposits!
                </div>
              )}

              {isCompleted && (
                <div className="text-center py-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                  Well done! Badge and streaks unlocked.
                </div>
              )}

            </motion.div>
          );
        })}
      </div>

      {/* Achievements Cabinet Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm space-y-5">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
            <Award className="w-4 h-4 text-emerald-500" />
            Milestone Achievement Showcase
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Maintain consistent habits to unlock animated badges</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {data.badges.map((badge) => {
            const isUnlocked = !!badge.unlockedAt;

            return (
              <div 
                key={badge.id}
                className={`p-4 rounded-2xl border text-center relative overflow-hidden transition-all duration-300 flex flex-col items-center justify-between min-h-40 ${
                  isUnlocked 
                    ? 'border-amber-200 dark:border-amber-900 bg-amber-500/5 shadow-xs' 
                    : 'border-gray-100 dark:border-slate-700/40 bg-gray-50/30 dark:bg-slate-900/10'
                }`}
              >
                {/* Glow for Unlocked Badges */}
                {isUnlocked && (
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-300/10 via-transparent to-transparent pointer-events-none"></div>
                )}

                {/* Animated Badge Icon Display */}
                <motion.div 
                  animate={isUnlocked ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl mb-2 relative ${
                    isUnlocked 
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-500 shadow-md shadow-amber-500/5' 
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-400 grayscale border-dashed border-2 border-gray-200'
                  }`}
                >
                  {badge.icon}
                </motion.div>

                {/* Badge Title & Specs */}
                <div>
                  <h4 className={`text-xs font-bold leading-tight ${isUnlocked ? 'text-gray-950 dark:text-white' : 'text-gray-400'}`}>
                    {badge.name}
                  </h4>
                  <p className="text-[9px] text-gray-400 mt-1 leading-normal max-w-xs px-1">
                    {badge.description}
                  </p>
                </div>

                {/* Date indicator */}
                {isUnlocked ? (
                  <span className="text-[9px] text-amber-600 font-semibold mt-2 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 block">
                    Unlocked
                  </span>
                ) : (
                  <span className="text-[9px] text-gray-400 font-semibold mt-2 px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700/50 block">
                    Locked
                  </span>
                )}

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
