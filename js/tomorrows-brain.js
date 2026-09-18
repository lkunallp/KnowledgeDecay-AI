// Tomorrow's Brain Logic

document.addEventListener('DOMContentLoaded', () => {
    if (typeof StateManager === 'undefined') return;
    
    // Slight delay to ensure StateManager is init
    setTimeout(() => {
        const state = StateManager.getState();
        if (!state.knowledgeTwin || !state.knowledgeTwin.concepts) return;
        
        const concepts = state.knowledgeTwin.concepts;
        
        // Sort by forgetting risk descending
        const sortedConcepts = [...concepts].sort((a, b) => b.metrics.risk - a.metrics.risk);
        
        const container = document.getElementById('tb-dynamic-list');
        if (!container) return;
        
        container.innerHTML = sortedConcepts.map(c => {
            let riskClass = 'cc-good';
            let riskBadge = 'badge-green';
            let riskText = 'Strong';
            let textClass = 'text-green';
            let btnClass = 'btn-ghost';
            let btnText = 'View Details';
            let timeRec = c.timeline.nextReview;
            
            if (c.metrics.risk > 75) {
                riskClass = 'cc-critical';
                riskBadge = 'badge-red';
                riskText = 'Critical Risk';
                textClass = 'text-red';
                btnClass = 'btn-primary';
                btnText = 'Start Revision';
            } else if (c.metrics.risk > 40) {
                riskClass = 'cc-warning';
                riskBadge = 'badge-amber';
                riskText = 'Fading';
                textClass = 'text-amber';
                btnClass = 'btn-outline';
                btnText = 'Schedule';
            }
            
            return `
                <div class="concept-card ${riskClass}">
                    <div class="cc-main">
                        <div class="cc-header">
                            <h2 class="cc-title">${c.name} (${c.subject})</h2>
                            <div class="badge ${riskBadge}">${riskText}</div>
                        </div>
                        <div class="cc-stats">
                            <div class="cc-stat">
                                <span class="cc-stat-label">Current Retention</span>
                                <span class="cc-stat-val ${textClass}">${c.metrics.retention}%</span>
                            </div>
                            <div class="cc-stat">
                                <span class="cc-stat-label">Predicted (48h)</span>
                                <span class="cc-stat-val ${textClass}">${c.decayPrediction.withoutRevision[1]}%</span>
                            </div>
                            <div class="cc-stat">
                                <span class="cc-stat-label">Forgetting Risk</span>
                                <span class="cc-stat-val ${textClass}">${c.metrics.risk}%</span>
                            </div>
                        </div>
                        <div class="cc-reason">
                            <i data-lucide="info" class="text-blue" style="margin-top: 2px; flex-shrink: 0;"></i>
                            <span>${c.diagnostic.reason}</span>
                        </div>
                    </div>
                    <div class="cc-actions">
                        <div class="cc-time-rec ${textClass}">${timeRec}</div>
                        <a href="quiz.html?concept=${c.id}" class="btn ${btnClass}">${btnText}</a>
                    </div>
                </div>
            `;
        }).join('');
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 100);
});
