/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Download, ExternalLink, HelpCircle, History, Plus, Sparkles, Wand2, RefreshCw } from 'lucide-react';
import { Variant, InterpretationLogEntry } from '../types';
import { INITIAL_LOG_ENTRIES } from '../data';

interface VariantDetailAccordionProps {
  variant: Variant;
}

export default function VariantDetailAccordion({ variant }: VariantDetailAccordionProps) {
  // Collapsed sections management
  const [detailOpen, setDetailOpen] = useState(true);
  const [interpretationOpen, setInterpretationOpen] = useState(false);
  const [statisticsOpen, setStatisticsOpen] = useState(true);
  const [logsOpen, setLogsOpen] = useState(true);
  const [linksOpen, setLinksOpen] = useState(true);

  // Interpretation logs state, backed by localStorage
  const [logEntries, setLogEntries] = useState<InterpretationLogEntry[]>([]);
  const [newLogModalOpen, setNewLogModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newType, setNewType] = useState('Diagnostic Annotation');
  const [newUser, setNewUser] = useState('Dr. whopark@gmail.com (Pathologist)');
  const [newPrevious, setNewPrevious] = useState('Pending');
  const [newCurrent, setNewCurrent] = useState('ACMG Pathogenic Tier 1');

  // AI Assistant section state
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  // Initialize logs on load
  useEffect(() => {
    const cached = localStorage.getItem('ngene_logs');
    if (cached) {
      try {
        setLogEntries(JSON.parse(cached));
      } catch (e) {
        setLogEntries(INITIAL_LOG_ENTRIES);
      }
    } else {
      setLogEntries(INITIAL_LOG_ENTRIES);
      localStorage.setItem('ngene_logs', JSON.stringify(INITIAL_LOG_ENTRIES));
    }
  }, []);

  // Filter logs for active variant
  const activeLogs = logEntries.filter(log => log.variantId === variant.id);

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const newLogItem: InterpretationLogEntry = {
      id: 'log_' + Date.now(),
      variantId: variant.id,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: newType,
      user: newUser,
      previous: newPrevious,
      current: newCurrent,
      comment: newComment,
    };

    const updated = [newLogItem, ...logEntries];
    setLogEntries(updated);
    localStorage.setItem('ngene_logs', JSON.stringify(updated));
    setNewComment('');
    setNewLogModalOpen(false);
  };

  // Simulated advanced AI synthesis for ACMG Criteria
  const triggerAiGenomicsAssistant = () => {
    setIsAiGenerating(true);
    setInterpretationOpen(true);
    setTimeout(() => {
      const criteriaText = `[ACMG CLINICAL EVALUATION REQUISITION FOR CELL LINE]
MUTATION: ${variant.gene} (${variant.ntChange}, ${variant.aaChange})
CHR-POS: ${variant.genomeGRCh37}

1. PATHOLOGIC MUTATIONAL PROFILE (ACMG Standard Evidence Classifiers):
   * PS1 (Strong): Same amino acid change previously established as Pathogenic. ClinVar entry #${variant.clinVarId} confirms diagnostic association.
   * PM2 (Moderate): Absent or extremely low frequency in large-scale controls (gnomAD Frequency observed: ${variant.freqGnomAD || 'None'}).
   * PP3 (Supporting): High-fidelity computational algorithms (SIFT, PolyPhen, REVEL) match damaging predictions with scores > 0.92.

2. PHENOTYPE ASSOCIATIONAL RELEVANCE:
   ${variant.gene} is a validated driver implicated in Hematologic malignancy, typically impacting genomic methylation patterns and cellular differentiation pathways.

3. PATIENT SPECIFIC COHORT ALIGNMENT (Local Run Databank):
   This variant was identified in other panels within active project batches. High allele frequency (${variant.fraction}%) provides absolute evidence of true clinical heterozygosity rather than mosaicism bias.

RECOMMENDATION: Classify as ACMG PATHOGENIC Tier I. Patient mutation aligns with somatic target options. Refer to active clinical trials.`;
      
      setAiAnalysisResult(criteriaText);
      setIsAiGenerating(false);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#1a2332] p-6 max-h-[calc(100vh-170px)] overflow-y-auto custom-scrollbar shadow-md rounded-lg gap-5">
      <div className="flex items-center justify-between border-b border-[#eae8e7] dark:border-slate-800 pb-2">
        <h2 className="text-[20px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
          {variant.gene}:{variant.aaChange} <span className="text-[12px] font-mono text-slate-400">({variant.ntChange})</span>
        </h2>
        
        <button
          onClick={triggerAiGenomicsAssistant}
          className="bg-purple-650 hover:bg-purple-700 bg-[#7c3aed] text-white px-3.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-all animate-bounce"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>ACMG Gemini AI Clinician</span>
        </button>
      </div>

      {/* Accordion List */}
      <div className="flex flex-col gap-3">
        
        {/* Section 1: Variant Detail */}
        <div className="border border-[#c0c7d6] rounded-lg bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <button
            onClick={() => setDetailOpen(!detailOpen)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-850 hover:bg-[#eae8e7] dark:hover:bg-slate-800 transition-colors text-left font-bold"
          >
            <div className="flex items-center gap-2 text-[#005daa] dark:text-[#a5c8ff]">
              {detailOpen ? <ChevronDown className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
              <span className="text-[12px] uppercase tracking-wider">Variant Detail Specifications</span>
            </div>
          </button>

          {detailOpen && (
            <div className="p-5 border-t border-[#c0c7d6] flex flex-wrap gap-10">
              
              {/* Gauges Column */}
              <div className="flex gap-8 shrink-0">
                
                {/* Reads Depth Gauge */}
                <div className="flex flex-col items-center">
                  <div className="text-[9.5px] font-extrabold tracking-widest text-slate-500 uppercase mb-0.5">READS DEPTH</div>
                  <div className="text-[9px] text-slate-400 mb-1.5">MAX {variant.maxDepth}</div>
                  <div className="relative h-[110px] w-[16px] bg-slate-100 dark:bg-slate-800 border border-[#c0c7d6] rounded-sm flex flex-col justify-end overflow-hidden">
                    {/* Visualizing ratio height */}
                    <div 
                      className="bg-[#707785] dark:bg-slate-500 w-full"
                      style={{ height: `${Math.min(100, (variant.depth / variant.maxDepth) * 100)}%` }}
                    />
                  </div>
                  {/* Absolute Pointer Marker Tag */}
                  <div className="bg-[#404753] text-white text-[10.5px] font-bold px-1.5 py-0.5 rounded shadow-md relative -mt-[45px] -ml-[65px] z-15 flex items-center gap-1 font-mono">
                    <span>{variant.depth}</span>
                    <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-[4px] border-y-transparent border-l-[4px] border-l-[#404753]"></div>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1.5">MIN {variant.minDepth}</div>
                  <div className="text-[10px] text-slate-500 mt-1.5">mean</div>
                  <div className="text-[14px] font-extrabold text-slate-800 dark:text-white font-mono">{variant.meanDepth}</div>
                </div>

                {/* Variant Fraction Gauge */}
                <div className="flex flex-col items-center">
                  <div className="text-[9.5px] font-extrabold tracking-widest text-slate-500 uppercase mb-0.5">FRACTION</div>
                  <div className="text-[9px] text-slate-400 mb-1.5">100 %</div>
                  <div className="relative h-[110px] w-[16px] bg-slate-100 dark:bg-slate-800 border border-[#c0c7d6] rounded-sm flex flex-col justify-end overflow-hidden">
                    <div 
                      className="bg-[#cf1322] w-full"
                      style={{ height: `${variant.fraction}%` }}
                    />
                  </div>
                  {/* Tags */}
                  <div className="bg-[#cf1322] text-white text-[10.5px] font-bold px-1.5 py-0.5 rounded shadow-md relative -mt-[18px] ml-[70px] z-15 flex items-center font-mono">
                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-[4px] border-y-transparent border-r-[4px] border-r-[#cf1322]"></div>
                    <span>{variant.fraction.toFixed(2)}%</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1.5">0 %</div>
                  <div className="text-[10px] text-[#cf1322] font-extrabold mt-1 flex items-center gap-0.5">
                    <span className="font-mono text-[13px]">{variant.altSeqMutatedBase}</span>
                    <span className="text-slate-400 font-normal">/{variant.refSeqMutatedBase}</span>
                  </div>
                </div>

              </div>

              {/* Alignment details Column */}
              <div className="flex-1 min-w-[280px]">
                <div className="text-[9.5px] font-extrabold tracking-widest text-slate-500 uppercase mb-3 text-center">SEQUENCE VARIANT ALIGNMENT</div>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-[11px] text-slate-500">RefSeq Transcript:</span>
                  <select defaultValue={variant.transcript} className="bg-slate-100 dark:bg-slate-800 border border-[#c0c7d6] rounded px-2 py-0.5 text-[11.5px] font-semibold text-slate-700 dark:text-white">
                    <option>{variant.transcript}</option>
                    <option>Ensembl: ENST00000300305</option>
                  </select>
                </div>

                {/* Simulated dynamic coordinate visual alignment rendering */}
                <div className="relative py-3.5 mb-4 flex flex-col items-center bg-slate-50 dark:bg-slate-850 rounded border border-[#eae8e7] dark:border-slate-800">
                  <div className="text-[11px] text-slate-400 font-mono tracking-tight font-semibold">{variant.startPos}</div>
                  <div className="h-3 border-l border-slate-400 my-0.5"></div>
                  
                  {/* Aligned standard genome sequence display */}
                  <div className="font-mono text-[11px] tracking-widest text-slate-600 dark:text-slate-300 text-center font-medium bg-[#efeded] dark:bg-slate-800 px-3 py-1 rounded">
                    {variant.refSeqContext.split(' ').map((segment, i) => {
                      if (i === 1) { // Mutated base position
                        return <span key={i} className="text-[#cf1322] bg-red-100 dark:bg-red-900/40 px-1 font-extrabold scale-110 inline-block">{segment}</span>;
                      }
                      return <span key={i}>{segment}</span>;
                    })}
                  </div>

                  <div className="h-3 border-l border-[#cf1322] my-0.5"></div>
                  <div className="text-[#cf1322] font-mono text-[11.5px] flex flex-col items-center font-extrabold">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400">MUTATED BASE</span>
                    <span>{variant.altSeqMutatedBase}</span>
                  </div>
                </div>

                {/* Nomenclature list mapping */}
                <div className="grid grid-cols-[110px_1fr] gap-y-2 text-[11.5px] border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="text-slate-400 font-bold text-right pr-3">Gene Symbol</div>
                  <div className="text-slate-800 dark:text-white font-extrabold">{variant.gene}</div>
                  <div className="text-slate-400 font-bold text-right pr-3">HGVS Nucleotide</div>
                  <div className="text-slate-800 dark:text-white font-mono">{variant.transcript}:{variant.ntChange}</div>
                  <div className="text-slate-400 font-bold text-right pr-3">Protein Change</div>
                  <div className="text-slate-800 dark:text-white font-mono truncate hover:text-sky-500 transition-colors cursor-help" title={variant.protein}>{variant.protein}</div>
                  <div className="text-slate-400 font-bold text-right pr-3">Genome (GRCh37)</div>
                  <div className="text-slate-800 dark:text-white font-mono">{variant.genomeGRCh37}</div>
                </div>
              </div>

              {/* Frequencies Column */}
              <div className="flex-1 min-w-[200px] flex flex-col gap-4">
                <div>
                  <div className="text-[9.5px] font-extrabold tracking-widest text-[#005daa] dark:text-[#a5c8ff] uppercase mb-2 text-center">POPULATION FREQUENCIES</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                    <div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mb-0.5">
                        <span>1KGP</span>
                        <span className="font-mono">{variant.freq1KGP}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 border border-[#c0c7d6] rounded-sm overflow-hidden flex">
                        {variant.freq1KGP !== '-' && <div className="bg-[#4d6077]" style={{ width: '15%' }} />}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mb-0.5">
                        <span>gnomAD</span>
                        <span className="font-mono font-bold">{variant.freqGnomAD}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 border border-[#c0c7d6] rounded-sm overflow-hidden flex">
                        {variant.freqGnomAD !== '-' && <div className="bg-[#1890ff]" style={{ width: '25%' }} />}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mb-0.5">
                        <span>ExAC</span>
                        <span className="font-mono font-bold">{variant.freqExAC}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 border border-[#c0c7d6] rounded-sm overflow-hidden flex">
                        {variant.freqExAC !== '-' && <div className="bg-[#1890ff]" style={{ width: '30%' }} />}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mb-0.5">
                        <span>KRGDB</span>
                        <span className="font-mono">{variant.freqKRGDB}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 border border-[#c0c7d6] rounded-sm overflow-hidden" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Section 2: Clinical External Links */}
        <div className="border border-[#c0c7d6] rounded-lg bg-white dark:bg-slate-900 shadow-sm overflow-hidden animate-fade-in">
          <button
            onClick={() => setLinksOpen(!linksOpen)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-850 hover:bg-[#eae8e7] dark:hover:bg-slate-800 transition-colors text-left font-bold"
          >
            <div className="flex items-center gap-2 text-[#005daa] dark:text-[#a5c8ff]">
              {linksOpen ? <ChevronDown className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
              <span className="text-[12px] uppercase tracking-wider">Clinical External Links</span>
            </div>
          </button>

          {linksOpen && (
            <div className="p-4 border-t border-[#c0c7d6] bg-slate-50 dark:bg-slate-920 text-[11.5px] grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
              <a 
                href={`https://igv.org/web/release/current-app/?locus=${variant.chr}:${variant.startPos}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:bg-slate-100 dark:hover:bg-slate-800 p-2.5 rounded border border-[#c0c7d6] dark:border-slate-800 flex items-center justify-between transition-all bg-white dark:bg-slate-900 shadow-xs hover:border-[#005daa] text-slate-800 dark:text-slate-200 group group-hover:text-[#005daa]"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] font-bold text-[#005daa] dark:text-[#a5c8ff] group-hover:underline">Interactive IGV Locus View</span>
                  <span className="text-[10px] text-slate-450 dark:text-slate-400 font-normal">Visualize alignment dynamically in web browser</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 transition-colors group-hover:text-[#005daa]" />
              </a>
              <a 
                href={`https://www.google.com/search?q=${variant.gene}+${variant.aaChange}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:bg-slate-100 dark:hover:bg-slate-800 p-2.5 rounded border border-[#c0c7d6] dark:border-slate-800 flex items-center justify-between transition-all bg-white dark:bg-slate-900 shadow-xs hover:border-[#005daa] text-slate-800 dark:text-slate-200 group group-hover:text-[#005daa]"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] font-bold text-[#005daa] dark:text-[#a5c8ff] group-hover:underline">Google Scholar Search</span>
                  <span className="text-[10px] text-slate-450 dark:text-slate-400 font-normal">Search papers and publications for {variant.gene} {variant.aaChange}</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 transition-colors group-hover:text-[#005daa]" />
              </a>
              <a 
                href={`https://ncbi.nlm.nih.gov/snp/${variant.dbSnpId}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:bg-slate-100 dark:hover:bg-slate-800 p-2.5 rounded border border-[#c0c7d6] dark:border-slate-800 flex items-center justify-between transition-all bg-white dark:bg-[#1a2332] shadow-xs hover:border-[#005daa] text-slate-800 dark:text-slate-200 group group-hover:text-[#005daa]"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] font-bold text-[#005daa] dark:text-[#a5c8ff] group-hover:underline">NCBI dbSNP ({variant.dbSnpId})</span>
                  <span className="text-[10px] text-slate-450 dark:text-slate-400 font-normal">SNP reference record dashboard listing</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 transition-colors group-hover:text-[#005daa]" />
              </a>
              <a 
                href={`https://www.ncbi.nlm.nih.gov/clinvar/variation/${variant.clinVarId}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:bg-slate-100 dark:hover:bg-slate-800 p-2.5 rounded border border-[#c0c7d6] dark:border-slate-800 flex items-center justify-between transition-all bg-white dark:bg-[#1a2332] shadow-xs hover:border-[#005daa] text-slate-800 dark:text-slate-200 group group-hover:text-[#005daa]"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] font-bold text-[#005daa] dark:text-[#a5c8ff] group-hover:underline">ClinVar variation ({variant.clinVarId})</span>
                  <span className="text-[10px] text-slate-450 dark:text-slate-400 font-normal">Review ACMG alignments and public annotations</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 transition-colors group-hover:text-[#005daa]" />
              </a>
            </div>
          )}
        </div>

        {/* Section 3: Interpretation */}
        <div className="border border-[#c0c7d6] rounded-lg bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <button
            onClick={() => setInterpretationOpen(!interpretationOpen)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-850 hover:bg-[#eae8e7] dark:hover:bg-slate-800 transition-colors text-left font-bold"
          >
            <div className="flex items-center gap-2 text-[#005daa] dark:text-[#a5c8ff]">
              {interpretationOpen ? <ChevronDown className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
              <span className="text-[12px] uppercase tracking-wider">Clinician Annotation & Interpretation Guideline</span>
            </div>
          </button>

          {interpretationOpen && (
            <div className="p-4 border-t border-[#c0c7d6] bg-slate-50 dark:bg-slate-920 text-[12px]">
              <div className="flex items-center justify-between border-b border-slate-205 dark:border-slate-800 pb-2 mb-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Clinical Report Draft Summary</span>
                </div>
                <button
                  onClick={triggerAiGenomicsAssistant}
                  disabled={isAiGenerating}
                  className="bg-sky-50 dark:bg-slate-800 text-[#005daa] dark:text-sky-350 border border-[#005daa] font-bold text-[11px] px-3 py-1.5 rounded hover:bg-sky-100 transition-all flex items-center gap-1"
                >
                  {isAiGenerating ? (
                    <>
                      <Wand2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3.5 w-3.5 text-[#005daa] dark:text-sky-400" />
                      <span>Fetch AI Clinical Insight</span>
                    </>
                  )}
                </button>
              </div>

              {aiAnalysisResult ? (
                <div className="bg-purple-50/50 dark:bg-[#2c1d3a]/30 border border-purple-100 dark:border-purple-900/60 p-4 rounded text-[11.5px] font-mono leading-relaxed text-slate-800 dark:text-slate-200 shadow-inner max-h-[300px] overflow-auto whitespace-pre-wrap">
                  {aiAnalysisResult}
                </div>
              ) : (
                <div className="text-slate-500 text-center py-6">
                  <p className="mb-2">No clinical draft notes generated for variant <strong className="font-bold text-slate-700 dark:text-slate-350">{variant.gene}</strong>.</p>
                  <p className="text-[10.5px]">Click the button above to auto-generate a somatic classifier report draft powered by Gemini AI criteria guidelines.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 4: Statistics */}
        <div className="border border-[#c0c7d6] rounded-lg bg-white dark:bg-slate-900 shadow-sm overflow-hidden animate-fade-in">
          <div className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-850 hover:bg-[#eae8e7] dark:hover:bg-slate-800 transition-colors select-none">
            <button
              onClick={() => setStatisticsOpen(!statisticsOpen)}
              className="flex items-center gap-2 text-[#005daa] dark:text-[#a5c8ff] font-bold text-left text-[12px] uppercase tracking-wider grow cursor-pointer"
            >
              {statisticsOpen ? <ChevronDown className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
              <span>Clinical Cohort Statistics</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const url = `${window.location.origin}${window.location.pathname}?view=cohort&variantId=${variant.id}`;
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
              className="px-2 mr-1 py-1 h-[26px] text-[9px] font-black tracking-wide flex items-center gap-1 transition-all cursor-pointer rounded-sm bg-[#DFFF00] hover:bg-[#cbf700] text-slate-950 shadow-xs border border-slate-300"
              title="Open clinical cohort study visualization in a new browser window"
            >
              <ExternalLink className="h-2.5 w-2.5 text-slate-950" />
              <span>LAUNCH NEW WINDOW</span>
            </button>
          </div>

          {statisticsOpen && (
            <div className="p-5 border-t border-[#c0c7d6]">
              <div className="text-[12px] text-slate-800 dark:text-slate-200 font-bold mb-4 font-mono uppercase tracking-wide">
                LOCAL DATABASE ALIGNMENTS: {variant.gene} {variant.ntChange} {variant.aaChange}
              </div>

              {/* Flex Stack vertically so graphics never overlap inside narrow accordion */}
              <div className="flex flex-col gap-6 items-stretch w-full">
                
                {/* Visual donut charts loops */}
                <div className="flex flex-col items-center bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded border border-slate-100 dark:border-white/5">
                  <div className="text-[11.5px] font-bold text-slate-500 uppercase tracking-widest mb-4">Sample distribution</div>
                  <div className="flex justify-center gap-5 w-full">
                    
                    {/* Run Ring progress mock */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-[70px] h-[70px] rounded-full border-8 border-slate-100 dark:border-slate-800 flex items-center justify-center mb-2">
                        {/* Perfect custom SVG arc of 8% */}
                        <svg className="absolute top-[-8px] left-[-8px] w-[86px] h-[86px] -rotate-90">
                          <circle cx="43" cy="43" fill="none" r="35" stroke="#005daa" strokeDasharray="219.8" strokeDashoffset={`${219.8 - (219.8 * variant.runFraction) / 100}`} strokeWidth="8" strokeLinecap="round" />
                        </svg>
                        <span className="text-[11px] font-extrabold font-mono text-slate-800 dark:text-white">{variant.runFraction}%</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Run</div>
                      <div className="text-[10px] text-slate-500 font-mono font-medium">{variant.runRatio}</div>
                    </div>

                    {/* Panel Ring progress mock */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-[70px] h-[70px] rounded-full border-8 border-slate-100 dark:border-slate-800 flex items-center justify-center mb-2">
                        <svg className="absolute top-[-8px] left-[-8px] w-[86px] h-[86px] -rotate-90">
                          <circle cx="43" cy="43" fill="none" r="35" stroke="#005daa" strokeDasharray="219.8" strokeDashoffset={`${219.8 - (219.8 * variant.panelFraction) / 100}`} strokeWidth="8" strokeLinecap="round" />
                        </svg>
                        <span className="text-[11px] font-extrabold font-mono text-slate-800 dark:text-white">{variant.panelFraction}%</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Panel</div>
                      <div className="text-[10px] text-slate-500 font-mono font-medium">{variant.panelRatio}</div>
                    </div>

                    {/* Group Ring progress mock */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-[70px] h-[70px] rounded-full border-8 border-slate-100 dark:border-slate-800 flex items-center justify-center mb-2">
                        <svg className="absolute top-[-8px] left-[-8px] w-[86px] h-[86px] -rotate-90">
                          <circle cx="43" cy="43" fill="none" r="35" stroke="#005daa" strokeDasharray="219.8" strokeDashoffset={`${219.8 - (219.8 * variant.groupFraction) / 100}`} strokeWidth="8" strokeLinecap="round" />
                        </svg>
                        <span className="text-[11px] font-extrabold font-mono text-slate-800 dark:text-white">{variant.groupFraction}%</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Group</div>
                      <div className="text-[10px] text-slate-500 font-mono font-medium">{variant.groupRatio}</div>
                    </div>

                  </div>
                </div>

                {/* SVG Allele frequency bar histogram */}
                <div className="flex flex-col items-center w-full">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Variant Allele Frequency n=78</div>
                  <div className="relative w-full h-[140px] pl-6 pb-5 bg-slate-50 dark:bg-slate-850 p-2 rounded border border-slate-200 dark:border-slate-800">
                    {/* Y-Axis Line */}
                    <div className="absolute left-6 top-1 bottom-5 w-[1px] bg-slate-400" />
                    {/* X-Axis Line */}
                    <div className="absolute left-6 right-1 bottom-5 h-[1px] bg-slate-400" />
                    
                    {/* Y Labels */}
                    <span className="absolute left-0.5 top-1 text-[8.5px] font-mono text-slate-400">100</span>
                    <span className="absolute left-0.5 top-[25%] text-[8.5px] font-mono text-slate-400">60</span>
                    <span className="absolute left-0.5 top-[50%] text-[8.5px] font-mono text-slate-400">40</span>
                    <span className="absolute left-0.5 top-[75%] text-[8.5px] font-mono text-slate-400">20</span>
                    <span className="absolute left-0.5 bottom-5 translate-y-1.5 text-[8.5px] font-mono text-slate-400">0</span>
                    
                    {/* Graph Bars */}
                    <div className="absolute left-[15%] bottom-5 w-[8%] h-[20%] bg-[#5d729d] rounded-t-xs hover:bg-[#005daa] transition-all cursor-help" title="VAF 0-15: 14 samples" />
                    <div className="absolute left-[27%] bottom-5 w-[8%] h-[6%] bg-[#5d729d] rounded-t-xs hover:bg-[#005daa] transition-all" />
                    <div className="absolute left-[39%] bottom-5 w-[8%] h-[4%] bg-[#5d729d] rounded-t-xs hover:bg-[#005daa] transition-all" />
                    <div className="absolute left-[51%] bottom-5 w-[8%] h-[25%] bg-[#5d729d] rounded-t-xs hover:bg-[#005daa] transition-all cursor-help" title="VAF 45-60: 19 samples (highest density)" />
                    <div className="absolute left-[63%] bottom-5 w-[8%] h-[55%] bg-[#5d729d] rounded-t-xs hover:bg-[#005daa] transition-all cursor-help" title="VAF 60-75: 42 samples" />
                    <div className="absolute left-[75%] bottom-5 w-[8%] h-[10%] bg-[#5d729d] rounded-t-xs hover:bg-[#005daa] transition-all" />
                    <div className="absolute left-[87%] bottom-5 w-[8%] h-[3%] bg-[#5d729d] rounded-t-xs" />

                    {/* X Labels */}
                    <span className="absolute left-[19%] bottom-1 text-[8.5px] font-mono text-slate-400">0</span>
                    <span className="absolute left-[31%] bottom-1 text-[8.5px] font-mono text-slate-400">20</span>
                    <span className="absolute left-[43%] bottom-1 text-[8.5px] font-mono text-slate-400">40</span>
                    <span className="absolute left-[55%] bottom-1 text-[8.5px] font-mono text-slate-400">60</span>
                    <span className="absolute left-[67%] bottom-1 text-[8.5px] font-mono text-slate-400">80</span>
                    <span className="absolute left-[79%] bottom-1 text-[8.5px] font-mono text-slate-400">100</span>
                    <span className="absolute right-1 bottom-1 text-[8.5px] font-mono text-[#005daa] font-semibold">(vaf %)</span>
                  </div>
                </div>

                {/* Segmented interpretation Pathogenicity circular donut */}
                <div className="flex flex-col items-center bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded border border-slate-100 dark:border-white/5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">ACMG Classification (n=78)</div>
                  <div className="relative w-[110px] h-[110px]">
                    <svg className="w-full h-full -rotate-90">
                      {/* Crimson pathogenic chunk */}
                      <circle cx="55" cy="55" fill="none" r="42" stroke="#cd3b54" strokeDasharray="263.8" strokeDashoffset="45" strokeWidth="16" />
                      {/* Orange likely pathogenic chunk */}
                      <circle cx="55" cy="55" fill="none" r="42" stroke="#fa8c16" strokeDasharray="263.8" strokeDashoffset="210" strokeWidth="16" transform="rotate(45 55 55)" />
                      {/* Golden VUS chunk */}
                      <circle cx="55" cy="55" fill="none" r="42" stroke="#faad14" strokeDasharray="263.8" strokeDashoffset="245" strokeWidth="16" transform="rotate(210 55 55)" />
                    </svg>
                    {/* Inner cutout */}
                    <div className="absolute inset-0 m-auto w-[52px] h-[52px] bg-white dark:bg-slate-900 rounded-full flex flex-col items-center justify-center">
                      <span className="text-[13px] font-extrabold text-slate-800 dark:text-white font-mono">75%</span>
                      <span className="text-[7.5px] text-slate-400 uppercase tracking-wider font-bold">Pathogenic</span>
                    </div>
                  </div>
                  {/* Legend guide */}
                  <div className="flex gap-4 mt-2.5 text-[9.5px] font-bold">
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#cd3b54]" /><span>Pathogenic</span></div>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#fa8c16]" /><span>Likely Pathogenic</span></div>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#faad14]" /><span>VUS</span></div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Section 5: Interpretation Log */}
        <div className="border border-[#c0c7d6] rounded-lg bg-white dark:bg-slate-900 shadow-sm overflow-hidden mb-5">
          <button
            onClick={() => setLogsOpen(!logsOpen)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-850 hover:bg-[#eae8e7] dark:hover:bg-slate-800 transition-colors text-left font-bold"
          >
            <div className="flex items-center gap-2 text-[#005daa] dark:text-[#a5c8ff]">
              {logsOpen ? <ChevronDown className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
              <span className="text-[12px] uppercase tracking-wider">Clinical Interpretation History Log</span>
            </div>
          </button>

          {logsOpen && (
            <div className="p-4 border-t border-[#c0c7d6]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11.5px]">
                  <thead>
                    <tr className="border-b border-[#c0c7d6] text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2 px-2 w-[15%]">Date</th>
                      <th className="py-2 px-2 w-[15%]">Type</th>
                      <th className="py-2 px-2 w-[20%]">User</th>
                      <th className="py-2 px-2 w-[12%]">Previous</th>
                      <th className="py-2 px-2 w-[12%]">Current</th>
                      <th className="py-2 px-2 w-[21%]">Comment</th>
                      <th className="py-2.5 px-2 w-[5%] text-right">
                        <button
                          onClick={() => setNewLogModalOpen(true)}
                          className="bg-[#cde1fd] hover:bg-[#b4c8e3] text-[#005daa] p-1 rounded-sm border border-[#c0c7d6] flex items-center justify-center ml-auto transition-all cursor-pointer"
                          title="Add Clinical Annotation Entry"
                        >
                          <Plus className="h-3.5 w-3.5 text-[#005daa]" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eae8e7] dark:divide-slate-800">
                    {activeLogs.length === 0 ? (
                      <tr>
                        <td className="py-10 text-center text-slate-500 font-bold bg-slate-50/20" colSpan={7}>
                          <div className="flex flex-col items-center justify-center gap-2 opacity-60">
                            <History className="h-8 w-8 text-slate-400" />
                            <span>No clinical annotations historical entries recorded for this variant locus.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      activeLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-2 text-slate-400 font-mono text-[10.5px] whitespace-nowrap">{log.date}</td>
                          <td className="py-2 px-2 font-semibold text-slate-600 dark:text-slate-350">{log.type}</td>
                          <td className="py-2 px-2 font-medium truncate max-w-[120px]" title={log.user}>{log.user}</td>
                          <td className="py-2 px-2 text-slate-500">{log.previous}</td>
                          <td className="py-2 px-2"><span className="bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-355 px-1.5 py-0.2 rounded-sm font-semibold">{log.current}</span></td>
                          <td className="py-2 px-2 text-slate-650 dark:text-slate-400 max-w-[150px] truncate" title={log.comment}>{log.comment}</td>
                          <td className="py-2 px-2"></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Add Log Modal/Overlay Dialog */}
      {newLogModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1a2332] border border-[#c0c7d6] rounded-lg shadow-2xl p-5 w-full max-w-[480px] animate-scale-up">
            <h3 className="text-[14px] font-extrabold text-slate-800 dark:text-white mb-3.5 flex items-center gap-1.5">
              <History className="h-4.5 w-4.5 text-[#005daa] dark:text-sky-400" />
              <span>Record Clinical Diagnostic Annotation</span>
            </h3>

            <form onSubmit={handleAddLog} className="flex flex-col gap-3.5 text-[12px]">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold">Annotation Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-850 border border-[#c0c7d6] rounded p-1.5 text-slate-800 dark:text-white"
                  >
                    <option>Diagnostic Annotation</option>
                    <option>Somatic Classification</option>
                    <option>ACMG Mutation Tier lock</option>
                    <option>Therapeutic Option Match</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold">Clinician Signature</label>
                  <input
                    type="text"
                    value={newUser}
                    onChange={(e) => setNewUser(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-850 border border-[#c0c7d6] rounded p-1.5 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold">Prior Review State</label>
                  <input
                    type="text"
                    value={newPrevious}
                    onChange={(e) => setNewPrevious(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-850 border border-[#c0c7d6] rounded p-1.5 text-slate-800 dark:text-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold">Asserted Class State</label>
                  <input
                    type="text"
                    value={newCurrent}
                    onChange={(e) => setNewCurrent(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-850 border border-[#c0c7d6] rounded p-1.5 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold">Clinician Diagnostic Annotation Comments</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter detailed genomic observations, disease literature alignments, and treatment recommendations..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-850 border border-[#c0c7d6] rounded p-2 text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewLogModalOpen(false)}
                  className="bg-[#eae8e7] text-slate-700 px-4 py-2 rounded text-[11px] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#005daa] text-white px-5 py-2 rounded text-[11px] font-bold hover:bg-[#0075d5] transition-all"
                >
                  Save Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
