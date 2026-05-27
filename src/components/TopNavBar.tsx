/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bell, Settings, HelpCircle, ChevronDown, User, Layers, ShieldCheck, Database } from 'lucide-react';

interface TopNavBarProps {
  onNavClick?: (route: string) => void;
  activeRoute?: string;
  userEmail: string;
}

export default function TopNavBar({ onNavClick, activeRoute = 'samples', userEmail }: TopNavBarProps) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <header className="bg-black text-white border-b border-white/10 flex justify-between items-center h-[56px] px-6 w-full shrink-0 z-50 shadow-none font-sans">
      <div className="flex items-center gap-8 h-full">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavClick?.('samples')}>
          <Layers className="text-[#DFFF00] h-5 w-5" />
          <h1 className="text-[14px] font-black tracking-[0.25em] uppercase text-white">
            KBB-NGAS&trade;
          </h1>
          <span className="hidden lg:flex text-[9px] text-white/45 border-l border-white/10 pl-4 h-4 items-center tracking-widest font-mono select-none">
            GENOMICS STUDIO / VOL. 092
          </span>
        </div>
        <nav className="hidden md:flex h-full gap-6 items-center">
          <button
            onClick={() => onNavClick?.('dashboard')}
            className={`px-1 py-1.5 text-[11px] font-extrabold tracking-[0.15em] hover:text-[#DFFF00] transition-all border-b-2 ${
              activeRoute === 'dashboard'
                ? 'border-[#DFFF00] text-[#DFFF00]'
                : 'border-transparent text-white/50'
            }`}
          >
            DASHBOARD
          </button>
          <button
            onClick={() => onNavClick?.('results')}
            className={`px-1 py-1.5 text-[11px] font-extrabold tracking-[0.15em] hover:text-[#DFFF00] transition-all border-b-2 ${
              activeRoute === 'results'
                ? 'border-[#DFFF00] text-[#DFFF00]'
                : 'border-transparent text-white/50'
            }`}
          >
            RESULTS
          </button>
          <button
            onClick={() => onNavClick?.('samples')}
            className={`px-1 py-1.5 flex items-center gap-1 text-[11px] font-extrabold tracking-[0.15em] hover:text-[#DFFF00] transition-all border-b-2 ${
              activeRoute === 'samples'
                ? 'border-[#DFFF00] text-[#DFFF00]'
                : 'border-transparent text-white/50'
            }`}
          >
            SAMPLES
            <ChevronDown className="h-3 w-3" />
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-300">
          <button className="p-1 px-1.5 hover:text-[#005faa] hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors relative" title="Notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-[#cf1322] rounded-full"></span>
          </button>
          <button className="p-1 px-1.5 hover:text-[#005faa] hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" title="Settings">
            <Settings className="h-4 w-4" />
          </button>
          <button className="p-1 px-1.5 hover:text-[#005faa] hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" title="Help / Documentation">
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-[#c0c7d6]"></div>

        <div className="relative">
          <div
            className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850 p-1 px-2 rounded transition-colors"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          >
            <ShieldCheck className="h-4 w-4 text-[#005daa] dark:text-sky-400" />
            <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200">
              Pathologist User
            </span>
            <ChevronDown className="h-3 w-3 text-slate-500" />
          </div>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-[#1a2332] border border-[#c0c7d6] rounded shadow-lg z-50 py-2 text-[12px] text-slate-700 dark:text-slate-200">
              <div className="px-4 py-1.5 border-b border-slate-100 dark:border-slate-800 text-slate-500">
                Logged in as
                <div className="font-semibold text-slate-800 dark:text-white truncate">{userEmail}</div>
              </div>
              <div className="px-4 py-2 mt-1 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-slate-500">
                  <Database className="h-3.5 w-3.5" />
                  <span>Clinical Lab: LMS Region A</span>
                </div>
                <div className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 mt-1">
                  Active Role: Primary Interpreter
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
