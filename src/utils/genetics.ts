/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Variant } from '../types';

export interface ArtifactRisk {
  isRisk: boolean;
  score: 'High' | 'Medium' | 'Low';
  reasons: string[];
}

export function evaluateArtifactRisk(v: Variant): ArtifactRisk {
  const reasons: string[] = [];
  let score: 'High' | 'Medium' | 'Low' = 'Low';
  
  if (v.tier === 'False' || v.filterStatus === 'False') {
    return {
      isRisk: true,
      score: 'High',
      reasons: ['User confirmed false positive artifact']
    };
  }

  // 1. Homopolymer context (e.g., ASXL1 c.1934delG)
  const isAsxl1Homopolymer = v.gene === 'ASXL1' && (v.ntChange.includes('delG') || v.fraction < 4.0);
  if (isAsxl1Homopolymer) {
    reasons.push('Homopolymer stretch (>8bp repeat) causing polymerase slippage');
    score = 'High';
  }

  // 2. High Recurrence + Low VAF Artifact Risk
  if (v.sameInRun && v.sameInRun.includes('/')) {
    const [num, den] = v.sameInRun.split('/').map(Number);
    if (!isNaN(num) && !isNaN(den) && den > 0) {
      const ratio = num / den;
      if (ratio >= 0.50 && v.fraction < 5.0) {
        reasons.push(`High run recurrence (${v.sameInRun}, ${Math.round(ratio*100)}%) with low VAF (${v.fraction}%)`);
        score = 'High';
      } else if (ratio >= 0.25 && v.fraction < 10.0) {
        reasons.push(`Moderate recurrence (${v.sameInRun}) with moderate-low VAF (${v.fraction}%)`);
        if (score !== 'High') score = 'Medium';
      }
    }
  }

  // 3. Low depth / Low mutant count
  if (v.depth < 1000 && v.fraction < 3.0) {
    reasons.push(`Very low alternative allele frequency (${v.fraction}%) at safe but low coverage (${v.depth} rds)`);
    if (score !== 'High') score = 'Medium';
  }

  // 4. ClinVar Interpretation mismatch or suspicious metrics
  // Low VAF with very high panel recurrence
  if (v.panelFraction && v.panelFraction > 30 && v.fraction < 3.5) {
    reasons.push(`Low VAF (${v.fraction}%) with extremely high sequence panel recurrence (${v.panelFraction}%)`);
    score = 'High';
  }

  return {
    isRisk: reasons.length > 0,
    score,
    reasons
  };
}
