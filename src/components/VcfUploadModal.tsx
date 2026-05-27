/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, Play } from 'lucide-react';
import { parseVcfString, getSampleVcfTemplate } from '../utils/vcfParser';
import { SampleCase } from '../data';

interface VcfUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseImported: (newCase: SampleCase) => void;
}

export default function VcfUploadModal({ isOpen, onClose, onCaseImported }: VcfUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedCase, setParsedCase] = useState<SampleCase | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Process file contents
  const processVcfFile = (vcfFile: File) => {
    setFile(vcfFile);
    setErrorMsg(null);
    setParsedCase(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          throw new Error("File content is empty.");
        }
        
        // Basic confirmation VCF format line check
        if (!text.includes('##fileformat=VCF') && !text.includes('#CHROM')) {
          throw new Error("Invalid format: File does not appear to be a standard genomic VCF.");
        }

        const parsed = parseVcfString(text, vcfFile.name);
        if (parsed.variants.length === 0) {
          throw new Error("The VCF file loaded successfully, but zero somatic variants could be resolved.");
        }

        setParsedCase(parsed);
      } catch (err: any) {
        setErrorMsg(err.message || "Failure parsing VCF structure. Please review format guidelines.");
      }
    };
    reader.onerror = () => {
      setErrorMsg("Error reading local VCF file binary.");
    };
    reader.readAsText(vcfFile);
  };

  // Handle drop events
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processVcfFile(e.dataTransfer.files[0]);
    }
  };

  // Handle manual select click
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processVcfFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Support instant test template generation
  const handleLoadDemoVcf = () => {
    setErrorMsg(null);
    const demoContent = getSampleVcfTemplate();
    const mockFileObj = new File([demoContent], "Sovereign_Somatic_Simulated_Co_1092.vcf", { type: "text/vcf" });
    const parsed = parseVcfString(demoContent, mockFileObj.name);
    setFile(mockFileObj);
    setParsedCase(parsed);
  };

  const handleApplyCase = () => {
    if (parsedCase) {
      onCaseImported(parsedCase);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-[100] p-4 font-sans antialiased">
      <div className="bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-lg shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header bar styled dynamically */}
        <div className="bg-slate-900 border-b border-white/10 p-4 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-[#DFFF00] text-slate-950 px-2 py-0.5 text-[9px] uppercase tracking-wider font-extrabold rounded-none">
              VCF ANALYTICS
            </span>
            <h3 className="text-[13px] font-black tracking-wider uppercase">
              Sovereign Local VCF Diagnostic Stream
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white hover:scale-115 transition-all p-1 cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Modal content body with smooth layout */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-5 text-slate-700 dark:text-slate-200">
          
          <div>
            <h4 className="text-[13px] font-extrabold mb-1 uppercase tracking-tight text-slate-900 dark:text-slate-100">
              Biological Variant Call Format Import
            </h4>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
              Import local sample run coordinates (.vcf). Our secure client-side processor translates alternative alleles, reading coverage levels, genotype frequencies, and maps pathogenicity in real-time. Data is kept inside local container memory – never sent to remote cloud database.
            </p>
          </div>

          {/* Drag and drop upload zone */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            className={`cursor-pointer border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-2.5 transition-all text-center ${
              dragActive 
                ? 'border-[#005daa] dark:border-amber-400 bg-sky-50/20 dark:bg-amber-950/10' 
                : 'border-slate-300 dark:border-slate-800 hover:border-[#005daa] dark:hover:border-amber-400 bg-slate-5/40 dark:bg-slate-900/10'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".vcf,.txt" 
              className="hidden" 
              onChange={handleChange}
            />

            <Upload className={`h-8 w-8 transition-colors ${
              dragActive ? 'text-[#005daa] dark:text-amber-400' : 'text-slate-400 dark:text-slate-600'
            }`} />

            <div className="text-[12px] font-bold">
              <span>Drag & drop your VCF file here, or </span>
              <span className="text-[#005daa] dark:text-sky-400 underline">browse local drive</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              Accepted Formats: Standard VCF 4.2 / 4.3 (.vcf / .txt)
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900/60 p-3 rounded-md border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-650 dark:text-slate-400">
              <HelpCircle className="h-4 w-4 text-[#005daa] dark:text-sky-400" />
              <span>Want to test the sequencing diagnostic engine?</span>
            </div>
            <button
              onClick={handleLoadDemoVcf}
              className="text-[#005daa] dark:text-[#DFFF00] dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 border hover:bg-slate-200 transition-all font-bold text-[10.5px] px-2.5 py-1 rounded cursor-pointer flex items-center gap-1 uppercase"
            >
              <Play className="h-3 w-3 fill-currentColor" />
              <span>Load Simulated Somatic VCF</span>
            </button>
          </div>

          {/* Validation & parsing results panel */}
          {errorMsg && (
            <div className="bg-red-50 border-l-4 border-l-red-500 rounded p-3 text-[11.5px] font-medium text-red-850 dark:bg-red-950/20 dark:text-red-400 flex items-start gap-2.5">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-extrabold uppercase text-[10px] tracking-wider mb-0.5">VCF Parsing Interrupted</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {parsedCase && file && (
            <div className="border border-[#c0c7d6] dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950/30 overflow-hidden flex flex-col gap-2 p-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-[11.5px]">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="font-extrabold text-slate-850 dark:text-white shrink-0">
                    {file.name}
                  </span>
                </div>
                <span className="bg-green-100 text-green-800 text-[10px] font-black tracking-tight px-2 py-0.5 rounded-full dark:bg-green-950/30 dark:text-green-300 uppercase">
                  {parsedCase.variants.length} mutations parsed
                </span>
              </div>

              {/* Case information card */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10.5px] text-slate-500 dark:text-slate-400 font-medium py-1">
                <div>
                  <span className="block font-bold text-slate-450 uppercase text-[8px] tracking-wider">Run Batch ID</span>
                  <span className="font-mono text-slate-800 dark:text-white">{parsedCase.run.slice(0, 15)}...</span>
                </div>
                <div>
                  <span className="block font-bold text-slate-450 uppercase text-[8px] tracking-wider">Designated Panel</span>
                  <span className="text-slate-800 dark:text-white capitalize">{parsedCase.panel}</span>
                </div>
                <div>
                  <span className="block font-bold text-slate-450 uppercase text-[8px] tracking-wider">Pipeline Node</span>
                  <span className="text-slate-800 dark:text-white">{parsedCase.pipeline}</span>
                </div>
                <div>
                  <span className="block font-bold text-slate-450 uppercase text-[8px] tracking-wider">Default Indication</span>
                  <span className="text-slate-800 dark:text-white">{parsedCase.disease}</span>
                </div>
              </div>

              {/* Micro variant list table preview */}
              <div className="mt-1 border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                <div className="bg-slate-100/75 dark:bg-slate-900/60 p-1 px-2 text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                  Extracted Loci Summary (First 4 rows preview)
                </div>
                <table className="w-full text-left text-[11px] border-collapse bg-white dark:bg-slate-900/30">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900/40">
                      <th className="p-1.5 px-2">Gene</th>
                      <th className="p-1.5">Coordinate</th>
                      <th className="p-1.5">Ref/Alt</th>
                      <th className="p-1.5 text-right">VAF (%)</th>
                      <th className="p-1.5 text-right pr-2">Depth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {parsedCase.variants.slice(0, 4).map((v, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="p-1.5 px-2 font-extrabold text-[#005daa] dark:text-sky-350">{v.gene}</td>
                        <td className="p-1.5 font-mono text-slate-500 text-[10.5px]">{v.chr}:{v.startPos}</td>
                        <td className="p-1.5 font-mono text-slate-600">{v.refSeqMutatedBase}&rarr;{v.altSeqMutatedBase}</td>
                        <td className="p-1.5 text-right font-bold text-red-650 font-mono">{v.fraction}%</td>
                        <td className="p-1.5 text-right font-mono text-slate-500 pr-2">{v.depth}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer controls */}
        <div className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center shrink-0">
          <button
            onClick={onClose}
            className="border hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 font-bold p-1.5 px-4 rounded text-[11px] transition-all cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            disabled={!parsedCase}
            onClick={handleApplyCase}
            className={`font-black p-1.5 px-5 rounded text-[11px] transition-all cursor-pointer flex items-center gap-1.5 shadow-md ${
              parsedCase
                ? 'bg-red-600 hover:bg-red-700 text-white hover:-translate-y-0.5 border border-red-500 active:translate-y-0'
                : 'bg-slate-300 text-slate-500 border border-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600 dark:border-slate-700'
            }`}
          >
            <span>Analyze Segment Workspace</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
