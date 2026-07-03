/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Landmark, RefreshCw, CheckCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface LinkBankAccountProps {
  user: any;
  onUpdateBankDetails: (bankName: string, accountNumber: string, accountName: string, isLinked: boolean) => Promise<void>;
}

export default function LinkBankAccount({ user, onUpdateBankDetails }: LinkBankAccountProps) {
  const isLinked = !!user?.bankDetails?.isLinked;

  const [bankName, setBankName] = useState(user?.bankDetails?.bankName || 'GTBank');
  const [accountNumber, setAccountNumber] = useState(user?.bankDetails?.accountNumber || '');
  const [accountName, setAccountName] = useState(user?.bankDetails?.accountName || user?.name || '');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Sync state if user prop changes
  useEffect(() => {
    if (user?.bankDetails) {
      setBankName(user.bankDetails.bankName || 'GTBank');
      setAccountNumber(user.bankDetails.accountNumber || '');
      setAccountName(user.bankDetails.accountName || user.name || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!bankName || !accountNumber || !accountName) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    // Ensure account number is strictly numeric
    if (!/^\d+$/.test(accountNumber)) {
      setErrorMsg('Account number must contain only numbers.');
      return;
    }

    // Ensure account number has at least 10 digits
    if (accountNumber.length < 10) {
      setErrorMsg('Account number must be at least 10 digits long.');
      return;
    }

    setLoading(true);

    try {
      await onUpdateBankDetails(bankName, accountNumber, accountName, true);
      setSuccessMsg('Bank account linked successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update bank details.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (window.confirm('Are you sure you want to unlink your bank account?')) {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      try {
        await onUpdateBankDetails('', '', '', false);
        setAccountNumber('');
        setIsEditing(false);
        setSuccessMsg('Bank account unlinked successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (err: any) {
        setErrorMsg('Failed to unlink bank account.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    // Revert inputs to original user state
    if (user?.bankDetails) {
      setBankName(user.bankDetails.bankName || 'GTBank');
      setAccountNumber(user.bankDetails.accountNumber || '');
      setAccountName(user.bankDetails.accountName || user.name || '');
    } else {
      setBankName('GTBank');
      setAccountNumber('');
      setAccountName(user?.name || '');
    }
    setIsEditing(false);
    setErrorMsg('');
  };

  return (
    <div id="link_bank_account_comp" className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
          <Landmark className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-gray-950 dark:text-white">Student Bank Integration</h4>
          <p className="text-[10px] text-gray-400 font-normal">Connect your bank account to sync pocket money & savings.</p>
        </div>
      </div>

      {isLinked && !isEditing ? (
        <div className="bg-gray-50/70 dark:bg-slate-900/40 p-3 rounded-xl border border-gray-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-bold text-xs text-gray-900 dark:text-white">Active Connection</span>
            </div>
            <button
              type="button"
              onClick={handleUnlink}
              disabled={loading}
              className="text-[10px] text-rose-500 hover:text-rose-600 dark:text-rose-400 font-bold transition-all cursor-pointer"
            >
              Unlink Account
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] bg-white dark:bg-slate-800/80 p-2.5 rounded-lg border border-gray-50 dark:border-slate-700/40 font-semibold">
            <span className="text-gray-400">Bank:</span>
            <span className="text-gray-900 dark:text-white text-right font-bold">{user.bankDetails.bankName}</span>
            <span className="text-gray-400">Account:</span>
            <span className="text-gray-900 dark:text-white text-right font-mono text-xs">
              •••• {user.bankDetails.accountNumber.slice(-4)}
            </span>
            <span className="text-gray-400">Holder:</span>
            <span className="text-gray-900 dark:text-white text-right truncate font-bold">{user.bankDetails.accountName}</span>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                // Allow editing locally
                setAccountNumber(user.bankDetails.accountNumber || '');
                setBankName(user.bankDetails.bankName || 'GTBank');
                setAccountName(user.bankDetails.accountName || user.name || '');
                setIsEditing(true);
              }}
              className="text-[10px] text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 font-bold underline cursor-pointer"
            >
              Change Linked Details
            </button>
          </div>
        </div>
      ) : isEditing || (!isLinked && isEditing) ? (
        <form onSubmit={handleSubmit} className="space-y-3 bg-gray-50/50 dark:bg-slate-900/20 p-3 rounded-xl border border-gray-100 dark:border-slate-800/80">
          <div className="grid grid-cols-1 gap-2.5">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Bank Name</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="GTBank">Guaranty Trust Bank (GTBank)</option>
                <option value="Access Bank">Access Bank</option>
                <option value="Kuda Bank">Kuda Bank (Microfinance)</option>
                <option value="Zenith Bank">Zenith Bank</option>
                <option value="UBA">United Bank for Africa (UBA)</option>
                <option value="First Bank">First Bank of Nigeria</option>
                <option value="Sterling Bank">Sterling Bank</option>
                <option value="Opay">OPay Digital Bank</option>
                <option value="Moniepoint">Moniepoint Microfinance Bank</option>
                <option value="Chase Bank">Chase Bank</option>
                <option value="Bank of America">Bank of America</option>
                <option value="Barclays">Barclays Bank</option>
              </select>
            </div>

             <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Account Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0123456789"
                  value={accountNumber}
                  onChange={(e) => {
                    const cleanValue = e.target.value.replace(/\D/g, '').slice(0, 12);
                    setAccountNumber(cleanValue);
                    if (cleanValue && cleanValue.length < 10) {
                      setErrorMsg('Account number must be at least 10 digits long.');
                    } else if (cleanValue && !/^\d+$/.test(cleanValue)) {
                      setErrorMsg('Account number must contain only numbers.');
                    } else {
                      setErrorMsg('');
                    }
                  }}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 font-mono tracking-wider font-bold transition-all ${
                    accountNumber && (accountNumber.length < 10 || !/^\d+$/.test(accountNumber))
                      ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500'
                      : 'border-gray-200 dark:border-slate-700 focus:ring-emerald-500'
                  }`}
                />
                {accountNumber && accountNumber.length < 10 && (
                  <span className="text-[9px] text-rose-500 block mt-0.5 font-medium">
                    ({accountNumber.length}/10 digits minimum)
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Account Holder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tunde Alabi"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold py-1.5 rounded-lg text-[10px] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded-lg text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isLinked ? 'Update Link' : 'Link & Save'}
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50/50 dark:bg-slate-900/20 p-3.5 rounded-xl border border-gray-100 dark:border-slate-800/80 text-center space-y-2.5">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
            Your bank details are not linked yet. Link your student account to unlock dynamic instant transfer saving rewards.
          </p>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm cursor-pointer"
          >
            Link Bank Account
          </button>
        </div>
      )}

      {/* Success/Error Alerts */}
      {successMsg && (
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2 text-center animate-pulse">
          {successMsg}
        </p>
      )}
      {errorMsg && (
        <p className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold mt-2 text-center">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
