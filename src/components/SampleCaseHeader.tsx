/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Fingerprint, Download, ChevronDown, CheckCircle, RefreshCw, Upload } from 'lucide-react';
import { SAMPLE_CASES, SampleCase } from '../data';

interface SampleCaseHeaderProps {
  cases: SampleCase[];
  activeCase: SampleCase;
  onCaseChange: (newCase: SampleCase) => void;
  activeTab: 'variants' | 'report';
  setActiveTab: (tab: 'variants' | 'report') => void;
  onOpenVcfModal?: () => void;
}

export default function SampleCaseHeader({
  cases,
  activeCase,
  onCaseChange,
  activeTab,
  setActiveTab,
  onOpenVcfModal,
}: SampleCaseHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="flex flex-col w-full bg-white dark:bg-[#1a2332] mb-3 rounded-lg border border-[#c0c7d6] overflow-hidden shrink-0 shadow-sm">
      {/* Top row with patient ID and data summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between p-3.5 border-b border-[#eae8e7] dark:border-slate-800 bg-[#f5f3f3] dark:bg-[#151d2a]">
        <div className="flex items-center gap-2.5 relative mr-4 flex-wrap">
          <Fingerprint className="text-slate-500 dark:text-sky-400 h-5 w-5" />
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-850 px-2 py-1 rounded text-left"
            >
              <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">
                {activeCase.id}
              </h2>
              <ChevronDown className="h-4.5 w-4.5 text-slate-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-1 w-64 bg-white dark:bg-[#1f293d] border border-[#c0c7d6] rounded shadow-xl z-50 py-1">
                <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-805">
                  Select Patient Case
                </div>
                {cases.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onCaseChange(c);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[12px] flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                      c.id === activeCase.id
                        ? 'font-semibold text-[#005daa] dark:text-[#a5c8ff]'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate pr-2">{c.id}</span>
                    {c.id === activeCase.id && <span className="h-2 w-2 rounded-full bg-[#005daa] dark:bg-sky-400 shrink-0" />}
                  </button>
                ))}
                
                {onOpenVcfModal && (
                  <>
                    <div className="border-t border-slate-200 dark:border-slate-800 my-1"></div>
                    <button
                      onClick={() => {
                        onOpenVcfModal();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-[11px] font-black text-rose-650 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Import local VCF File...</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {onOpenVcfModal && (
            <button
              onClick={() => {
                onOpenVcfModal();
              }}
              className="flex items-center gap-1 bg-[#005daa] hover:bg-sky-700 dark:bg-red-950/20 dark:hover:bg-red-950/40 border border-[#005daa]/20 dark:border-red-500/35 text-white dark:text-red-400 font-extrabold p-1 px-2.5 rounded text-[10.5px] tracking-wide transition-all cursor-pointer uppercase h-7 ml-1"
              title="Upload local biological VCF file to somatic workspace"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload VCF</span>
            </button>
          )}
        </div>

        {/* Dense run statistics */}
        <div className="mt-3 lg:mt-0 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
          <div>
            <span className="font-bold text-slate-850 dark:text-white mr-1">RUN:</span>
            <span className="font-mono text-[10.5px] tracking-tight">{activeCase.run}</span>
          </div>
          <div>
            <span className="font-bold text-slate-850 dark:text-white mr-1">PANEL:</span>
            <span>{activeCase.panel}</span>
          </div>
          <div>
            <span className="font-bold text-slate-850 dark:text-white mr-1">DISEASE:</span>
            <span>{activeCase.disease}</span>
          </div>
          <div>
            <span className="font-bold text-slate-850 dark:text-white mr-1">INSTRUMENT:</span>
            <span>{activeCase.instrument}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#eae8e7] dark:bg-slate-800 p-0.5 px-1.5 rounded text-[11px]">
            <span className="font-bold text-slate-850 dark:text-white">PIPELINE:</span>
            <span>{activeCase.pipeline}</span>
            <button className="hover:text-[#005faa] dark:hover:text-sky-400 transition-colors" title="Download configuration specification">
              <Download className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs list (VARIANTS / REPORT) */}
      <div className="flex px-4 pt-3.5 gap-3 bg-black">
        <button
          onClick={() => setActiveTab('variants')}
          className={`rounded-none px-6 py-2.5 text-[11px] font-black tracking-[0.2em] transition-all cursor-pointer ${
            activeTab === 'variants'
              ? 'bg-[#DFFF00] text-black shadow-none'
              : 'bg-white/5 hover:bg-white/10 text-white/60'
          }`}
        >
          COHORT VARIANTS
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`rounded-none px-6 py-2.5 text-[11px] font-black tracking-[0.2em] transition-all cursor-pointer ${
            activeTab === 'report'
              ? 'bg-[#DFFF00] text-black shadow-none'
              : 'bg-white/5 hover:bg-white/10 text-white/60'
          }`}
        >
          GENERATE CERTIFIED REPORT
        </button>
      </div>
    </div>
  );
}
