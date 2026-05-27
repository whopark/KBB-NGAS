/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Variant {
  id: string;
  gene: string;
  tier: 'T1' | 'T2' | 'T3' | 'T4' | 'Report' | 'False';
  filterStatus: 'T1' | 'T2' | 'T3' | 'T4' | 'Report' | 'False' | 'None False' | 'Blacklist' | 'Whitelist' | 'OnHold' | 'Expert Tier';
  fraction: number; // e.g. 9.05 for 9.05%
  sameInRun: string; // e.g. "7/12"
  type: 'SNV' | 'Del' | 'Ins' | 'Mux';
  consequence: string; // e.g. "missense_variant"
  ntChange: string; // e.g. "c.419G>A"
  aaChange: string; // e.g. "p.Arg140Gln"
  chr: string; // e.g. "chr15"
  startPos: number; // e.g. 90631934
  depth: number;
  refCount: number;
  altCount: number;
  exon: string; // e.g. "4/11"
  dbSnpId: string; // e.g. "rs121913502"
  clinVarId: string; // e.g. "14716"
  clinVarInterpretation: string; // e.g. "Pathogenic"
  transcript: string; // e.g. "NM_002168.3"
  protein: string; // e.g. "NP_002159.2(LRG_611p2):p.(Arg140Gln)"
  genomeGRCh37: string; // e.g. "chr15:g.90631934:C>T"
  maxDepth: number;
  minDepth: number;
  meanDepth: number;
  refSeqContext: string; // e.g. "GACAGTCCCCCCCAGGATGTTC C GGATAGTTC"
  refSeqMutatedBase: string; // e.g. "C"
  altSeqMutatedBase: string; // e.g. "T"
  freq1KGP: string; // e.g. "-"
  freqGnomAD: string; // e.g. "0.000082869"
  freqExAC: string; // e.g. "0.0001071"
  freqKRGDB: string; // e.g. "-"
  // Stats
  runFraction: number; // e.g. 8 for 8%
  runRatio: string; // e.g. "1/12"
  panelFraction: number; // e.g. 2 for 2%
  panelRatio: string; // e.g. "30/1228"
  groupFraction: number; // e.g. 2 for 2%
  groupRatio: string; // e.g. "78/3814"
}

export interface InterpretationLogEntry {
  id: string;
  variantId: string;
  date: string;
  type: string;
  user: string;
  previous: string;
  current: string;
  comment: string;
}

export interface FilterState {
  selectedCategory: 'All' | 'T1' | 'T2' | 'T3' | 'T4' | 'Report' | 'False' | 'None False' | 'Blacklist' | 'Whitelist' | 'OnHold' | 'Expert Tier';
  geneSearch: string;
  hgvsCSearch: string;
  hgvsPSearch: string;
}
