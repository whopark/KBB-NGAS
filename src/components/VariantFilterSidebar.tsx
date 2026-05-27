/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, FileSpreadsheet, ChevronDown, ChevronRight, Sliders, Filter } from 'lucide-react';
import { Variant, FilterState } from '../types';

interface VariantFilterSidebarProps {
  variants: Variant[];
  filter: FilterState;
  onFilterChange: (updated: Partial<FilterState>) => void;
  onTriggerDownload: () => void;
  activeVariant: Variant | null;
  onUpdateVariant: (variantId: string, updates: Partial<Variant>) => void;
  onAddLogEntry: (variantId: string, type: string, comment: string, prev: string, curr: string) => void;
  onSetActiveTab: (tab: 'variants' | 'report') => void;
}

export default function VariantFilterSidebar({
  variants,
  filter,
  onFilterChange,
  onTriggerDownload,
  activeVariant,
  onUpdateVariant,
  onAddLogEntry,
  onSetActiveTab,
}: VariantFilterSidebarProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showIgvModal, setShowIgvModal] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  const handleActionClick = (actionName: string) => {
    if (!activeVariant) {
      setAlertMessage("Select a variant locus first to review.");
      return;
    }

    if (actionName === 'Update Log Entries') {
      window.dispatchEvent(new CustomEvent('open-log-modal', { detail: { variantId: activeVariant.id } }));
      setSuccessMessage(`Log annotation entry modal opened for ${activeVariant.gene}.`);
    } else if (actionName === 'Clinical Tier Mapping') {
      setShowTierModal(true);
    } else if (actionName === 'Pathology Reporting') {
      onUpdateVariant(activeVariant.id, { filterStatus: 'Report' });
      onAddLogEntry(
        activeVariant.id,
        'Somatic Classification',
        'Marked locus as designated for Certified Pathology Reporting.',
        activeVariant.filterStatus,
        'Report'
      );
      setSuccessMessage(`Designated ${activeVariant.gene} for pathology report.`);
      setTimeout(() => {
        onSetActiveTab('report');
      }, 1200);
    } else if (actionName === 'Launch IGV Viewer') {
      setShowIgvModal(true);
    } else if (actionName === 'Declare False Positive') {
      const prev = activeVariant.filterStatus;
      onUpdateVariant(activeVariant.id, { filterStatus: 'False', tier: 'False' });
      onAddLogEntry(
        activeVariant.id,
        'ACMG Mutation Tier lock',
        'Cohort consensus: Declared sequence/alignment false positive artifact.',
        prev,
        'False'
      );
      setSuccessMessage(`Declared ${activeVariant.gene}:${activeVariant.aaChange} as a false positive.`);
    }
  };
  // Category counting dynamically based on the case's loaded variants:
  const getCountForCategory = (cat: typeof filter.selectedCategory) => {
    if (cat === 'All') return variants.length;
    if (cat === 'None False') {
      return variants.filter((v) => v.filterStatus !== 'False' && v.tier !== 'False').length;
    }
    return variants.filter((v) => v.filterStatus === cat || v.tier === cat).length;
  };

  const tier1Count = variants.filter(v => v.tier === 'T1' || v.filterStatus === 'T1').length;

  const categories: Array<{ id: typeof filter.selectedCategory; label: string; baseCount: number }> = [
    { id: 'All', label: 'All', baseCount: 244 },
    { id: 'T1', label: 'T1 (Pathogenic Tier I)', baseCount: 4 },
    { id: 'T2', label: 'T2 (Likely Pathological)', baseCount: 1 },
    { id: 'T3', label: 'T3 (VUS Variant)', baseCount: 14 },
    { id: 'T4', label: 'T4 (Benign / Silent)', baseCount: 137 },
    { id: 'Report', label: 'Report', baseCount: 9 },
    { id: 'False', label: 'False positives', baseCount: 61 },
    { id: 'None False', label: 'None False', baseCount: 156 },
    { id: 'Blacklist', label: 'Blacklist', baseCount: 17 },
    { id: 'Whitelist', label: 'Whitelist', baseCount: 0 },
    { id: 'OnHold', label: 'OnHold', baseCount: 0 },
    { id: 'Expert Tier', label: 'Expert Tier (ACMG III)', baseCount: 8 },
  ];

  const handleResetSearch = () => {
    onFilterChange({
      geneSearch: '',
      hgvsCSearch: '',
      hgvsPSearch: '',
    });
  };

  return (
    <>
      <aside className="w-[250px] shrink-0 flex flex-col bg-[#f5f3f3] dark:bg-[#1a2332] border border-[#c0c7d6] rounded-lg overflow-hidden shadow-sm h-full max-h-[calc(100vh-170px)] custom-scrollbar">
        {/* Accordion header: SNV/INDEL */}
      <div className="p-2 bg-[#efeded] dark:bg-slate-800 border-b border-[#c0c7d6]">
        <div className="bg-[#005daa] text-white rounded flex justify-between items-center px-3 py-1.5 cursor-pointer shadow-sm">
          <span className="text-[12px] font-bold">SNV/INDEL</span>
          <ChevronDown className="h-3.5 w-3.5 text-white" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 p-2.5">
        {/* Section 1: Variant Filter Select */}
        <div className="bg-white dark:bg-slate-850 p-2 rounded border border-[#c0c7d6]">
          <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-2 uppercase flex items-center gap-1">
            <Filter className="h-3 w-3" />
            <span>Variant Filter</span>
          </div>
          <div className="relative mb-2">
            <select className="w-full text-[12px] bg-[#f5f3f3] dark:bg-slate-800 border border-[#c0c7d6] rounded py-1 pl-2 pr-8 appearance-none focus:outline-none focus:border-[#005daa]">
              <option>All Variants View</option>
              <option>Clinical Pathogenicity Only</option>
              <option>VAF &gt; 5% Filter</option>
              <option>ACMG High Spec Filter</option>
            </select>
            <ChevronDown className="absolute right-2 top-2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          </div>
          <button className="w-full bg-[#cde1fd] dark:bg-slate-700 text-[#005daa] dark:text-[#a5c8ff] font-medium border border-[#c0c7d6] rounded py-1 text-[11px] hover:bg-[#b4c8e3] transition-colors">
            + Create New filter
          </button>
        </div>

        {/* Section 2: Radios Selector */}
        <div className="bg-white dark:bg-slate-850 p-2.5 rounded border border-[#c0c7d6]">
          <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-2.5 uppercase">
            FILTER CATEGORIES
          </div>
          <div className="flex flex-col gap-1.5 text-[11.5px]">
            {categories.map((cat) => {
              const currentCount = getCountForCategory(cat.id);
              return (
                <label
                  key={cat.id}
                  className={`flex items-center justify-between px-2 py-0.5 rounded cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    filter.selectedCategory === cat.id
                      ? 'bg-[#cde1fd] dark:bg-[#203a5d] text-[#001c3a] dark:text-[#a5c8ff] font-semibold'
                      : 'text-slate-650 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="variant_category"
                      checked={filter.selectedCategory === cat.id}
                      onChange={() => onFilterChange({ selectedCategory: cat.id })}
                      className="text-[#005daa] focus:ring-[#005daa] h-3 w-3"
                    />
                    <span>{cat.id === 'All' ? 'All' : cat.id}</span>
                  </div>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded text-slate-500 font-mono">
                    {currentCount}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Section 3: Variant Search API fields */}
        <div className="bg-white dark:bg-slate-850 p-2.5 rounded border border-[#c0c7d6] flex flex-col gap-2">
          <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-1 uppercase flex items-center gap-1">
            <Search className="h-3 w-3" />
            <span>Variant Search</span>
          </div>
          <div className="flex flex-col gap-1.5 text-[11px]">
            <div className="grid grid-cols-[60px_1fr] items-center gap-1">
              <span className="text-slate-500">Gene</span>
              <input
                type="text"
                placeholder="e.g. IDH2"
                value={filter.geneSearch}
                onChange={(e) => onFilterChange({ geneSearch: e.target.value })}
                className="bg-[#f5f3f3] dark:bg-slate-800 border border-[#c0c7d6] rounded px-1.5 py-0.5 h-[24px] text-[11.5px] uppercase"
              />
            </div>
            <div className="grid grid-cols-[60px_1fr] items-center gap-1">
              <span className="text-slate-500">HGVS(c.)</span>
              <input
                type="text"
                placeholder="e.g. c.419G"
                value={filter.hgvsCSearch}
                onChange={(e) => onFilterChange({ hgvsCSearch: e.target.value })}
                className="bg-[#f5f3f3] dark:bg-slate-800 border border-[#c0c7d6] rounded px-1.5 py-0.5 h-[24px] text-[11.5px]"
              />
            </div>
            <div className="grid grid-cols-[60px_1fr] items-center gap-1">
              <span className="text-slate-500">HGVS(p.)</span>
              <input
                type="text"
                placeholder="e.g. p.R140"
                value={filter.hgvsPSearch}
                onChange={(e) => onFilterChange({ hgvsPSearch: e.target.value })}
                className="bg-[#f5f3f3] dark:bg-slate-800 border border-[#c0c7d6] rounded px-1.5 py-0.5 h-[24px] text-[11.5px]"
              />
            </div>
          </div>
          <div className="flex gap-1.5 mt-1">
            <button className="flex-1 bg-[#4d6077] dark:bg-slate-700 text-white rounded text-[10px] font-bold py-1 flex items-center justify-center gap-0.5 hover:brightness-110 active:scale-95 transition-all">
              <Sliders className="h-2.5 w-2.5" /> Apply
            </button>
            <button
              onClick={handleResetSearch}
              className="flex-1 bg-[#e4e2e2] hover:bg-[#dbdad9] dark:bg-slate-800 border border-[#c0c7d6] text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold py-1 flex items-center justify-center gap-0.5"
            >
              <RotateCcw className="h-2.5 w-2.5" /> Reset
            </button>
          </div>
        </div>

        {/* Section 4: Variant Review Actions */}
        <div className="bg-white dark:bg-slate-850 p-2.5 rounded border border-[#c0c7d6] flex flex-col gap-1.5">
          <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-1 uppercase flex items-center justify-between gap-1.5">
            <span>Variant Review Functions</span>
            {tier1Count > 0 && (
              <span className="bg-red-500/25 text-red-500 border border-red-500/40 px-1.5 py-0.5 text-[8.5px] font-black tracking-normal leading-none animate-pulse">
                {tier1Count} Actionable
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1 text-[11px]">
            {['Update Log Entries', 'Clinical Tier Mapping', 'Pathology Reporting', 'Launch IGV Viewer', 'Declare False Positive'].map((action, i) => (
              <button
                key={i}
                className="w-full bg-[#f5f3f3] dark:bg-slate-800 hover:bg-[#eae8e7] dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-1 px-2.5 rounded text-left flex justify-between items-center transition-all group cursor-pointer"
                onClick={() => handleActionClick(action)}
              >
                <span>{action}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#DFFF00] transition-colors" />
              </button>
            ))}
          </div>

          <div
            onClick={onTriggerDownload}
            className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 hover:text-[#DFFF00] cursor-pointer"
          >
            <span className="font-semibold underline">Download results file</span>
            <FileSpreadsheet className="h-4 w-4 text-[#DFFF00] font-bold" />
          </div>
        </div>
      </div>
    </aside>

      {/* Dynamic Success Toast */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 bg-black border border-[#DFFF00] text-[#DFFF00] px-4 py-3 font-mono text-[11px] shadow-2xl z-50 flex items-center gap-2 animate-bounce">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DFFF00] animate-ping" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Dynamic Alert/Warning Toast */}
      {alertMessage && (
        <div className="fixed bottom-6 right-6 bg-black border border-red-500 text-red-500 px-4 py-3 font-mono text-[11px] shadow-2xl z-50 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* IGV Genomic Alignment Viewer Dialog */}
      {showIgvModal && activeVariant && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-[#DFFF00]/40 p-6 w-full max-w-4xl text-white font-mono select-none">
            {/* Title Bar */}
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-650 animate-pulse" />
                <h3 className="text-[12px] font-black uppercase tracking-widest text-[#DFFF00]">
                  KBB-NGAS INTEGRATIVE GENOMICS ALIGNMENT VIEWER (v2.1)
                </h3>
              </div>
              <button 
                onClick={() => setShowIgvModal(false)}
                className="text-white hover:text-[#DFFF00] tracking-widest text-[11px] font-mono border border-white/10 px-2 py-0.5 hover:border-[#DFFF00] transition-colors cursor-pointer"
              >
                [ESC] CLOSE
              </button>
            </div>

            {/* Track Parameters */}
            <div className="grid grid-cols-4 gap-4 bg-white/5 p-3 text-[10px] text-white/70 border-l-2 border-[#DFFF00] mb-4">
              <div><strong className="text-white">CHROMOSOME:</strong> {activeVariant.chr}</div>
              <div><strong className="text-white">COORDINATE:</strong> {activeVariant.startPos}</div>
              <div><strong className="text-white">GENE / LOCUS:</strong> {activeVariant.gene} (Exon {activeVariant.exon})</div>
              <div><strong className="text-white">MUTATION:</strong> {activeVariant.aaChange} ({activeVariant.ntChange})</div>
            </div>

            {/* Coverage Analyzer track (Histogram SVG) */}
            <div className="mb-4 bg-white/[0.02] p-4 border border-white/5">
              <div className="text-[10px] text-white/50 uppercase tracking-wider mb-2 flex justify-between">
                <span>Alignment Coverage Log (Peak: {activeVariant.depth}x)</span>
                <span className="text-[#DFFF00]">Ref: {activeVariant.refCount} | Mutant: {activeVariant.altCount}</span>
              </div>
              
              {/* Coverage Chart */}
              <div className="h-[60px] relative w-full flex items-end">
                <div className="absolute inset-0 border-b border-white/10 pointer-events-none" />
                {Array.from({ length: 48 }).map((_, idx) => {
                  const diff = Math.abs(idx - 24);
                  const peakFactor = Math.max(0.1, 1 - (diff * 0.035));
                  const heightPercentage = Math.floor(peakFactor * 90);
                  return (
                    <div 
                      key={idx} 
                      className={`flex-1 mx-[1px] hover:bg-[#DFFF00] transition-colors ${idx === 24 ? 'bg-[#DFFF00]' : 'bg-white/20'}`}
                      style={{ height: `${heightPercentage}%` }}
                      title={`Coverage: ${Math.floor(activeVariant.depth * peakFactor)}x`}
                    />
                  );
                })}
              </div>
              
              <div className="flex justify-between text-[9px] text-white/30 pt-1 font-mono">
                <span>{activeVariant.startPos - 25} bp</span>
                <span className="text-[#DFFF00] font-bold">MUTATION LOCUS ({activeVariant.startPos})</span>
                <span>{activeVariant.startPos + 25} bp</span>
              </div>
            </div>

            {/* Reads Track (Simulated actual reads sequence alignments) */}
            <div className="bg-white/[0.02] p-4 border border-white/5 h-[230px] overflow-y-auto custom-scrollbar flex flex-col gap-2 relative">
              <div className="text-[10px] text-white/50 uppercase tracking-wider mb-2">Simulated Somatic Pileup Reads Track</div>
              
              {/* Reference genome Sequence */}
              <div className="flex bg-white/10 p-1 text-[11px] font-bold border-y border-white/10">
                <span className="w-16 shrink-0 text-white/50 text-[10px] border-r border-white/10 pr-2 font-mono">REF NT</span>
                <div className="flex-1 flex justify-around select-none font-mono">
                  {`A T C G G A T C G C T A A G G C T A C G T A G C ${activeVariant.refSeqMutatedBase || 'G'} G G G C A T A C T G A C A T T A G C`.split(" ").map((char, i) => (
                    <span key={i} className={i === 22 ? 'text-[#DFFF00]' : 'text-white/60'}>
                      {char}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pileup Reads */}
              <div className="flex flex-col gap-1.5 pt-1">
                {Array.from({ length: 8 }).map((_, rIdx) => {
                  const hasMutation = rIdx < 5;
                  return (
                    <div key={rIdx} className="flex text-[11px] font-mono leading-none items-center">
                      <span className="w-16 shrink-0 text-white/30 text-[9px] pr-2 font-semibold font-mono">READ_0{rIdx + 1}</span>
                      <div className="flex-1 flex justify-around select-none font-mono">
                        {`A T C G G A T C G C T A A G G C T A C G T A G C ${hasMutation ? (activeVariant.altSeqMutatedBase || 'A') : (activeVariant.refSeqMutatedBase || 'G')} G G G C A T A C T G A C A T T A G C`.split(" ").map((char, i) => {
                          const isMutantSpot = i === 22;
                          let colorClass = 'text-white/40';
                          if (isMutantSpot) {
                            colorClass = hasMutation ? 'text-red-500 font-extrabold bg-red-500/20 px-0.5' : 'text-green-500';
                          }
                          return (
                            <span key={i} className={colorClass}>
                              {char}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Footer */}
            <div className="mt-4 flex justify-between items-center text-[10px] text-white/45">
              <div>Display mode: Somatic Variant Alignment Lock</div>
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 bg-red-500" /> Somatic Mutation</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 bg-green-500" /> Wild Type</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACMG Tier Classification Selection Popup Modal */}
      {showTierModal && activeVariant && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-[#DFFF00]/40 p-5 w-full max-w-[400px] text-white font-mono rounded-none">
            <h3 className="text-[12px] font-black uppercase tracking-widest text-[#DFFF00] mb-4 pb-2 border-b border-white/10 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#DFFF00]" />
              <span>ACMG Tier Classification Mapping</span>
            </h3>
            
            <p className="text-[11px] text-white/60 mb-4 leading-relaxed">
              Assign a pathogenic tier mapping to active locus <strong className="text-white">{activeVariant.gene}:{activeVariant.aaChange}</strong>.
            </p>

            <div className="flex flex-col gap-2 mb-5">
              {[
                { key: 'T1', label: 'Tier I - Actionable Somatic', desc: 'Strong evidence of clinical utility.' },
                { key: 'T2', label: 'Tier II - Likely Somatic', desc: 'Preclinical evidence or target of standard panels.' },
                { key: 'T3', label: 'Tier III - VUS', desc: 'Unknown clinical details or population frequency.' },
                { key: 'T4', label: 'Tier IV - Benign / Silent', desc: 'Prevalent in general control databases.' },
                { key: 'Expert Tier', label: 'Expert Tier (ACMG III)', desc: 'Interrogator priority classification.' },
              ].map((tierOpt) => (
                <button
                  key={tierOpt.key}
                  onClick={() => {
                    const prev = activeVariant.filterStatus;
                    onUpdateVariant(activeVariant.id, { 
                      tier: (tierOpt.key === 'Expert Tier' ? 'T3' : tierOpt.key) as any, 
                      filterStatus: tierOpt.key as any 
                    });
                    onAddLogEntry(
                      activeVariant.id,
                      'ACMG Mutation Tier lock',
                      `ACMG Mapping Reclassified: Assigned to ${tierOpt.label}`,
                      prev,
                      tierOpt.key
                    );
                    setShowTierModal(false);
                    setSuccessMessage(`Mapped ${activeVariant.gene} to ${tierOpt.key} successfully.`);
                  }}
                  className="w-full text-left p-2.5 bg-white/5 hover:bg-[#DFFF00]/10 border border-white/10 hover:border-[#DFFF00]/40 transition-all flex flex-col gap-1 rounded-none group cursor-pointer"
                >
                  <div className="flex justify-between items-center text-[11px] font-black text-[#DFFF00] group-hover:text-white">
                    <span>{tierOpt.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-white/30 group-hover:text-[#DFFF00]" />
                  </div>
                  <span className="text-[9px] text-white/45 leading-normal">{tierOpt.desc}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setShowTierModal(false)}
                className="text-white/60 hover:text-[#DFFF00] text-[10px] tracking-wider uppercase border border-white/10 px-3 py-1.5 hover:border-[#DFFF00] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
