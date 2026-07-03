/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Sparkles, Award, Lightbulb, GraduationCap, DollarSign } from 'lucide-react';

export default function Motivation() {
  const TIPS = [
    { title: "Bulk Meal Hostel Preps", desc: "Eating out off-campus accounts for up to 45% of student leakages. Buy rice, beans, and tubers in bulk with roommates to share cooking gas and split costs.", icon: "🍲" },
    { title: "Joint Mobile Data Pools", desc: "Data is a major student utility. Pool a single high-gigabyte plan and share hotspots with your roommates rather than paying high individual per-gigabyte premiums.", icon: "📶" },
    { title: "Second-Hand Textbooks", desc: "Always ask senior students or check departmental notices for second-hand textbooks before buying brand new from university bookstores.", icon: "📖" },
    { title: "Walk Off-Campus", desc: "Whenever safe, walk shorter distances instead of taking individual bike or taxi shuttles. The small ₦200 fares add up to thousands monthly!", icon: "🚶" }
  ];

  const SUCCESS_STORIES = [
    { name: "Chioma Nnadi", school: "University of Lagos", story: "By dedicating 20% of her photography side hustle income into the EduSave Laptop Goal, she secured a refurbished MacBook Pro in 5 months. 'The visual streak kept me from wasting money on snacks!'", achievement: "Secured MacBook Pro" },
    { name: "Suleiman Ibrahim", school: "Ahmadu Bello University", story: "Saved ₦100 daily for 8 months. Used the accumulated reserves to pay off his second-semester hostel rent completely without bothering his parents.", achievement: "Paid Hostel Rent" },
    { name: "Abiodun Kolawole", school: "University of Ibadan", story: "Used the smart budget planner to regulate wants. Saved ₦45,000 to purchase study tablets and textbooks, boosting his GPA to a solid First Class.", achievement: "GPA Milestone" }
  ];

  const ARTICLES = [
    {
      title: "The Student Guide to the 50/30/20 Budgeting Rule",
      readTime: "4 min read",
      preview: "Standard budgeting can feel too restrictive for student lives. Learn how the simplified 50/30/20 rule divides pocket money into Needs, Wants, and Savings to keep things simple yet effective.",
      tag: "Budgeting Basics"
    },
    {
      title: "Building an Emergency Hostel Fund on a Tight Allowance",
      readTime: "6 min read",
      preview: "From medical surprises to urgent field trips, emergency costs can disrupt academic focus. Discover the step-by-step method to stash away small emergency buffers on a N10,000 allowance.",
      tag: "Emergency Buffers"
    },
    {
      title: "Side Hustles That Fit Academic Schedules",
      readTime: "5 min read",
      preview: "Increasing income speeds up your saving milestones. Explore highly flexible student-friendly side gigs like freelance UI design, assignment tutoring, copyediting, and social media moderation.",
      tag: "Student Incomes"
    }
  ];

  return (
    <div id="motivation_view" className="space-y-8">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">EduSave Motivation & Education</h2>
        <p className="text-xs text-gray-500">Inspiring success stories, financial education, and micro-saving secrets</p>
      </div>

      {/* Grid of micro savings tips */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          Student Money-Saving Secrets
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIPS.map((tip, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-between"
            >
              <div className="text-2xl mb-2">{tip.icon}</div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-1">{tip.title}</h4>
                <p className="text-[10px] text-gray-400 leading-relaxed">{tip.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Two columns: success stories & articles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: success stories */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <GraduationCap className="w-4.5 h-4.5 text-emerald-500" />
            Student success stories
          </h3>
          
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {SUCCESS_STORIES.map((student, idx) => (
              <div key={idx} className="p-4 bg-gray-50/50 dark:bg-slate-900/30 rounded-xl border border-gray-50 dark:border-slate-700/50 space-y-2">
                <div className="flex justify-between items-baseline">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">{student.name}</h4>
                    <span className="text-[9px] text-gray-400">{student.school}</span>
                  </div>
                  <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                    {student.achievement}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed italic">
                  "{student.story}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Educational Articles */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4.5 h-4.5 text-indigo-500" />
            Financial Education Hub
          </h3>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {ARTICLES.map((art, idx) => (
              <div key={idx} className="p-4 hover:bg-gray-50/50 dark:hover:bg-slate-700/20 rounded-xl border border-transparent hover:border-gray-100 dark:hover:border-slate-700 transition-all space-y-1 cursor-pointer">
                <div className="flex justify-between items-center text-[9px] font-bold text-indigo-600">
                  <span>{art.tag}</span>
                  <span className="text-gray-400 font-medium">{art.readTime}</span>
                </div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white hover:underline">{art.title}</h4>
                <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">
                  {art.preview}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
