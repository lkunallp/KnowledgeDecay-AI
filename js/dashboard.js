// Dashboard UI Logic

document.addEventListener('DOMContentLoaded', () => {
    if (!window.StateManager) return;

    // Load state
    const state = StateManager.getState();
    const dashboardData = state.dashboard;
    const ktData = state.knowledgeTwin;

    // Populate Top Insight
    const insightEl = document.getElementById('dashboard-insight');
    if (insightEl && ktData && ktData.concepts) {
        // Find the worst concept (highest risk)
        const sortedConcepts = [...ktData.concepts].sort((a, b) => b.metrics.risk - a.metrics.risk);
        if (sortedConcepts.length > 0) {
            const worst = sortedConcepts[0];
            insightEl.innerHTML = `<span class="text-main">${worst.name}</span> became critical because ${worst.diagnostic.reason.toLowerCase()}`;
        }
    }

    // Populate Overview
    document.getElementById('dash-mastery').textContent = `${ktData.overview.mastery}%`;
    document.getElementById('dash-retention').textContent = `${ktData.overview.retention}%`;
    document.getElementById('dash-risk').textContent = `${ktData.overview.forgettingRisk}%`;
    
    // 1. Initialize Knowledge Health Chart
    initHealthChart(dashboardData.knowledgeHealth.decayHistory);
    
    // 2. Populate Tomorrow's Brain
    populateTomorrowsBrain(state.knowledgeTwin.concepts);
    
    // 3. Populate Knowledge Twin Preview
    populateKnowledgeTwin(state.knowledgeTwin.concepts.slice(0, 4));
    
    // 4. Populate Knowledge Gaps dynamically from concepts
    const gaps = state.knowledgeTwin.concepts
        .filter(c => c.state === 'critical' || c.state === 'fragile')
        .slice(0, 3)
        .map(c => ({
            id: c.id,
            concept: c.name,
            stats: [
                { label: 'Mastery', value: `${c.mastery}%` },
                { label: 'Confidence', value: `${c.metrics.confidence}%` }
            ],
            statusText: c.state === 'critical' ? 'Critical Risk' : 'Fragile',
            statusClass: c.state === 'critical' ? 'badge-red' : 'badge-amber'
        }));
    populateKnowledgeGaps(gaps);
    
    // 5. Populate Recent Performance
    populateRecentPerformance(data.recentPerformance);
    });
});

function initHealthChart(decayHistory) {
    const ctx = document.getElementById('healthDecayChart');
    if (!ctx) return;
    
    // Create gradient
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)'); // accent blue
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    
    const labels = decayHistory.map(d => d.day);
    const dataset = decayHistory.map(d => d.retention);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Retention %',
                data: dataset,
                borderColor: '#3B82F6',
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: '#0A0A0B',
                pointBorderColor: '#3B82F6',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4 // smooth curve
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#141416',
                    titleColor: '#F3F4F6',
                    bodyColor: '#9CA3AF',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `Retention: ${context.raw}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9CA3AF',
                        callback: function(value) { return value + '%' }
                    }
                },
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: '#9CA3AF' }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            }
        }
    });
}

function populateTomorrowsBrain(concepts) {
    const container = document.getElementById('tb-list');
    if (!container) return;
    
    // Sort by risk descending and take top 3
    const riskyConcepts = [...concepts].sort((a, b) => b.metrics.risk - a.metrics.risk).slice(0, 3);
    
    container.innerHTML = riskyConcepts.map(c => {
        let status = c.state === 'critical' ? 'critical' : (c.state === 'fragile' ? 'warning' : 'good');
        let actionClass = status === 'critical' ? 'text-red' : (status === 'warning' ? 'text-amber' : 'text-green');
        
        return `
        <div class="tb-item ${status}">
            <div class="tb-item-header">
                <h3 class="tb-item-title">${c.name}</h3>
                <span class="tb-item-action ${actionClass}">
                    Review ${c.timeline.nextReview.toLowerCase().replace('review ', '')}
                </span>
            </div>
            <div class="tb-item-stats" style="margin-bottom: 8px;">
                <span>${c.decayPrediction.withoutRevision[1]}% predicted retention</span>
                <span>${c.metrics.risk}% forgetting risk</span>
            </div>
            <div class="text-muted" style="font-size: 0.85rem; line-height: 1.4; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05);">
                <i data-lucide="info" style="width: 14px; height: 14px; display: inline-block; vertical-align: -2px; margin-right: 4px;"></i>
                Driven by: ${c.diagnostic.reason.toLowerCase()}
            </div>
        </div>
        `;
    }).join('');
}

function populateKnowledgeTwin(items) {
    const container = document.getElementById('kt-list');
    if (!container) return;
    
    container.innerHTML = items.map(item => `
        <a href="knowledge-twin.html?concept=${item.id}" class="kt-item" style="text-decoration: none; display: flex; flex-direction: column; gap: 8px; transition: transform 0.2s; padding: 4px; border-radius: 4px;">
            <div class="kt-item-header">
                <span style="color: var(--text-main);">${item.name}</span>
                <span class="text-muted">${item.mastery}%</span>
            </div>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${item.mastery}%; background-color: var(--accent-blue);"></div>
            </div>
        </a>
    `).join('');
}

function populateKnowledgeGaps(items) {
    const container = document.getElementById('gaps-list');
    if (!container) return;
    
    container.innerHTML = items.map(item => `
        <div class="gap-item">
            <div class="gap-title">${item.concept}</div>
            <div class="gap-stats">
                ${item.stats.map(stat => `
                    <div class="gap-stat-row">
                        <span class="text-muted">${stat.label}:</span>
                        <span class="font-semibold">${stat.value}</span>
                    </div>
                `).join('')}
            </div>
            <div class="badge ${item.statusClass}">${item.statusText}</div>
        </div>
    `).join('');
}

function populateRecentPerformance(items) {
    const container = document.getElementById('perf-list');
    if (!container) return;
    
    container.innerHTML = items.map(item => `
        <div class="perf-item">
            <div class="perf-score text-blue">${item.score}</div>
            <div class="perf-details">
                <div class="perf-title">${item.subject} &mdash; ${item.concept}</div>
                <div class="perf-meta">
                    <span>Application: ${item.application}</span>
                    <span>${item.timeAgo}</span>
                </div>
            </div>
        </div>
    `).join('');
}
