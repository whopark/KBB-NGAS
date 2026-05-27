/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Columns, List, Info, X, ExternalLink, Settings2, Sliders, AlertTriangle, Star, CheckSquare } from 'lucide-react';
import { Variant } from '../types';
import { evaluateArtifactRisk } from '../utils/genetics';

interface VariantTableGridProps {
  variants: Variant[];
  selectedVariant: Variant | null;
  onSelectVariant: (variant: Variant) => void;
  checkedVariants: string[];
  onToggleCheck: (id: string) => void;
  onToggleCheckAll: () => void;
  onUpdateVariant?: (variantId: string, updates: Partial<Variant>) => void;
  onAddLogEntry?: (variantId: string, type: string, comment: string, prev: string, curr: string) => void;
  interestingGenes?: string[];
  onToggleInterestingGene?: (geneName: string) => void;
  showOnlyInteresting?: boolean;
  onToggleShowOnlyInteresting?: () => void;
  showOnlyChecked?: boolean;
  onToggleShowOnlyChecked?: () => void;
}

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
}

const PRESET_SIMPLIFIED = ['tier', 'gene', 'fraction', 'sameInRun', 'type', 'consequence', 'ntChange', 'aaChange'];

const PRESET_COORDINATES = ['gene', 'ntChange', 'aaChange', 'chr', 'startPos', 'depth', 'refCount', 'altCount', 'exon', 'clinVarInterpretation'];

export default function VariantTableGrid({
  variants,
  selectedVariant,
  onSelectVariant,
  checkedVariants,
  onToggleCheck,
  onToggleCheckAll,
  onUpdateVariant,
  onAddLogEntry,
  interestingGenes = [],
  onToggleInterestingGene,
  showOnlyInteresting = false,
  onToggleShowOnlyInteresting,
  showOnlyChecked = false,
  onToggleShowOnlyChecked,
}: VariantTableGridProps) {
  const [homopolymerTooltipOpen, setHomopolymerTooltipOpen] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  // Load customizable columns from local storage or specify a well-integrated hybrid default
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    const cached = localStorage.getItem('kbb_ngas_columns');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // fallback
      }
    }
    return [
      { id: 'tier', label: 'Tier', visible: true },
      { id: 'gene', label: 'Gene', visible: true },
      { id: 'fraction', label: 'Fraction (%)', visible: true },
      { id: 'ntChange', label: 'NT Change', visible: true },
      { id: 'aaChange', label: 'AA Change', visible: true },
      { id: 'chr', label: 'Chr', visible: true },
      { id: 'startPos', label: 'Start Position', visible: true },
      { id: 'depth', label: 'Depth', visible: true },
      { id: 'actions', label: 'Review Actions', visible: true },
      { id: 'sameInRun', label: 'Same In Run', visible: false },
      { id: 'type', label: 'Type', visible: false },
      { id: 'consequence', label: 'Consequence', visible: false },
      { id: 'hgvsC', label: 'HGVS (c.)', visible: false },
      { id: 'hgvsP', label: 'HGVS (p.)', visible: false },
      { id: 'hgvsG', label: 'HGVS (g.)', visible: false },
      { id: 'refCount', label: 'Ref Count', visible: false },
      { id: 'altCount', label: 'Alt Count', visible: false },
      { id: 'exon', label: 'Exon', visible: false },
      { id: 'dbSnpId', label: 'dbSNP ID', visible: false },
      { id: 'clinVarId', label: 'ClinVar ID', visible: false },
      { id: 'clinVarInterpretation', label: 'ClinVar Interpretation', visible: false }
    ];
  });

  const saveColumns = (newCols: ColumnConfig[]) => {
    setColumns(newCols);
    localStorage.setItem('kbb_ngas_columns', JSON.stringify(newCols));
  };

  const toggleColumnVisibility = (id: string) => {
    const updated = columns.map(col => col.id === id ? { ...col, visible: !col.visible } : col);
    saveColumns(updated);
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= columns.length) return;
    const updated = [...columns];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    saveColumns(updated);
  };

  const applyPreset = (presetId: 'simplified' | 'coordinates' | 'all' | 'none') => {
    let updated: ColumnConfig[] = [];
    if (presetId === 'all' || presetId === 'none') {
      updated = columns.map(col => ({ ...col, visible: presetId === 'all' }));
    } else if (presetId === 'simplified') {
      // Bring simplified columns to front and make them visible
      const sorted = [...columns].sort((a, b) => {
        const idxA = PRESET_SIMPLIFIED.indexOf(a.id);
        const idxB = PRESET_SIMPLIFIED.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
      updated = sorted.map(col => ({ ...col, visible: PRESET_SIMPLIFIED.includes(col.id) }));
    } else if (presetId === 'coordinates') {
      // Bring coordinates columns to front and make them visible
      const sorted = [...columns].sort((a, b) => {
        const idxA = PRESET_COORDINATES.indexOf(a.id);
        const idxB = PRESET_COORDINATES.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
      updated = sorted.map(col => ({ ...col, visible: PRESET_COORDINATES.includes(col.id) }));
    }
    saveColumns(updated);
  };

  const resetCustomColumns = () => {
    const initial = [
      { id: 'tier', label: 'Tier', visible: true },
      { id: 'gene', label: 'Gene', visible: true },
      { id: 'fraction', label: 'Fraction (%)', visible: true },
      { id: 'ntChange', label: 'NT Change', visible: true },
      { id: 'aaChange', label: 'AA Change', visible: true },
      { id: 'chr', label: 'Chr', visible: true },
      { id: 'startPos', label: 'Start Position', visible: true },
      { id: 'depth', label: 'Depth', visible: true },
      { id: 'actions', label: 'Review Actions', visible: true },
      { id: 'sameInRun', label: 'Same In Run', visible: false },
      { id: 'type', label: 'Type', visible: false },
      { id: 'consequence', label: 'Consequence', visible: false },
      { id: 'hgvsC', label: 'HGVS (c.)', visible: false },
      { id: 'hgvsP', label: 'HGVS (p.)', visible: false },
      { id: 'hgvsG', label: 'HGVS (g.)', visible: false },
      { id: 'refCount', label: 'Ref Count', visible: false },
      { id: 'altCount', label: 'Alt Count', visible: false },
      { id: 'exon', label: 'Exon', visible: false },
      { id: 'dbSnpId', label: 'dbSNP ID', visible: false },
      { id: 'clinVarId', label: 'ClinVar ID', visible: false },
      { id: 'clinVarInterpretation', label: 'ClinVar Interpretation', visible: false }
    ];
    saveColumns(initial);
  };

  const allChecked = variants.length > 0 && checkedVariants.length === variants.length;

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#1a2332] border border-[#c0c7d6] rounded-lg shadow-sm overflow-hidden min-h-[350px]">
      
      {/* Grid Controller Bar */}
      <div className="p-3 border-b border-[#eae8e7] dark:border-slate-800 bg-[#f5f3f3] dark:bg-[#151d2a] flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[12px] text-slate-500 font-medium">
            Showing <strong className="text-slate-800 dark:text-white font-bold font-mono">{variants.length}</strong> of {variants.length} variants
          </span>

          <div className="flex bg-slate-200 dark:bg-slate-850 p-1 rounded-none gap-0.5 items-center">
            <span className="text-[9px] uppercase tracking-wider text-slate-500 mx-2 font-mono font-black select-none">
              Presets:
            </span>
            <button
              onClick={() => applyPreset('simplified')}
              className="px-2 py-1 text-[10px] font-black tracking-wide flex items-center gap-1 hover:text-[#DFFF00] transition-all text-white/60 cursor-pointer"
            >
              <List className="h-3 w-3" />
              SIMPLIFIED VIEW
            </button>
            <button
              onClick={() => applyPreset('coordinates')}
              className="px-2 py-1 text-[10px] font-black tracking-wide flex items-center gap-1 hover:text-[#DFFF00] transition-all text-white/60 cursor-pointer"
            >
              <Columns className="h-3 w-3" />
              GENOMIC COORDINATES VIEW
            </button>
          </div>

          <button
            onClick={() => {
              if (onToggleShowOnlyInteresting) {
                onToggleShowOnlyInteresting();
              }
            }}
            className={`px-3 py-1 h-[28px] text-[10px] font-black tracking-wide flex items-center gap-1.5 transition-all cursor-pointer rounded-sm border ${
              showOnlyInteresting
                ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-600 shadow-sm ring-1 ring-amber-300'
                : 'bg-white/5 hover:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/10 hover:border-[#005daa] dark:hover:border-amber-400'
            }`}
            title="Filter to show only variants matching marked interesting genes"
          >
            <Star 
              className={`h-3 w-3 ${showOnlyInteresting ? 'text-slate-950' : 'text-amber-500'}`} 
              fill={showOnlyInteresting || interestingGenes.length > 0 ? "currentColor" : "none"} 
            />
            <span>INTERESTING GENES ONLY ({interestingGenes.length})</span>
            {showOnlyInteresting && (
              <span className="bg-slate-950 text-amber-500 rounded-full h-3.5 w-3.5 flex items-center justify-center text-[7.5px] font-black leading-none ml-0.5">
                ON
              </span>
            )}
          </button>

          <button
            onClick={() => {
              if (onToggleShowOnlyChecked) {
                onToggleShowOnlyChecked();
              }
            }}
            className={`px-3 py-1 h-[28px] text-[10px] font-black tracking-wide flex items-center gap-1.5 transition-all cursor-pointer rounded-sm border ${
              showOnlyChecked
                ? 'bg-sky-600 dark:bg-sky-500 text-white border-sky-500 hover:bg-sky-700 shadow-sm ring-1 ring-sky-350'
                : 'bg-white/5 hover:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/10 hover:border-[#005daa] dark:hover:border-sky-400'
            }`}
            title="Filter to show only checked variants"
          >
            <CheckSquare 
              className={`h-3 w-3 ${showOnlyChecked ? 'text-white' : 'text-sky-550 dark:text-sky-400'}`} 
            />
            <span>CHECKED ONLY ({checkedVariants.length})</span>
            {showOnlyChecked && (
              <span className="bg-white text-sky-600 rounded-full h-3.5 w-3.5 flex items-center justify-center text-[7.5px] font-black leading-none ml-0.5">
                ON
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCustomizerOpen(!customizerOpen)}
            className={`px-3.5 py-1.5 text-[11px] font-black flex items-center gap-1.5 border transition-all cursor-pointer ${
              customizerOpen 
                ? 'bg-[#DFFF00] text-black border-[#DFFF00]' 
                : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-[#DFFF00]'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Customize Columns</span>
          </button>
          <button
            onClick={resetCustomColumns}
            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/25 px-3.5 py-1.5 text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Reset Custom Columns
          </button>
        </div>
      </div>

      {/* Interactive Column Customizer Panel */}
      {customizerOpen && (
        <div className="bg-[#121212] border-b border-white/10 p-4 font-mono select-none">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#DFFF00]">
              &gt;_ COLUMN CUSTOMIZATION CONSOLE
            </span>
            <div className="flex gap-1.5 flex-wrap">
              <button 
                onClick={() => applyPreset('simplified')}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-[#DFFF00] text-[9px] px-2.5 py-1 uppercase tracking-widest font-black transition-colors cursor-pointer"
              >
                Simplified Preset
              </button>
              <button 
                onClick={() => applyPreset('coordinates')}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-[#DFFF00] text-[9px] px-2.5 py-1 uppercase tracking-widest font-black transition-colors cursor-pointer"
              >
                Coordinates Preset (Matched)
              </button>
              <button 
                onClick={() => applyPreset('all')}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-[#DFFF00] text-[9px] px-2.5 py-1 uppercase tracking-widest font-black transition-colors cursor-pointer"
              >
                Show All
              </button>
              <button 
                onClick={() => applyPreset('none')}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-[#DFFF00] text-[9px] px-2.5 py-1 uppercase tracking-widest font-black transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>
          
          <p className="text-[10px] text-white/50 mb-3 leading-normal font-sans">
            Toggle checkboxes to show/hide genomic or clinical annotations. Use the up (▲) and down (▼) arrows to control column sequence placement (shifting columns left or right relative to each other in the grid).
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[160px] overflow-y-auto custom-scrollbar p-2 bg-white/[0.02] border border-white/5">
            {columns.map((col, idx) => (
              <div 
                key={col.id} 
                className={`flex items-center justify-between p-1.5 border border-white/10 text-[10px] gap-2 ${
                  col.visible ? 'bg-[#DFFF00]/10 border-[#DFFF00]/30 text-white' : 'bg-transparent text-white/40'
                }`}
              >
                <label className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0 select-none">
                  <input
                    type="checkbox"
                    checked={col.visible}
                    onChange={() => toggleColumnVisibility(col.id)}
                    className="rounded-none border-white/10 text-[#DFFF00] focus:ring-[#DFFF00] h-3 w-3 bg-transparent cursor-pointer"
                  />
                  <span className="truncate font-semibold tracking-wider">{col.label}</span>
                </label>
                <div className="flex gap-1 shrink-0 select-none text-white/60">
                  <button
                    onClick={() => moveColumn(idx, 'up')}
                    disabled={idx === 0}
                    className={`p-0.5 hover:bg-white/10 text-[9px] rounded transition-colors ${idx === 0 ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer hover:text-[#DFFF00]'}`}
                    title="Move left in grid"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveColumn(idx, 'down')}
                    disabled={idx === columns.length - 1}
                    className={`p-0.5 hover:bg-white/10 text-[9px] rounded transition-colors ${idx === columns.length - 1 ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer hover:text-[#DFFF00]'}`}
                    title="Move right in grid"
                  >
                    ▼
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actual Data Table Responsive Canvas */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          
          {/* Main Integrated Table Thread */}
          <thead className="bg-[#efeded] dark:bg-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 sticky top-0 z-10 select-none border-b border-[#c0c7d6]">
            <tr>
              <th className="py-2.5 px-3 border-r border-[#c0c7d6] w-12 text-center sticky left-0 bg-[#efeded] dark:bg-slate-800 z-20">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={onToggleCheckAll}
                  className="rounded border-[#c0c7d6] text-[#005daa] focus:ring-[#005daa] h-3.5 w-3.5 cursor-pointer"
                />
              </th>
              {columns
                .filter((col) => col.visible)
                .map((col) => {
                  let alignClass = 'text-left';
                  let widthClass = 'w-36';
                  if (['fraction', 'sameInRun', 'depth', 'refCount', 'altCount', 'clinVarId'].includes(col.id)) alignClass = 'text-right';
                  if (['tier', 'type', 'exon'].includes(col.id)) alignClass = 'text-center';
                  
                  if (col.id === 'tier') widthClass = 'w-16';
                  if (col.id === 'gene') widthClass = 'w-28';
                  if (col.id === 'exon') widthClass = 'w-20';
                  if (col.id === 'chr') widthClass = 'w-20';
                  
                  return (
                    <th
                      key={col.id}
                      className={`py-2.5 px-3 border-r border-[#c0c7d6] ${widthClass} ${alignClass}`}
                    >
                      {col.label}
                    </th>
                  );
                })}
            </tr>
          </thead>

          <tbody className="text-[12.5px] bg-white dark:bg-slate-900 divide-y divide-[#eae8e7] dark:divide-slate-800">
            {variants.map((variant, index) => {
              const isChecked = checkedVariants.includes(variant.id);
              const isSelected = selectedVariant?.id === variant.id;
              const risk = evaluateArtifactRisk(variant);
              const isConfirmedFP = variant.tier === 'False' || variant.filterStatus === 'False';

              let rowStyleClass = 'hover:bg-[#f5f3f3] dark:hover:bg-slate-800';
              if (isSelected) {
                rowStyleClass = 'bg-[#cde1fd] dark:bg-[#1c2e43] text-[#001c3a] dark:text-[#a5c8ff]';
              } else if (isConfirmedFP) {
                rowStyleClass = 'bg-slate-100 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500 opacity-60 line-through';
              } else if (risk.isRisk) {
                rowStyleClass = risk.score === 'High'
                  ? 'bg-amber-100/70 dark:bg-amber-950/25 border-l-4 border-l-amber-600 text-slate-900 dark:text-slate-100 hover:bg-amber-200/60 dark:hover:bg-amber-950/35 font-semibold'
                  : 'bg-yellow-50/50 dark:bg-yellow-950/10 border-l-4 border-l-yellow-400 text-slate-800 dark:text-slate-200 hover:bg-yellow-100/50 dark:hover:bg-yellow-950/15';
              }

              return (
                <tr
                  key={variant.id}
                  onClick={() => onSelectVariant(variant)}
                  className={`cursor-pointer transition-all ${rowStyleClass}`}
                >
                  <td
                    className="py-1.5 px-3 border-r border-[#c0c7d6] text-center sticky left-0 bg-inherit z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCheck(variant.id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded border-[#c0c7d6] text-[#005daa] focus:ring-[#005daa] h-3.5 w-3.5 cursor-pointer"
                    />
                  </td>

                  {columns
                    .filter((col) => col.visible)
                    .map((col) => {
                      switch (col.id) {
                        case 'tier':
                          return (
                            <td key={col.id} className="py-1.5 px-3 border-r border-[#c0c7d6] text-center">
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                                  variant.tier === 'T1'
                                    ? 'bg-[#ffebee] text-[#c62828] border border-[#ef9a9a]'
                                    : variant.tier === 'T2'
                                    ? 'bg-[#fff3e0] text-[#ef6c00] border border-[#ffe082]'
                                    : variant.tier === 'T3'
                                    ? 'bg-[#e3f2fd] text-[#1565c0] border border-[#90caf9]'
                                    : variant.tier === 'T4'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : variant.tier === 'False'
                                    ? 'bg-gray-100 text-gray-500 border border-gray-300'
                                    : 'bg-[#e3f2fd] text-[#1565c0] border border-[#90caf9]'
                                }`}
                              >
                                {variant.tier === 'False' ? 'FP' : variant.tier}
                              </span>
                            </td>
                          );
                        case 'gene':
                          const geneRisk = evaluateArtifactRisk(variant);
                          const isGeneFP = variant.tier === 'False' || variant.filterStatus === 'False';
                          const isItInteresting = interestingGenes.includes(variant.gene);
                          return (
                            <td key={col.id} className="py-1.5 px-3 border-r border-[#c0c7d6] font-bold text-[#005daa] dark:text-[#a5c8ff] hover:underline flex items-center justify-between group h-full">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onToggleInterestingGene) {
                                      onToggleInterestingGene(variant.gene);
                                    }
                                  }}
                                  className={`p-0.5 rounded transition-all cursor-pointer ${
                                    isItInteresting
                                      ? 'text-amber-500 hover:text-amber-600'
                                      : 'text-slate-350 dark:text-slate-650 hover:text-amber-500 dark:hover:text-amber-400 opacity-25 hover:opacity-100 group-hover:opacity-80'
                                  }`}
                                  title={
                                    isItInteresting
                                      ? 'Remove from Interesting Genes'
                                      : 'Mark Gene as Interesting'
                                  }
                                >
                                  <Star 
                                    className="h-3.5 w-3.5" 
                                    fill={isItInteresting ? "currentColor" : "none"} 
                                  />
                                </button>
                                <span className="font-extrabold">{variant.gene}</span>
                                {isGeneFP ? (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8.5px] bg-red-650 text-white font-mono rounded font-black tracking-tight leading-none">
                                    CONFIRMED FP
                                  </span>
                                ) : (
                                  geneRisk.isRisk && (
                                    <div className="relative group/tooltip inline-block">
                                      <span 
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black tracking-tighter rounded-full shadow-sm animate-pulse cursor-help ${
                                          geneRisk.score === 'High'
                                            ? 'bg-amber-600 text-white border border-amber-500'
                                            : 'bg-yellow-500 text-slate-900 border border-yellow-400'
                                        }`}
                                      >
                                        <AlertTriangle className="h-2.5 w-2.5" />
                                        <span>FP RISK: {geneRisk.score}</span>
                                      </span>
                                      
                                      {/* High precision interactive tooltip hover card */}
                                      <div className="invisible group-hover/tooltip:visible absolute left-0 top-full mt-1.5 w-64 bg-slate-900 border border-slate-700 text-white rounded-lg shadow-2xl p-3 z-50 text-[10.5px] leading-relaxed font-normal normal-case pointer-events-none">
                                        <div className="font-extrabold text-[#DFFF00] border-b border-white/10 pb-1 mb-1.5 flex items-center gap-1">
                                          <AlertTriangle className="h-3.5 w-3.5 text-[#DFFF00]" />
                                          <span>SEQUENCING QA WARNING</span>
                                        </div>
                                        <ul className="list-disc list-inside space-y-1 text-slate-350">
                                          {geneRisk.reasons.map((reason, rIdx) => (
                                            <li key={rIdx}>{reason}</li>
                                          ))}
                                        </ul>
                                        <div className="mt-2 text-[9px] bg-amber-950/20 text-amber-400 p-1 px-1.5 rounded font-bold border border-amber-800/30">
                                          Recommendation: Click 'Exclude' in Actions to filter from clinical report.
                                        </div>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                              {variant.gene === 'ASXL1' && (
                                <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => setHomopolymerTooltipOpen(!homopolymerTooltipOpen)}
                                    className="text-amber-600 dark:text-amber-400 p-0.5 hover:bg-amber-100 rounded cursor-pointer"
                                    title="Polymer segment detected"
                                  >
                                    <Info className="h-3 w-3" />
                                  </button>
                                  {homopolymerTooltipOpen && (
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-slate-900 border border-slate-700 text-white rounded shadow-xl p-3 z-50 w-56 whitespace-normal text-[11px] leading-relaxed">
                                      <div className="flex justify-between items-center mb-1 pb-1 border-b border-slate-700 font-extrabold tracking-wider">
                                        <span>SEGMENT DETAILS</span>
                                        <button onClick={() => setHomopolymerTooltipOpen(false)} className="cursor-pointer">
                                          <X className="h-3 w-3 hover:text-red-400" />
                                        </button>
                                      </div>
                                      <p className="text-slate-350 font-normal">
                                        homopolymer sequence length is &gt;8bp. vaf &lt; 5.00% is observed in high frequency run sets.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        case 'fraction':
                          return (
                            <td key={col.id} className="py-1.5 px-3 border-r border-[#c0c7d6] text-right font-mono font-bold">
                              {variant.fraction.toFixed(2)}
                            </td>
                          );
                        case 'sameInRun':
                          return (
                            <td key={col.id} className="py-1.5 px-3 border-r border-[#c0c7d6] text-right font-mono text-white/50">
                              {variant.sameInRun}
                            </td>
                          );
                        case 'type':
                          return (
                            <td key={col.id} className="py-1.5 px-3 border-r border-[#c0c7d6] text-center font-semibold text-white/70">
                              {variant.type}
                            </td>
                          );
                        case 'consequence':
                          return (
                            <td key={col.id} className="py-1.5 px-3 border-r border-[#c0c7d6] font-mono font-medium text-white/80 truncate max-w-[200px]">
                              {variant.consequence}
                            </td>
                          );
                        case 'ntChange':
                          return (
                            <td key={col.id} className="py-1.5 px-3 border-r border-[#c0c7d6] font-mono text-[11.5px] text-[#DFFF00]">
                              {variant.ntChange}
                            </td>
                          );
                        case 'aaChange':
                          return (
                            <td key={col.id} className="py-1.5 px-3 border-r border-[#c0c7d6] font-mono text-[11.5px] text-white/80 font-semibold">
                              {variant.aaChange}
                            </td>
                          );
                        case 'hgvsC':
                          return (
                            <td key={col.id} className="py-1.5 px-3 border-r border-[#c0c7d6] font-mono text-sky-400 font-bold">
                              {variant.transcript}:{variant.ntChange}
                            </td>
                          );
                        case 'hgvsP':
                          return (
                            <td key={col.id} className="py-1.5 px-3 border-r border-[#c0c7d6] font-mono text-white/60">
                              {variant.protein}
                            </td>
                          );
                        case 'hgvsG':
                          return (
                            <td key={col.id} className="py-1.5 px-3 border-r border-[#c0c7d6] font-mono text-white/45">
                              {variant.genomeGRCh37}
                            </td>
                          );
                        case 'chr':
                          return (
                            <td key={col.id} className="py-1.5 px-3 border-r border-[#c0c7d6] font-mono font-extrabold text-white/70">
                              {variant.chr}
                            </td>
                          );
                        case 'startPos':
                          return (
                            <td key={col.id} className="py-1.5 px-3 border-r border-[#c0c7d6] font-mono font-bold text-[#1890ff] cursor-pointer hover:underline">
                              {variant.startPos}
                            </td>
                          );
                        case 'depth':
                          return (
                            <td key={col.id} className="py-1.5 px-3 border-r border-[#c0c7d6] text-right font-mono text-white/75">
                              {variant.depth}
                            </td>
                          );
                        case 'refCount':
                          return (
                            <td key={col.id} className="py-1.5 px-3 border-r border-[#c0c7d6] text-right font-mono text-white/50">
                              {variant.refCount}
                            </td>
                          );
                        case 'altCount':
                          return (
                            <td key={col.id} className="py-1.5 px-3 border-r border-[#c0c7d6] text-right font-mono text-white/50">
                              {variant.altCount}
                            </td>
                          );
                        case 'exon':
                          return (
                            <td key={col.id} className="py-1.5 px-3 border-r border-[#c0c7d6] whitespace-nowrap text-center text-white/45 font-medium">
                              {variant.exon}
                            </td>
                          );
                        case 'dbSnpId':
                          return (
                            <td key={col.id} className="py-1.5 px-3 border-r border-[#c0c7d6] font-mono text-[11px] text-white/50">
                              {variant.dbSnpId}
                            </td>
                          );
                        case 'clinVarId':
                          return (
                            <td key={col.id} className="py-1.5 px-3 border-r border-[#c0c7d6] font-mono text-[11px] text-white/50 text-right">
                              {variant.clinVarId}
                            </td>
                          );
                        case 'clinVarInterpretation':
                          return (
                            <td key={col.id} className="py-1.5 px-3 border-r border-[#c0c7d6]">
                              <span
                                className={`text-[10.5px] font-bold px-1.5 py-0.2 rounded-sm ${
                                  variant.clinVarInterpretation.includes('Pathogenic')
                                    ? 'text-[#cf1322] bg-[#ffebee] border border-[#ef9a9a]'
                                    : variant.clinVarInterpretation.includes('Benign')
                                    ? 'text-gray-400 bg-gray-650'
                                    : 'text-amber-700 bg-amber-50'
                                }`}
                              >
                                {variant.clinVarInterpretation}
                              </span>
                            </td>
                          );
                        case 'actions':
                          return (
                            <td key={col.id} className="py-1 px-2 border-r border-[#c0c7d6] text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <select
                                  value={variant.tier}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (onUpdateVariant && onAddLogEntry) {
                                      onUpdateVariant(variant.id, { tier: val as any, filterStatus: val as any });
                                      onAddLogEntry(
                                        variant.id,
                                        'ACMG Mutation Tier lock',
                                        `Reclassified: Assigned to ${val}`,
                                        variant.tier,
                                        val
                                      );
                                    }
                                  }}
                                  className="bg-white dark:bg-slate-800 border border-[#c0c7d6] text-slate-850 dark:text-slate-100 rounded text-[10px] font-black p-0.5 focus:outline-none cursor-pointer"
                                >
                                  <option value="T1">T1</option>
                                  <option value="T2">T2</option>
                                  <option value="T3">T3</option>
                                  <option value="T4">T4</option>
                                  <option value="False">FP</option>
                                </select>
                                
                                {variant.tier === 'False' || variant.filterStatus === 'False' ? (
                                  <button
                                    onClick={() => {
                                      if (onUpdateVariant && onAddLogEntry) {
                                        onUpdateVariant(variant.id, { tier: 'T1', filterStatus: 'T1' });
                                        onAddLogEntry(
                                          variant.id,
                                          'ACMG Mutation Tier lock',
                                          'Reverted false positive flag.',
                                          'False',
                                          'T1'
                                        );
                                      }
                                    }}
                                    className="bg-amber-50 hover:bg-amber-100 text-amber-750 font-bold px-1.5 py-0.5 text-[9px] border border-amber-250 cursor-pointer transition-colors"
                                    title="Restore as standard variant"
                                  >
                                    Restore
                                  </button>
                                ) : (
                                  (() => {
                                    const hasRisk = evaluateArtifactRisk(variant).isRisk;
                                    return (
                                      <button
                                        onClick={() => {
                                          if (onUpdateVariant && onAddLogEntry) {
                                            onUpdateVariant(variant.id, { filterStatus: 'False', tier: 'False' });
                                            onAddLogEntry(
                                              variant.id,
                                              'ACMG Mutation Tier lock',
                                              'Declared sequence/alignment false positive artifact.',
                                              variant.tier,
                                              'False'
                                            );
                                          }
                                        }}
                                        className={`font-black px-2 py-0.5 text-[9px] rounded border cursor-pointer transition-all duration-300 ${
                                          hasRisk 
                                            ? 'bg-red-600 text-white border-red-500 hover:bg-red-700 animate-pulse shadow-md ring-1 ring-red-300' 
                                            : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-250'
                                        }`}
                                        title={hasRisk ? "Sequence quality anomaly detected! Exclude from genomic report is recommended." : "Exclude from report"}
                                      >
                                        Exclude
                                      </button>
                                    );
                                  })()
                                )}
                              </div>
                            </td>
                          );
                        default:
                          return null;
                      }
                    })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Floating hints count */}
      {checkedVariants.length > 0 && (
        <div className="bg-[#001c3a] text-white p-2.5 px-4 flex justify-between items-center text-[12px] shrink-0 border-t border-slate-700 z-10 animate-fade-in">
          <div>
            Locked session selection: <strong className="font-bold font-mono text-sky-400">{checkedVariants.length}</strong> variants selected for bulk pathological report compilation.
          </div>
          <button
            onClick={() => alert(`Stitch bulk report for: ${checkedVariants.join(', ')}`)}
            className="bg-[#DFFF00] text-black hover:bg-[#f1ff66] font-bold px-3 py-1 rounded-none text-[11px] transition-all flex items-center gap-1 cursor-pointer"
          >
            Stitch Report <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
