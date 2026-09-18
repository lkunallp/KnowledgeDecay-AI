// Knowledge Twin UI Logic

document.addEventListener('DOMContentLoaded', () => {
    if (typeof StateManager === 'undefined') return;
    
    // Slight delay to ensure StateManager is init
    setTimeout(() => {
        const state = StateManager.getState();
        if (!state.knowledgeTwin) return;
        const data = state.knowledgeTwin;
    let currentFilter = 'all';
    let searchQuery = '';
    let modalChartInstance = null;
    
    initHero(data.overview);
    initDimensions(data.dimensions);
    initConfidenceGap(data.confidenceGap);
    
    // Initial Render of Concept Map
    renderConceptMap(data.concepts, currentFilter, searchQuery);
    
    // Check URL for concept ID to auto-open modal
    const urlParams = new URLSearchParams(window.location.search);
    const conceptId = urlParams.get('concept');
    if (conceptId) {
        // Need to wait slightly for Lucide icons to initialize and DOM to be fully ready
        setTimeout(() => {
            window.openConceptModal(conceptId);
        }, 100);
    }
    
    // Filter logic
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter');
            renderConceptMap(data.concepts, currentFilter, searchQuery);
        });
    });
    
    // Search logic
    const searchInput = document.getElementById('concept-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderConceptMap(data.concepts, currentFilter, searchQuery);
        });
    }
    
    // Modal Close logic
    const modal = document.getElementById('concept-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    
    const closeModal = () => {
        modal.classList.remove('active');
        // Let transition finish before potentially destroying chart
    };
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Modal populate and open logic is exposed globally for concept items
    window.openConceptModal = function(conceptId) {
        const concept = data.concepts.find(c => c.id === conceptId);
        if (!concept) return;
        
        // Populate Header
        document.getElementById('modal-subject').textContent = concept.subject;
        document.getElementById('modal-title').textContent = concept.name;
        
        const badge = document.getElementById('modal-state-badge');
        badge.className = `badge state-${concept.state}`;
        badge.textContent = concept.state.toUpperCase();
        
        // Populate Metrics
        const m = concept.metrics;
        document.getElementById('modal-metrics').innerHTML = `
            <div class="metric-card"><span class="text-muted">Mastery</span><span class="metric-val text-main">${concept.mastery}%</span></div>
            <div class="metric-card"><span class="text-muted">Retention</span><span class="metric-val text-blue">${m.retention}%</span></div>
            <div class="metric-card"><span class="text-muted">Forgetting risk</span><span class="metric-val ${m.risk > 50 ? 'text-red' : 'text-green'}">${m.risk}%</span></div>
            <div class="metric-card"><span class="text-muted">Confidence</span><span class="metric-val text-green">${m.confidence}%</span></div>
            <div class="metric-card"><span class="text-muted">Recall</span><span class="metric-val">${m.recall}%</span></div>
            <div class="metric-card"><span class="text-muted">Application</span><span class="metric-val">${m.application}%</span></div>
            <div class="metric-card"><span class="text-muted">Transfer</span><span class="metric-val">${m.transfer}%</span></div>
        `;
        
        // Populate Diagnostics (Why this state?)
        const reasonBox = document.getElementById('modal-reason-box');
        reasonBox.className = `diagnostic-box ${concept.diagnostic.boxClass}`; // fallback color class
        const listEl = document.getElementById('modal-diagnostic-list');
        listEl.innerHTML = concept.diagnostic.bullets.map(b => `<li>${b}</li>`).join('');
        
        // Populate Timeline
        const timelineEl = document.getElementById('modal-timeline');
        let timelineHTML = '';
        if (concept.history && concept.history.length > 0) {
            concept.history.slice().reverse().forEach(h => {
                timelineHTML += `
                    <div style="flex-shrink: 0; min-width: 100px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 6px; border: 1px solid var(--card-border);">
                        <div class="text-muted" style="font-size: 0.75rem; margin-bottom: 4px; text-transform: uppercase;">${h.date}</div>
                        <div style="font-weight: 600; font-size: 1.1rem;">${h.mastery}%</div>
                    </div>
                    <div style="display: flex; align-items: center; color: var(--text-muted);"><i data-lucide="arrow-right" style="width: 16px;"></i></div>
                `;
            });
        }
        
        // Current
        timelineHTML += `
            <div style="flex-shrink: 0; min-width: 100px; padding: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.3);">
                <div class="text-blue" style="font-size: 0.75rem; margin-bottom: 4px; text-transform: uppercase; font-weight: 600;">TODAY</div>
                <div class="text-blue" style="font-weight: 600; font-size: 1.1rem;">${concept.mastery}%</div>
            </div>
            <div style="display: flex; align-items: center; color: var(--text-muted);"><i data-lucide="arrow-right" style="width: 16px;"></i></div>
        `;
        
        // Prediction (+48 hours)
        timelineHTML += `
            <div style="flex-shrink: 0; min-width: 100px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 6px; border: 1px dashed var(--text-muted);">
                <div class="text-muted" style="font-size: 0.75rem; margin-bottom: 4px; text-transform: uppercase; display: flex; align-items: center; gap: 4px;"><i data-lucide="brain" style="width: 12px; height: 12px;"></i> +48 HOURS</div>
                <div class="text-muted" style="font-weight: 600; font-size: 1.1rem;">${concept.decayPrediction.withoutRevision[1]}% <span style="font-size: 0.75rem; font-weight: normal;">retention</span></div>
            </div>
        `;
        
        timelineEl.innerHTML = timelineHTML;
        
        // Intervention
        document.getElementById('modal-intervention-title').textContent = concept.intervention.title;
        document.getElementById('modal-intervention-desc').textContent = concept.intervention.description;
        document.getElementById('modal-quiz-btn').href = `quiz.html?concept=${concept.id}`;
        
        // Setup Chart Simulation Toggle
        const simToggle = document.getElementById('modal-sim-toggle');
        simToggle.checked = false; // Reset to default
        simToggle.onchange = (e) => {
            renderModalChart(concept.decayPrediction, e.target.checked);
        };
        
        // Render Initial Chart (Without intervention only)
        renderModalChart(concept.decayPrediction, false);
        
        // Show Modal
        modal.classList.add('active');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    function renderModalChart(predData, showSimulation = false) {
        const ctx = document.getElementById('modalDecayChart');
        if (!ctx) return;
        
        if (modalChartInstance) {
            modalChartInstance.destroy();
        }
        
        const datasets = [
            {
                label: 'Without Revision',
                data: predData.withoutRevision,
                borderColor: 'rgba(255, 255, 255, 0.4)',
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: 'rgba(255, 255, 255, 0.8)',
                tension: 0.3
            }
        ];
        
        if (showSimulation) {
            // Make the first curve dashed if we are simulating
            datasets[0].borderDash = [5, 5];
            datasets[0].borderColor = 'rgba(255, 255, 255, 0.2)';
            datasets[0].pointRadius = 0;
            
            datasets.push({
                label: 'With Recommended Intervention',
                data: predData.withRevision,
                borderColor: '#10B981', // green for positive intervention
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#10B981',
                pointRadius: 4,
                fill: true,
                tension: 0.3
            });
        }
        
        modalChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: predData.labels,
                datasets: datasets
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
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        min: 0, max: 100,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9CA3AF' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#9CA3AF' }
                    }
                }
            }
        });
    }
    });
});

function initHero(overview) {
    const container = document.getElementById('kt-hero-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="kt-hero-card primary">
            <span class="hero-label">Overall Mastery</span>
            <span class="hero-value">${overview.mastery}%</span>
        </div>
        <div class="kt-hero-card">
            <span class="hero-label">Retention</span>
            <span class="hero-value">${overview.retention}%</span>
        </div>
        <div class="kt-hero-card">
            <span class="hero-label">Forgetting Risk</span>
            <span class="hero-value text-amber">${overview.forgettingRisk}%</span>
        </div>
        <div class="kt-hero-card">
            <span class="hero-label">Concepts Tracked</span>
            <span class="hero-value">${overview.conceptsTracked}</span>
        </div>
    `;
}

function initDimensions(dimensions) {
    const container = document.getElementById('kt-dimensions-container');
    if (!container) return;
    
    container.innerHTML = dimensions.map(dim => `
        <div class="dim-card">
            <div class="dim-info">
                <div class="dim-label">${dim.label}</div>
                <div class="dim-value ${dim.colorClass}">${dim.value}%</div>
            </div>
            <div class="dim-icon">
                <i data-lucide="${dim.icon}" class="text-muted"></i>
            </div>
        </div>
    `).join('');
}

function initConfidenceGap(gapData) {
    const container = document.getElementById('kt-confidence-gap');
    if (!container) return;
    
    container.innerHTML = `
        <div class="gap-info">
            <h2 class="gap-title text-red">${gapData.title}</h2>
            <p class="gap-desc">${gapData.description}</p>
        </div>
        <div class="gap-visual">
            <div class="gap-metric">
                <span class="gap-metric-label">Student Confidence</span>
                <span class="gap-metric-value text-blue">${gapData.confidence}%</span>
            </div>
            <div class="gap-divider"></div>
            <div class="gap-metric">
                <span class="gap-metric-label">Demonstrated Mastery</span>
                <span class="gap-metric-value">${gapData.demonstrated}%</span>
            </div>
            <div class="gap-divider"></div>
            <div class="gap-metric">
                <span class="gap-metric-label text-red">Gap</span>
                <span class="gap-metric-value text-red">${gapData.gap}%</span>
            </div>
        </div>
    `;
}

function renderConceptMap(concepts, filter, query) {
    const container = document.getElementById('kt-concept-list');
    if (!container) return;
    
    let filtered = concepts;
    
    if (filter !== 'all') {
        filtered = filtered.filter(c => c.state === filter);
    }
    
    if (query.trim() !== '') {
        filtered = filtered.filter(c => 
            c.name.toLowerCase().includes(query) || 
            c.subject.toLowerCase().includes(query)
        );
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `<div style="grid-column: span 3; text-align: center; padding: 40px; color: var(--text-muted);">No concepts found matching your filters.</div>`;
        return;
    }
    
    container.innerHTML = filtered.map(c => `
        <div class="concept-item" onclick="openConceptModal('${c.id}')">
            <div class="ci-header">
                <div>
                    <div class="ci-title">${c.name}</div>
                    <div class="ci-subject">${c.subject}</div>
                </div>
                <div class="badge state-${c.state}" style="font-size: 0.75rem;">${c.state.toUpperCase()}</div>
            </div>
            <div class="ci-mastery">
                <span class="text-muted">Mastery</span>
                <span class="font-semibold">${c.mastery}%</span>
            </div>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${c.mastery}%; background-color: var(--accent-blue);"></div>
            </div>
        </div>
    `).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
