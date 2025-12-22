/**
 * Service Health Score Calculation
 * Calculates a health score (0-100) for a service based on various factors
 * This is a computed value - no database changes needed
 */

type ServiceHealthData = {
    totalIncidents: number;
    openIncidents: number;
    criticalIncidents: number;
    resolvedIncidents: number;
    avgResolutionTime?: number; // in minutes
    slaCompliance?: number; // percentage (0-100)
    recentIncidents?: number; // incidents in last 7 days
};

export function calculateServiceHealthScore(data: ServiceHealthData): {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'E';
    factors: {
        incidentVolume: number;
        criticalIssues: number;
        resolutionEfficiency: number;
        slaCompliance: number;
    };
} {
    const {
        totalIncidents,
        openIncidents,
        criticalIncidents,
        resolvedIncidents,
        avgResolutionTime,
        slaCompliance = 100,
        recentIncidents = 0
    } = data;

    // Factor 1: Incident Volume (0-25 points)
    // Lower incident volume = higher score
    let incidentVolumeScore = 25;
    if (totalIncidents > 0) {
        // Penalize based on total incidents (logarithmic scale)
        const incidentPenalty = Math.min(25, Math.log10(totalIncidents + 1) * 5);
        incidentVolumeScore = Math.max(0, 25 - incidentPenalty);
    }
    
    // Recent incidents penalty (last 7 days)
    if (recentIncidents > 0) {
        const recentPenalty = Math.min(10, recentIncidents * 2);
        incidentVolumeScore = Math.max(0, incidentVolumeScore - recentPenalty);
    }

    // Factor 2: Critical Issues (0-30 points)
    // No critical incidents = full points
    let criticalIssuesScore = 30;
    if (criticalIncidents > 0) {
        // Heavy penalty for critical incidents
        criticalIssuesScore = Math.max(0, 30 - (criticalIncidents * 15));
    }
    if (openIncidents > 0 && criticalIncidents === 0) {
        // Small penalty for any open incidents
        criticalIssuesScore = Math.max(20, criticalIssuesScore - (openIncidents * 2));
    }

    // Factor 3: Resolution Efficiency (0-25 points)
    // Based on resolution rate and average resolution time
    let resolutionEfficiencyScore = 25;
    if (totalIncidents > 0) {
        const resolutionRate = resolvedIncidents / totalIncidents;
        resolutionEfficiencyScore = resolutionRate * 20; // 0-20 points for resolution rate
        
        // Bonus/penalty for resolution time (if available)
        if (avgResolutionTime !== undefined) {
            // Target: resolve within 2 hours (120 minutes)
            // Full points if < 60 minutes, penalty if > 120 minutes
            if (avgResolutionTime < 60) {
                resolutionEfficiencyScore += 5; // Bonus for fast resolution
            } else if (avgResolutionTime > 120) {
                const timePenalty = Math.min(5, (avgResolutionTime - 120) / 60);
                resolutionEfficiencyScore = Math.max(0, resolutionEfficiencyScore - timePenalty);
            }
        }
    }

    // Factor 4: SLA Compliance (0-20 points)
    // Direct mapping: 100% compliance = 20 points
    const slaComplianceScore = (slaCompliance / 100) * 20;

    // Calculate total score
    const totalScore = Math.round(
        incidentVolumeScore +
        criticalIssuesScore +
        resolutionEfficiencyScore +
        slaComplianceScore
    );

    // Clamp to 0-100
    const finalScore = Math.max(0, Math.min(100, totalScore));

    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'E';
    if (finalScore >= 90) grade = 'A';
    else if (finalScore >= 75) grade = 'B';
    else if (finalScore >= 60) grade = 'C';
    else if (finalScore >= 40) grade = 'D';
    else grade = 'E';

    return {
        score: finalScore,
        grade,
        factors: {
            incidentVolume: Math.round(incidentVolumeScore),
            criticalIssues: Math.round(criticalIssuesScore),
            resolutionEfficiency: Math.round(resolutionEfficiencyScore),
            slaCompliance: Math.round(slaComplianceScore)
        }
    };
}

export function getHealthScoreColor(score: number): string {
    if (score >= 90) return 'var(--success)';
    if (score >= 75) return '#4ade80';
    if (score >= 60) return 'var(--warning)';
    if (score >= 40) return '#f97316';
    return 'var(--danger)';
}

export function getHealthScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Critical';
}

