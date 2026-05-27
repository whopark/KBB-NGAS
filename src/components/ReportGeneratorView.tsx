/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileText, Printer, FileSpreadsheet, Share2, Clipboard, HeartCrack, Layers, ShieldCheck, AlertTriangle } from 'lucide-react';
import { SampleCase } from '../data';
import { Variant } from '../types';
import { evaluateArtifactRisk } from '../utils/genetics';

interface ReportGeneratorViewProps {
  activeCase: SampleCase;
  onUpdateVariant: (variantId: string, updates: Partial<Variant>) => void;
  onAddLogEntry: (variantId: string, type: string, comment: string, prev: string, curr: string) => void;
}

export default function ReportGeneratorView({ activeCase, onUpdateVariant, onAddLogEntry }: ReportGeneratorViewProps) {
  const [directorDraftSigned, setDirectorDraftSigned] = useState(false);
  const [labComments, setLabComments] = useState(
    "Next-generation sequencing analysis of the target locus indicates significant oncological mutated variants consistent with positive cellular diagnosis. Refer directly to clinical trials and somatically matched targets."
  );

  // Somatic mutated variant calls (filtering out false positives)
  const actionableVariants = activeCase.variants.filter(
    (v) => (v.tier === 'T1' || v.tier === 'T2') && v.filterStatus !== 'False'
  );
  const vusVariants = activeCase.variants.filter(
    (v) => v.tier === 'T3' && v.filterStatus !== 'False'
  );
  const excludedVariants = activeCase.variants.filter(
    (v) => v.tier === 'False' || v.filterStatus === 'False'
  );

  const activeVariantsWithRisk = [...actionableVariants, ...vusVariants].filter(
    (v) => evaluateArtifactRisk(v).isRisk
  );

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`
CLINICAL NEXT-GENERATION NGS SEQUENCING CLINICAL REPORT
======================================================
CASE ID: ${activeCase.id}
DISEASE SPECIFICATION: ${activeCase.disease}
SEQUENCED PANEL: ${activeCase.panel}
INSTRUMENT METRICS: ${activeCase.instrument}

PRIMARY ONCOGENIC DRIVER ACTIONS DETECTED:
${actionableVariants.map(v => `- GENE ${v.gene}: ${v.ntChange} (${v.aaChange}) - VAF ${v.fraction}% - ${v.clinVarInterpretation}`).join('\n')}

VUS CLINICAL FINDINGS:
${vusVariants.map(v => `- GENE ${v.gene}: ${v.ntChange} (${v.aaChange}) - VAF ${v.fraction}%`).join('\n')}

LABORATORY INTERPRETATION DIRECTIVE:
${labComments}
    `);
    alert("Copied raw NGS clinical summary payload to clipboard successfully.");
  };

  return (
    <div className="flex-1 bg-white dark:bg-[#1a2332] border border-[#c0c7d6] rounded-lg shadow-md p-6 max-h-[calc(100vh-170px)] overflow-y-auto custom-scrollbar flex flex-col gap-6 printable-region">
      
      {/* Report Dashboard Controls Block */}
      <div className="flex justify-between items-center bg-[#f5f3f3] dark:bg-slate-800 p-3 rounded border border-[#c0c7d6] shrink-0 no-print">
        <div className="flex items-center gap-2 text-[12px] font-bold text-slate-700 dark:text-slate-200">
          <FileText className="h-4.5 w-4.5 text-[#005daa] dark:text-sky-400" />
          <span>Diagnostic PDF Draft Actions</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="bg-white hover:bg-slate-100 text-slate-700 border border-[#c0c7d6] px-3.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Clipboard className="h-4.5 w-4.5 text-slate-500" />
            Copy Plain Text List
          </button>
          
          <button
            onClick={handlePrint}
            className="bg-[#005daa] hover:bg-[#0075d5] text-white px-4 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all select-none cursor-pointer"
          >
            <Printer className="h-4.5 w-4.5" />
            Print Case PDF Report
          </button>
        </div>
      </div>

      {/* Dynamic Pathologist Warning for Unresolved Artifact Risk in Active Draft */}
      {activeVariantsWithRisk.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-500 rounded-lg p-4 dark:bg-amber-950/20 text-slate-900 dark:text-slate-100 flex items-start gap-3.5 shadow-md no-print animate-pulse shrink-0">
          <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-[12px]">
            <h4 className="font-extrabold text-amber-900 dark:text-amber-400 text-[13px] uppercase tracking-wider flex items-center gap-1.5">
              <span>SEQUENCING QA ALERT: HIGH FALSE-POSITIVE RISK DETECTED IN ACTIVE DRAFT</span>
            </h4>
            <p className="mt-1 leading-relaxed text-slate-650 dark:text-slate-300 font-medium">
              This clinical report currently holds <strong>{activeVariantsWithRisk.length} active variant(s)</strong> that match high-risk background noise or sequencer artifact signatures (VAF under 5%, excessive sample recurrence in run batch, or homopolymer tract). patholgoists and lab directors should exclude these from formal diagnostic report or ensure Sanger confirmation.
            </p>
            
            <div className="mt-3 flex flex-col gap-2 bg-amber-100/50 dark:bg-black/20 p-2.5 rounded border border-amber-300">
              {activeVariantsWithRisk.map(v => {
                const rDetails = evaluateArtifactRisk(v);
                return (
                  <div key={v.id} className="flex justify-between items-center bg-white/90 dark:bg-slate-900/40 p-2 px-3 rounded text-[11px] font-bold border border-amber-250 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-red-650 font-black">{v.gene} ({v.ntChange}, {v.aaChange})</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-500 font-mono font-medium">VAF {v.fraction}% | `sameInRun` {v.sameInRun} reps</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-amber-705 font-medium italic">{rDetails.reasons[0]}</span>
                    </div>
                    <button
                      onClick={() => {
                        onUpdateVariant(v.id, { filterStatus: 'False', tier: 'False' });
                        onAddLogEntry(
                          v.id,
                          'ACMG Mutation Tier lock',
                          'Cohort consensus: Declared sequence/alignment false positive artifact.',
                          v.tier,
                          'False'
                        );
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-black px-2.5 py-1 text-[9.5px] rounded cursor-pointer transition-colors shadow-sm uppercase tracking-tight"
                    >
                      Exclude Locus Now
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Actual Certificate Document Style Frame */}
      <div className="border border-slate-300 dark:border-slate-700 p-8 rounded-md bg-white dark:bg-[#111827] text-slate-900 dark:text-white relative shadow-sm flex flex-col gap-5">
        
        {/* Document watermark style header */}
        <div className="flex justify-between items-start border-b-2 border-[#1b1c1c] pb-4">
          <div className="flex items-center gap-2">
            <Layers className="text-[#005daa] dark:text-[#a5c8ff] h-8 w-8 text-[#005daa]" />
            <div>
              <h1 className="text-[20px] font-extrabold tracking-tight text-[#005daa] dark:text-[#a5c8ff] italic">
                KBB-NGAS DIAGNOSTIC LABS
              </h1>
              <span className="text-[9.5px] uppercase tracking-wider font-semibold text-slate-400">Next-Generation Clinical Genomics Laboratories</span>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-500 font-medium">
            <div>REQUISITION ID: REF-{Date.now().toString().substring(7)}</div>
            <div>BATCH RUN: {activeCase.run.substring(0, 12)}...</div>
          </div>
        </div>

        {/* Clinical Specimen Metadata Details */}
        <div className="bg-[#f5f3f3] dark:bg-[#1f2937] p-3.5 rounded border border-[#eae8e7] dark:border-slate-850 grid grid-cols-2 lg:grid-cols-4 gap-4 text-[11.5px]">
          <div>
            <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Patient Case Identifier</span>
            <strong className="text-[13px] text-slate-800 dark:text-white font-extrabold font-mono">{activeCase.id}</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Presenting Disease Class</span>
            <span className="font-semibold">{activeCase.disease}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Sequenced Core Panel</span>
            <span className="font-semibold">{activeCase.panel}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Instrument Config</span>
            <span className="font-semibold font-mono">{activeCase.instrument}</span>
          </div>
        </div>

        {/* Finding table section */}
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[12.5px] font-bold text-[#005daa] dark:text-[#a5c8ff] uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-205 dark:border-slate-800 pb-1.5">
            <HeartCrack className="h-4 w-4 text-red-500" />
            <span>Primary Somatic Variants Identified</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-slate-350 dark:border-slate-810 font-bold bg-[#eae8e7]/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <th className="py-2 px-3">Locus Labeled Gene</th>
                  <th className="py-2 px-3 tracking-tight font-mono">cDNA Mutation</th>
                  <th className="py-2 px-3 tracking-tight font-mono">Protein Translation</th>
                  <th className="py-2 px-3 text-right">Fraction (VAF %)</th>
                  <th className="py-2 px-3 text-right">Sample Depth</th>
                  <th className="py-2 px-3 text-center">Pathogenicity Status</th>
                  <th className="py-2 px-3 text-center no-print">Review Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eae8e7] dark:divide-slate-800 font-medium">
                {actionableVariants.map((v) => {
                  const risk = evaluateArtifactRisk(v);
                  return (
                    <tr 
                      key={v.id} 
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        risk.isRisk 
                          ? 'bg-amber-100/60 dark:bg-amber-950/20 border-l-4 border-l-amber-500 font-bold' 
                          : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-[#005daa] dark:text-sky-350">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold">{v.gene}</span>
                          {risk.isRisk && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8.5px] bg-red-650 text-white font-black tracking-tighter leading-none rounded animate-pulse shadow-sm">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              <span>FP RISK</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{v.ntChange}</td>
                      <td className="py-2.5 px-3 font-mono truncate max-w-[150px]">{v.protein}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-red-650">{v.fraction}%</td>
                      <td className="py-2.5 px-3 text-right font-mono">{v.depth}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-red-50/70 border border-red-200 text-red-700 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full">
                          {v.clinVarInterpretation}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={v.tier}
                            onChange={(e) => {
                              const val = e.target.value;
                              onUpdateVariant(v.id, { tier: val as any, filterStatus: val as any });
                              onAddLogEntry(
                                v.id,
                                'ACMG Mutation Tier lock',
                                `Reclassified from Report: Assigned to ${val}`,
                                v.tier,
                                val
                              );
                            }}
                            className="bg-white dark:bg-slate-800 border border-[#c0c7d6] text-slate-800 dark:text-slate-100 rounded text-[10.5px] font-bold p-0.5 px-1 focus:outline-none"
                          >
                            <option value="T1">Tier I</option>
                            <option value="T2">Tier II</option>
                            <option value="T3">Tier III</option>
                            <option value="T4">Tier IV</option>
                          </select>
                          <button
                            onClick={() => {
                              onUpdateVariant(v.id, { filterStatus: 'False', tier: 'False' });
                              onAddLogEntry(
                                v.id,
                                'ACMG Mutation Tier lock',
                                'Cohort consensus: Declared sequence/alignment false positive artifact.',
                                v.tier,
                                'False'
                              );
                            }}
                            className={`px-2.5 py-0.5 rounded text-[10px] font-black cursor-pointer transition-all duration-300 ${
                              risk.isRisk 
                                ? 'bg-red-600 text-white border border-red-500 hover:bg-red-700 animate-pulse shadow-md ring-1 ring-red-350' 
                                : 'bg-red-55 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-900'
                            }`}
                          >
                            Exclude
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* VUS findings summary section */}
        {vusVariants.length > 0 && (
          <div className="flex flex-col gap-2 pt-2">
            <h3 className="text-[11.5px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-1 flex items-center gap-1">
              <span>Variants of Unknown Significance (VUS) findings</span>
            </h3>
            <div className="text-[11.5px] grid grid-cols-1 md:grid-cols-2 gap-3">
              {vusVariants.map((v) => {
                const risk = evaluateArtifactRisk(v);
                return (
                  <div 
                    key={v.id} 
                    className={`p-2.5 border rounded flex items-center justify-between transition-colors ${
                      risk.isRisk 
                        ? 'bg-amber-100/65 dark:bg-amber-950/20 border-amber-400 font-semibold' 
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="font-bold text-slate-850 dark:text-white flex items-center gap-1.5 flex-wrap">
                      <span>{v.gene}</span> 
                      <span className="font-mono text-slate-450 dark:text-slate-450 font-normal">{v.ntChange}</span>
                      {risk.isRisk && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8.5px] bg-red-650 text-white rounded font-black tracking-tighter leading-none animate-pulse">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          <span>FP RISK</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[11px] font-mono font-medium text-slate-500">
                        VAF {v.fraction}% | Depth: {v.depth} rds
                      </div>
                      {/* Quick review controls */}
                      <div className="no-print flex items-center gap-1">
                        <select
                          value={v.tier}
                          onChange={(e) => {
                            const val = e.target.value;
                            onUpdateVariant(v.id, { tier: val as any, filterStatus: val as any });
                            onAddLogEntry(
                              v.id,
                              'ACMG Mutation Tier lock',
                              `Reclassified VUS from Report: Assigned to ${val}`,
                              v.tier,
                              val
                            );
                          }}
                          className="bg-white dark:bg-slate-800 border border-[#c0c7d6] text-slate-800 dark:text-slate-100 rounded text-[10px] font-bold p-0.5 px-1 focus:outline-none"
                        >
                          <option value="T1">Tier I</option>
                          <option value="T2">Tier II</option>
                          <option value="T3">Tier III</option>
                          <option value="T4">Tier IV</option>
                        </select>
                        <button
                          onClick={() => {
                            onUpdateVariant(v.id, { filterStatus: 'False', tier: 'False' });
                            onAddLogEntry(
                              v.id,
                              'ACMG Mutation Tier lock',
                              'Cohort consensus: Declared sequence/alignment false positive artifact.',
                              v.tier,
                              'False'
                            );
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black cursor-pointer transition-all duration-300 ${
                            risk.isRisk 
                              ? 'bg-red-600 text-white border-red-500 hover:bg-red-700 animate-pulse shadow-sm ring-1 ring-red-300' 
                              : 'bg-red-55 text-red-650 hover:bg-red-100 border border-red-200'
                          }`}
                        >
                          Exclude
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Excluded Variants section (Internal review only, hidden on print) */}
        {excludedVariants.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-805 no-print">
            <h3 className="text-[11.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-1 flex items-center justify-between">
              <span>Excluded Variants (False Positives / Artifacts)</span>
              <span className="bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-350 px-2 py-0.5 text-[10px] font-mono rounded font-bold">
                {excludedVariants.length} Excluded
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {excludedVariants.map((v) => (
                <div key={v.id} className="p-2.5 border border-dashed border-slate-300 dark:border-slate-800 rounded bg-slate-50/20 dark:bg-slate-900/10 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-slate-700 dark:text-gray-300">{v.gene}</span>
                    <span className="font-mono text-slate-400 ml-1.5 text-[11px]">{v.ntChange} ({v.aaChange})</span>
                    <span className="block text-[9px] text-red-500 font-extrabold uppercase mt-0.5 font-mono">False Positive Artifact</span>
                  </div>
                  <button
                    onClick={() => {
                      onUpdateVariant(v.id, { tier: 'T1', filterStatus: 'T1' });
                      onAddLogEntry(
                        v.id,
                        'ACMG Mutation Tier lock',
                        'Re-included: Reverted False Positive declaration and mapped to Tier I.',
                        'False',
                        'T1'
                      );
                    }}
                    className="bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-[#c0c7d6] text-slate-700 dark:text-slate-200 p-1 px-2.5 rounded text-[10.5px] font-bold cursor-pointer transition-colors"
                  >
                    Restore (Tier I)
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clinical Laboratory Interpretation Field */}
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-200 no-print">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Director Interpretation & Annotation drafting area:
          </label>
          <textarea
            rows={3}
            value={labComments}
            onChange={(e) => setLabComments(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-850 border border-[#c0c7d6] rounded p-2 text-[12px] leading-relaxed text-slate-850 dark:text-white font-medium"
          />
        </div>

        {/* Document printed comments (visible on printing) */}
        <div className="hidden show-on-print flex flex-col gap-1.5 border border-slate-400 p-4 rounded bg-slate-50 text-[11.5px] leading-relaxed italic">
          <span className="font-extrabold text-[10px] uppercase tracking-wider font-bold text-slate-500">Laboratory Interpretation Summary Statement</span>
          <p>{labComments}</p>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-end border-t border-slate-200 pt-8 mt-5">
          <div className="text-[10px] text-slate-400 leading-normal">
            <div>KBB-NGAS Pipeline Engine Analysis Verified</div>
            <div>ISO 15189 Clinically Validated Automation Model</div>
          </div>
          
          <div className="flex flex-col items-center select-none">
            {directorDraftSigned ? (
              <div className="text-[15px] font-mono italic text-indigo-600 font-extrabold rotate-[-2deg] border border-dashed border-indigo-600 p-1 px-3 mb-1.5 animate-bounce">
                whopark@gmail.com
              </div>
            ) : (
              <button
                onClick={() => setDirectorDraftSigned(true)}
                className="bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 text-[#005daa] border border-[#005daa] text-[10.5px] font-bold px-3 py-1 rounded mb-2.5 transition-all outline-dashed outline-1 outline-offset-2 hover:scale-105 no-print"
              >
                Sign Draft Report
              </button>
            )}
            <div className="h-px w-[160px] bg-slate-600"></div>
            <div className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-350 text-center mt-1">
              Pathology Laboratory Director
            </div>
            <span className="text-[9px] text-slate-400">LMS Clinical Administration Signature Lock</span>
          </div>
        </div>

      </div>

    </div>
  );
}
