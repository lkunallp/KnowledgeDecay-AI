// Global State Management

const STATE_KEY = 'knowledgeDecayState';

const StateManager = {
    // Initialize state from mock data files if not present in localStorage
    init() {
        if (!localStorage.getItem(STATE_KEY)) {
            this.resetDemoState();
        }
    },

    getState() {
        const stateStr = localStorage.getItem(STATE_KEY);
        if (!stateStr) {
            this.resetDemoState();
            return JSON.parse(localStorage.getItem(STATE_KEY));
        }
        return JSON.parse(stateStr);
    },

    saveState(state) {
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
    },

    resetDemoState() {
        // Build initial state combining Dashboard and Knowledge Twin mock data
        const initialState = {
            dashboard: window.DashboardData ? JSON.parse(JSON.stringify(window.DashboardData)) : {},
            knowledgeTwin: window.KnowledgeTwinData ? JSON.parse(JSON.stringify(window.KnowledgeTwinData)) : {}
        };
        
        // Initialize diagnostics based on seeded metrics
        if (initialState.knowledgeTwin && initialState.knowledgeTwin.concepts) {
            initialState.knowledgeTwin.concepts.forEach(c => {
                this.generateDiagnosticAndIntervention(c);
            });
        }
        
        localStorage.setItem(STATE_KEY, JSON.stringify(initialState));
        // Optional: reload the page to reflect reset
        if (typeof window !== 'undefined' && window.location) {
            console.log("Demo state reset to initial mock values.");
        }
    },
    
    // Core Product Loop: Record Quiz Attempt
    recordQuizAttempt(quizResult) {
        const state = this.getState();
        const conceptId = quizResult.conceptId;
        const concept = state.knowledgeTwin.concepts.find(c => c.id === conceptId);
        
        if (!concept) return null;
        
        // 1. Snapshot History
        const snapshot = {
            date: 'Just now',
            mastery: concept.mastery,
            retention: concept.metrics.retention,
            risk: concept.metrics.risk,
            recall: concept.metrics.recall,
            application: concept.metrics.application,
            transfer: concept.metrics.transfer,
            confidence: concept.metrics.confidence
        };
        if (!concept.history) concept.history = [];
        concept.history.unshift(snapshot);
        // Keep history bounded
        if (concept.history.length > 10) concept.history.pop();
        
        // Save 'Before' state for the result screen comparison
        const beforeState = {
            mastery: concept.mastery,
            retention: concept.metrics.retention,
            risk: concept.metrics.risk,
            state: concept.state
        };

        // --- Mock Algorithm to update the Concept ---
        
        // 1. Calculate performance impact
        const scoreRatio = quizResult.score / quizResult.totalQuestions;
        const avgConfidence = quizResult.avgConfidence; // 0-100
        
        let masteryDelta = (scoreRatio * 15) - 5; 
        let retentionDelta = (scoreRatio * 12) - 4; 
        let riskDelta = (scoreRatio * -20) + 10; 
        
        // Apply deltas
        concept.mastery = Math.min(100, Math.max(0, Math.round(concept.mastery + masteryDelta)));
        concept.metrics.retention = Math.min(100, Math.max(0, Math.round(concept.metrics.retention + retentionDelta)));
        concept.metrics.risk = Math.min(100, Math.max(0, Math.round(concept.metrics.risk + riskDelta)));
        
        // Update dimension metrics 
        concept.metrics.recall = Math.min(100, Math.round((concept.metrics.recall + (quizResult.recallPerformance || scoreRatio * 100)) / 2));
        concept.metrics.application = Math.min(100, Math.round((concept.metrics.application + (quizResult.applicationPerformance || scoreRatio * 100)) / 2));
        // Simple transfer assumption based on application
        concept.metrics.transfer = Math.min(100, Math.round((concept.metrics.transfer + (quizResult.applicationPerformance * 0.8 || scoreRatio * 80)) / 2));
        concept.metrics.confidence = Math.min(100, Math.round((concept.metrics.confidence + avgConfidence) / 2));
        
        // Determine new state bucket
        if (concept.metrics.risk < 25 && concept.mastery > 80) concept.state = 'strong';
        else if (concept.metrics.risk < 50 && concept.mastery > 60) concept.state = 'fading';
        else if (concept.metrics.risk < 75) concept.state = 'fragile';
        else concept.state = 'critical';

        concept.timeline.lastReviewed = 'Just now';
        
        // 2. Generate Deterministic Diagnostic and Intervention
        this.generateDiagnosticAndIntervention(concept);
        
        // --- End Mock Algorithm ---

        // Update Overall Confidence Gap based on all concepts
        const allConcepts = state.knowledgeTwin.concepts;
        const avgConf = allConcepts.reduce((acc, c) => acc + c.metrics.confidence, 0) / allConcepts.length;
        const avgMastery = allConcepts.reduce((acc, c) => acc + c.mastery, 0) / allConcepts.length;
        
        state.knowledgeTwin.confidenceGap.confidence = Math.round(avgConf);
        state.knowledgeTwin.confidenceGap.demonstrated = Math.round(avgMastery);
        state.knowledgeTwin.confidenceGap.gap = Math.max(0, Math.round(avgConf - avgMastery));
        
        state.knowledgeTwin.overview.mastery = Math.round(avgMastery);
        state.knowledgeTwin.overview.retention = Math.round(allConcepts.reduce((acc, c) => acc + c.metrics.retention, 0) / allConcepts.length);
        state.knowledgeTwin.overview.forgettingRisk = Math.round(allConcepts.reduce((acc, c) => acc + c.metrics.risk, 0) / allConcepts.length);

        if (state.dashboard.recentPerformance) {
            state.dashboard.recentPerformance.unshift({
                id: 'p' + Date.now(),
                subject: concept.subject,
                concept: concept.name,
                score: `${quizResult.score}/${quizResult.totalQuestions}`,
                application: `${Math.round(quizResult.applicationPerformance || 0)}%`,
                timeAgo: 'Just now'
            });
            if (state.dashboard.recentPerformance.length > 4) {
                state.dashboard.recentPerformance.pop();
            }
        }

        this.saveState(state);
        
        return {
            before: beforeState,
            after: {
                mastery: concept.mastery,
                retention: concept.metrics.retention,
                risk: concept.metrics.risk,
                state: concept.state
            }
        };
    },

    generateDiagnosticAndIntervention(concept) {
        const bullets = [];
        let weakestDimension = 'recall'; // default fallback
        let lowestScore = 100;
        
        const metrics = concept.metrics;
        
        // 1. Diagnostic Checks
        if (metrics.recall < 60) {
            if (concept.history && concept.history.length > 0 && concept.history[0].recall > metrics.recall) {
                bullets.push("Recall accuracy declined across recent attempts.");
            } else {
                bullets.push("Base recall accuracy is currently low.");
            }
        }
        
        if (metrics.application < metrics.recall - 15) {
            bullets.push("Application performance is significantly lower than recognition performance.");
        }
        
        if (metrics.transfer < 40) {
            bullets.push("Struggling to apply this concept in novel contexts.");
        }
        
        if (metrics.confidence > concept.mastery + 20) {
            bullets.push("Confidence is currently higher than demonstrated mastery.");
        }
        
        if (concept.timeline.lastReviewed.includes('days') && parseInt(concept.timeline.lastReviewed) > 5) {
            bullets.push(`A ${parseInt(concept.timeline.lastReviewed)}-day revision gap is accelerating decay.`);
        }
        
        // Fallback if no specific rule triggered but state is weak
        if (bullets.length === 0) {
            if (concept.state === 'strong') bullets.push("Knowledge state is solidifying nicely. Decay curve is flattening.");
            else bullets.push("Concept stability is degrading normally over time.");
        }
        
        // Store as a joined string for Tomorrow's Brain/Dashboard, and keep array for Modal
        concept.diagnostic = {
            bullets: bullets,
            reason: bullets.join(' '), // Provide flat string fallback
            boxClass: concept.state === 'critical' ? 'warning' : (concept.state === 'strong' ? 'good' : 'warning')
        };
        
        // 2. Intervention Checks (Find weakest dimension)
        const dimensions = [
            { name: 'recall', val: metrics.recall },
            { name: 'application', val: metrics.application },
            { name: 'transfer', val: metrics.transfer }
        ];
        
        dimensions.forEach(d => {
            if (d.val < lowestScore) {
                lowestScore = d.val;
                weakestDimension = d.name;
            }
        });
        
        // Override if confidence gap is huge
        if (metrics.confidence > concept.mastery + 30) {
            weakestDimension = 'calibration';
        }
        
        const interventions = {
            'recall': {
                title: 'Active Recall Session',
                description: 'Use active recall testing instead of rereading to rebuild base memory traces.'
            },
            'application': {
                title: 'Scenario Practice',
                description: 'Complete 3 application-based questions to bridge the gap between recognition and usage.'
            },
            'transfer': {
                title: 'Novel Context Problems',
                description: 'Solve problems involving this concept in a new domain to build transferability.'
            },
            'calibration': {
                title: 'Unassisted Calibration',
                description: 'Attempt the concept without hints and compare your confidence with actual performance.'
            }
        };
        
        concept.intervention = interventions[weakestDimension] || interventions['recall'];
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.StateManager = StateManager;
    // We want to make sure data files are loaded first, so wait for DOM content loaded
    document.addEventListener('DOMContentLoaded', () => {
        StateManager.init();
    });
}
