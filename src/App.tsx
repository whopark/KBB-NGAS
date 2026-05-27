/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import TopNavBar from './components/TopNavBar';
import SampleCaseHeader from './components/SampleCaseHeader';
import VariantFilterSidebar from './components/VariantFilterSidebar';
import VariantTableGrid from './components/VariantTableGrid';
import VariantDetailAccordion from './components/VariantDetailAccordion';
import ReportGeneratorView from './components/ReportGeneratorView';
import VcfUploadModal from './components/VcfUploadModal';
import CohortWindowView from './components/CohortWindowView';
import { SAMPLE_CASES, SampleCase } from './data';
import { Variant, FilterState } from './types';
import { 
  Clipboard, 
  Activity, 
  CheckSquare, 
  Database, 
  Dna, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Users, 
  UserPlus, 
  FileCheck,
  Upload
} from 'lucide-react';

export default function App() {
  // Check if viewing standalone cohort window
  const queryParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const isCohortView = queryParams.get('view') === 'cohort';
  const urlVariantId = queryParams.get('variantId');

  // Navigation states
  const [activeRoute, setActiveRoute] = useState<string>('samples');
  const [cases, setCases] = useState<SampleCase[]>(() => {
    try {
      const cached = localStorage.getItem('ngene_imported_cases');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return [...SAMPLE_CASES, ...parsed];
        }
      }
    } catch (e) {
      console.warn("Failed parsing cached VCF cases:", e);
    }
    return SAMPLE_CASES;
  });
  const [activeCaseId, setActiveCaseId] = useState<string>(SAMPLE_CASES[0].id);
  const activeCase = cases.find(c => c.id === activeCaseId) || cases[0];

  const [activeVariantId, setActiveVariantId] = useState<string | null>(SAMPLE_CASES[0].variants[0]?.id || null);
  const activeVariant = activeCase.variants.find(v => v.id === activeVariantId) || null;

  const setActiveVariant = (v: Variant | null) => {
    setActiveVariantId(v ? v.id : null);
  };

  const [activeTab, setActiveTab] = useState<'variants' | 'report'>('variants');
  const [isVcfModalOpen, setIsVcfModalOpen] = useState(false);

  // Manage imported files securely
  const handleCaseImported = (newCase: SampleCase) => {
    setCases((prev) => {
      let updated;
      if (prev.some(c => c.id === newCase.id)) {
        newCase.id = `${newCase.id}_${Date.now().toString().slice(-4)}`;
      }
      updated = [...prev, newCase];
      
      try {
        // Only persist custom imported cases (not default ones) to keep cache light
        const importedOnly = updated.filter(c => !SAMPLE_CASES.some(sc => sc.id === c.id));
        localStorage.setItem('ngene_imported_cases', JSON.stringify(importedOnly));
      } catch (e) {
        console.warn("Failed caching imported cases:", e);
      }
      
      return updated;
    });
    setActiveCaseId(newCase.id);
    const defaultVariantId = newCase.variants.length > 0 ? newCase.variants[0].id : null;
    setActiveVariantId(defaultVariantId);
    setActiveRoute('samples');
    setActiveTab('variants');
    setCheckedVariants([]);
  };

  // Selection and collapsible state
  const [checkedVariants, setCheckedVariants] = useState<string[]>([]);

  // Early layout exit if rendering Cohort Window view
  if (isCohortView && urlVariantId) {
    return <CohortWindowView variantId={urlVariantId} />;
  }
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Interesting genes tracking
  const [interestingGenes, setInterestingGenes] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem('ngene_interesting_genes');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [showOnlyInteresting, setShowOnlyInteresting] = useState(false);
  const [showOnlyChecked, setShowOnlyChecked] = useState(false);

  const handleToggleInterestingGene = (gene: string) => {
    setInterestingGenes((prev) => {
      const updated = prev.includes(gene)
        ? prev.filter((g) => g !== gene)
        : [...prev, gene];
      localStorage.setItem('ngene_interesting_genes', JSON.stringify(updated));
      return updated;
    });
  };

  // Filter state
  const [filter, setFilter] = useState<FilterState>({
    selectedCategory: 'All',
    geneSearch: '',
    hgvsCSearch: '',
    hgvsPSearch: '',
  });

  // Handle clinical case changes and auto-highlight the first variant of the newly loaded patient
  const handleCaseChange = (newCase: SampleCase) => {
    setActiveCaseId(newCase.id);
    const defaultVariantId = newCase.variants.length > 0 ? newCase.variants[0].id : null;
    setActiveVariantId(defaultVariantId);
    setCheckedVariants([]);
  };

  const handleFilterChange = (updated: Partial<FilterState>) => {
    setFilter((prev) => ({ ...prev, ...updated }));
  };

  const onUpdateVariant = (variantId: string, updates: Partial<Variant>) => {
    setCases(prevCases => prevCases.map(c => {
      if (c.id === activeCase.id) {
        return {
          ...c,
          variants: c.variants.map(v => v.id === variantId ? { ...v, ...updates } : v)
        };
      }
      return c;
    }));
  };

  const onAddLogEntry = (variantId: string, type: string, comment: string, previousState: string, currentState: string) => {
    const cached = localStorage.getItem('ngene_logs');
    let logs = [];
    if (cached) {
      try { logs = JSON.parse(cached); } catch(e) { logs = []; }
    }
    const newLog = {
      id: 'log_' + Date.now(),
      variantId,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type,
      user: 'Dr. whopark@gmail.com (Pathologist)',
      previous: previousState,
      current: currentState,
      comment
    };
    const updated = [newLog, ...logs];
    localStorage.setItem('ngene_logs', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('ngene_logs_update'));
  };

  // Perform highly dynamic and precise genetic filtration mapping
  const filteredVariants = activeCase.variants.filter((v) => {
    // 0. Matches Show Only Checked filter
    if (showOnlyChecked && !checkedVariants.includes(v.id)) {
      return false;
    }
    // 0.1. Matches Show Only Interesting filter
    if (showOnlyInteresting && !interestingGenes.includes(v.gene)) {
      return false;
    }
    // 1. Matches Category filter
    if (filter.selectedCategory !== 'All') {
      if (filter.selectedCategory === 'None False') {
        if (v.filterStatus === 'False' || v.tier === 'False') {
          return false;
        }
      } else {
        if (v.filterStatus !== filter.selectedCategory && v.tier !== filter.selectedCategory) {
          return false;
        }
      }
    }
    // 2. Matches Gene search
    if (filter.geneSearch && !v.gene.toLowerCase().includes(filter.geneSearch.toLowerCase())) {
      return false;
    }
    // 3. Matches cDNA Nt changes search
    if (filter.hgvsCSearch && !v.ntChange.toLowerCase().includes(filter.hgvsCSearch.toLowerCase())) {
      return false;
    }
    // 4. Matches Amino Acid translation search
    if (filter.hgvsPSearch && !v.aaChange.toLowerCase().includes(filter.hgvsPSearch.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Multi-checkbox state managers
  const handleToggleCheck = (id: string) => {
    setCheckedVariants((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleCheckAll = () => {
    const allIds = filteredVariants.map((v) => v.id);
    const currentlyAllChecked = allIds.every((id) => checkedVariants.includes(id));
    if (currentlyAllChecked) {
      setCheckedVariants((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setCheckedVariants((prev) => [...new Set([...prev, ...allIds])]);
    }
  };

  const handleTriggerExcelDownload = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["GENE,TIER,VAF,CONSEQUENCE,NT_CHANGE,AA_CHANGE,CHR,POSITION", 
         ...filteredVariants.map(v => `${v.gene},${v.tier},${v.fraction}%,${v.consequence},${v.ntChange},${v.aaChange},${v.chr},${v.startPos}`)]
         .join("\n");
         
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KBB-NGAS_${activeCase.id}_variant_batch.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#fbf9f8] text-slate-800 dark:bg-[#0f172a] dark:text-white h-screen flex flex-col overflow-hidden relative">
      
      {/* Top Header navbar always active */}
      <TopNavBar 
        onNavClick={setActiveRoute} 
        activeRoute={activeRoute} 
        userEmail="whopark@gmail.com" 
      />

      {/* Primary layout canvas route routers */}
      {activeRoute === 'dashboard' ? (
        // DASHBOARD ROUTE
        <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
          <div className="bg-black text-white p-8 rounded-none border border-white/10 relative overflow-hidden">
            <div className="absolute right-6 top-6 text-white/5 font-mono text-[90px] font-black leading-none select-none tracking-tighter">
              VOL. 092
            </div>
            <span className="border border-[#DFFF00] text-[#DFFF00] px-3 py-0.5 text-[9px] uppercase tracking-widest font-black inline-block mb-3.5">
              DIAGNOSTIC WORKSPACE ACTIVE
            </span>
            <h2 className="text-[52px] font-black tracking-tight uppercase leading-none text-[#DFFF00] mb-2">
              DIGITAL CRAFT.
            </h2>
            <p className="text-[12.5px] text-white/70 max-w-2xl font-medium tracking-wide leading-relaxed">
              Secure automated next-generation genomics cohort pipeline. Track clinical somatic hotspot alignments, ACMG class criteria matrices, and pathological annotation logs inside our high-volume multi-sample database. Runs certified by PROJECT STUDIO&trade;.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-850 p-4 rounded-lg border border-[#c0c7d6] flex items-center gap-3 shadow-xs">
              <Database className="h-8 w-8 text-[#005daa] dark:text-sky-400" />
              <div>
                <span className="text-[10px] text-slate-450 uppercase block font-bold">Total Patient Files</span>
                <strong className="text-[18px] font-extrabold font-mono text-slate-800 dark:text-white">{cases.length} Cases</strong>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-850 p-4 rounded-lg border border-[#c0c7d6] flex items-center gap-3 shadow-xs">
              <Activity className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <span className="text-[10px] text-slate-450 uppercase block font-bold">Lanes Operational</span>
                <strong className="text-[18px] font-extrabold font-mono text-slate-800 dark:text-white">NextSeq 550Dx</strong>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-850 p-4 rounded-lg border border-[#c0c7d6] flex items-center gap-3 shadow-xs">
              <Clipboard className="h-8 w-8 text-amber-500" />
              <div>
                <span className="text-[10px] text-slate-450 uppercase block font-bold">Pipeline Diagnostics</span>
                <strong className="text-[18px] font-extrabold font-mono text-slate-800 dark:text-white">v1.9 Sovereign</strong>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-850 p-4 rounded-lg border border-[#c0c7d6] flex items-center gap-3 shadow-xs">
              <FileCheck className="h-8 w-8 text-purple-500 animate-pulse" />
              <div>
                <span className="text-[10px] text-slate-450 uppercase block font-bold">Classifications Drafted</span>
                <strong className="text-[18px] font-extrabold font-mono text-slate-800 dark:text-white">Somatic Tier I/II</strong>
              </div>
            </div>
          </div>

          {/* Quick Case List Summary table inside Dashboard */}
          <div className="bg-white dark:bg-slate-850 border border-[#c0c7d6] rounded-lg p-5">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
              <h3 className="text-[14px] font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                Active Patient Specimen Workloads
              </h3>
              <button
                onClick={() => setIsVcfModalOpen(true)}
                className="bg-red-650 hover:bg-red-700 text-white font-extrabold p-1 px-3 py-1.5 rounded text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm uppercase tracking-wide"
              >
                <Upload className="h-4 w-4 text-white" />
                <span>Upload Local VCF File</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-[#c0c7d6] text-slate-400 font-bold">
                    <th className="py-2.5 px-3">Case ID</th>
                    <th className="py-2.5 px-3 font-mono">Run ID</th>
                    <th className="py-2.5 px-3">Sequencing Panel</th>
                    <th className="py-2.5 px-3">Disease Indication</th>
                    <th className="py-2.5 px-3 text-right">Detected Mutations</th>
                    <th className="py-2.5 px-3 text-right">Primary Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eae8e7] dark:divide-slate-800">
                  {cases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-extrabold text-[#005daa] dark:text-sky-350">{c.id}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-550">{c.run.substring(0, 20)}...</td>
                      <td className="py-2.5 px-3">{c.panel}</td>
                      <td className="py-2.5 px-3 font-semibold">{c.disease}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-red-650 font-mono">{c.variants.length} locus calls</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setActiveRoute('samples');
                            handleCaseChange(c);
                          }}
                          className="bg-[#005daa] hover:bg-sky-700 text-white font-bold p-1 px-3 rounded text-[11px] transition-all cursor-pointer"
                        >
                          Launch Workspace
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      ) : activeRoute === 'results' ? (
        // RESULTS OVERVIEW ROUTE
        <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-850 p-5 rounded-lg border border-[#c0c7d6]">
            <h3 className="text-[14px] font-extrabold mb-2 text-[#005daa] dark:text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
              <TrendingUp className="h-5 w-5 text-[#005daa] dark:text-sky-400" />
              <span>Somatic Driver Mutation Cohort Analysis</span>
            </h3>
            <p className="text-[12px] text-slate-500 leading-relaxed mb-4">
              Detailed tracking of variant allele distributions across the entire sequencing pool. Pathologists can review multi-sample consensus curves and pathogenic hotspots.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded p-4 bg-slate-50 dark:bg-slate-900/50">
                <h4 className="text-[12px] font-extrabold text-slate-700 dark:text-slate-350 mb-3 uppercase font-mono">
                  Somatic Pathogenicity Hotspots Detected in Run BAT-023
                </h4>
                <div className="flex flex-col gap-2.5 text-[11.5px]">
                  <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 border rounded">
                    <span>IDH2 p.Arg140Gln</span>
                    <span className="font-extrabold text-red-650">Somatic Driver Tier I</span>
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 border rounded">
                    <span>JAK2 p.Val617Phe</span>
                    <span className="font-extrabold text-red-650">Somatic Driver Tier I</span>
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 border rounded">
                    <span>NPM1 p.Trp288fs</span>
                    <span className="font-extrabold text-amber-600">Somatic Carrier Tier II</span>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded p-4 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center">
                <Users className="h-10 w-10 text-indigo-500 mb-2" />
                <span className="text-[12px] font-bold">12 clinical labs synced across consensus nodes</span>
                <span className="text-[10.5px] text-slate-400 mt-1">Concordance rate: 99.85% (ISO verified mapping)</span>
              </div>
            </div>
          </div>
        </main>
      ) : (
        // SAMPLES GENOMIC CLINICAL WORKSPACE ROUTE
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Aesthetic Background Pattern */}
          <div className="absolute inset-0 z-0 opacity-5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#cde1fd] via-white to-white dark:from-slate-800 dark:to-slate-900 pointer-events-none" />

          <div className="flex-1 flex flex-col z-10 w-full max-w-[1600px] mx-auto px-4 pt-3.5 pb-2 overflow-hidden">
            
            {/* Integrated patient description subheader bar */}
            <SampleCaseHeader
              cases={cases}
              activeCase={activeCase}
              onCaseChange={handleCaseChange}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onOpenVcfModal={() => setIsVcfModalOpen(true)}
            />

            {activeTab === 'report' ? (
              // Case diagnostic report PDF view
              <ReportGeneratorView 
                activeCase={activeCase} 
                onUpdateVariant={onUpdateVariant}
                onAddLogEntry={onAddLogEntry}
              />
            ) : (
              // Splitted main somatic workspace
              <div className="flex-1 flex overflow-hidden gap-3">
                
                {/* Collapsible Left Search Filters Section */}
                <div 
                  className={`transition-all duration-350 flex relative items-stretch ${
                    sidebarCollapsed ? 'w-[48px]' : 'w-[250px]'
                  }`}
                >
                  {/* Left sidebar block panel */}
                  {!sidebarCollapsed ? (
                    <VariantFilterSidebar
                      variants={activeCase.variants}
                      filter={filter}
                      onFilterChange={handleFilterChange}
                      onTriggerDownload={handleTriggerExcelDownload}
                      activeVariant={activeVariant}
                      onUpdateVariant={onUpdateVariant}
                      onAddLogEntry={onAddLogEntry}
                      onSetActiveTab={setActiveTab}
                    />
                  ) : (
                    // Minimal rail placeholder when collapsed
                    <div className="w-[48px] bg-[#f5f3f3] dark:bg-[#1a2332] border border-[#c0c7d6] rounded-lg flex flex-col items-center py-4 gap-4">
                      <div className="bg-[#005daa] text-white p-1.5 rounded" title="Variants Filter Mode Active">
                        <Dna className="h-4 w-4" />
                      </div>
                      <div className="h-[1px] w-5 bg-slate-300 dark:bg-slate-700"></div>
                      <button 
                        onClick={() => setSidebarCollapsed(false)}
                        className="p-1 px-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-[#005daa]"
                        title="Display full filter drawer"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Absolute Collapsing handle button on vertical border rail */}
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="absolute right-[-11px] top-1/2 -translate-y-1/2 bg-white dark:bg-[#1a2332] border border-[#c0c7d6] rounded-full w-5 h-5 flex items-center justify-center cursor-pointer shadow-md z-30 text-slate-500 hover:text-[#005daa] hover:scale-110 active:scale-95 transition-all"
                  >
                    {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Splitted Workspace: left side is Table list, right side is detail foldouts panels */}
                <div className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden">
                  
                  {/* Somatic variant list table always interactive */}
                  <VariantTableGrid
                    variants={filteredVariants}
                    selectedVariant={activeVariant}
                    onSelectVariant={setActiveVariant}
                    checkedVariants={checkedVariants}
                    onToggleCheck={handleToggleCheck}
                    onToggleCheckAll={handleToggleCheckAll}
                    interestingGenes={interestingGenes}
                    onToggleInterestingGene={handleToggleInterestingGene}
                    showOnlyInteresting={showOnlyInteresting}
                    onToggleShowOnlyInteresting={() => setShowOnlyInteresting(!showOnlyInteresting)}
                    showOnlyChecked={showOnlyChecked}
                    onToggleShowOnlyChecked={() => setShowOnlyChecked(!showOnlyChecked)}
                  />

                  {/* Right hand Side Detail Accordions Block if a locus is inspected */}
                  {activeVariant ? (
                    <div className="w-full lg:w-[500px] xl:w-[580px] shrink-0 h-full flex flex-col overflow-hidden">
                      <VariantDetailAccordion variant={activeVariant} />
                    </div>
                  ) : (
                    // Idle placeholder encouraging clinicians to inspect a locus
                    <div className="w-full lg:w-[500px] xl:w-[580px] shrink-0 h-full bg-slate-100/40 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center gap-2 p-6 text-center text-slate-400">
                      <Dna className="h-10 w-10 text-slate-300 animate-pulse" />
                      <span className="text-[12px] font-bold">Locus Inspector Ready</span>
                      <p className="text-[10.5px] max-w-[250px] leading-relaxed">
                        Tap any variant link or chromosome position in the somatic grid left table to review corresponding sequence alignments, Reads term profiles, and ACMG interpretation guides.
                      </p>
                    </div>
                  )}

                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* System Status and version lock footer */}
      <footer className="bg-[#eae8e7] dark:bg-[#070c14] text-slate-500 dark:text-slate-400 text-[10px] py-1 px-4 text-right border-t border-[#c0c7d6] w-full shrink-0 z-50 flex justify-between select-none">
        <div>Consensus node synced: LMS-Region-A-Active</div>
        <div className="font-semibold font-mono uppercase">System Version: 1.8.0.3</div>
      </footer>

      {/* Global Local VCF Importer Portal */}
      <VcfUploadModal 
        isOpen={isVcfModalOpen}
        onClose={() => setIsVcfModalOpen(false)}
        onCaseImported={handleCaseImported}
      />

    </div>
  );
}
