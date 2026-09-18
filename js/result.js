// Result Page Logic

document.addEventListener('DOMContentLoaded', () => {
    const resultDataStr = sessionStorage.getItem('lastQuizResult');
    if (!resultDataStr) {
        // If someone navigated directly here without taking a quiz
        return;
    }
    
    const { quiz, knowledgeUpdate } = JSON.parse(resultDataStr);
    
    if (!quiz || !knowledgeUpdate) return;
    
    // Attempt to get subject/concept from state for subtitle
    if (typeof StateManager !== 'undefined') {
        const state = StateManager.getState();
        const concept = state.knowledgeTwin.concepts.find(c => c.id === quiz.conceptId);
        if (concept) {
            document.getElementById('res-subtitle').textContent = `${concept.subject} \u2014 ${concept.name}`;
        }
    }
    
    // Fill metrics
    document.getElementById('res-score').textContent = `${quiz.score}/${quiz.totalQuestions}`;
    document.getElementById('res-recall').textContent = `${quiz.recallPerformance}%`;
    document.getElementById('res-application').textContent = `${quiz.applicationPerformance}%`;
    document.getElementById('res-confidence').textContent = `${quiz.avgConfidence}%`;
    
    let speed = 'Fast';
    if (quiz.timeSeconds > 45) speed = 'Slow';
    else if (quiz.timeSeconds > 20) speed = 'Normal';
    
    const speedEl = document.getElementById('res-speed');
    speedEl.textContent = speed;
    if (speed === 'Slow') speedEl.className = 'metric-val text-amber';
    else if (speed === 'Fast') speedEl.className = 'metric-val text-green';
    
    // Fill Knowledge State
    const finalState = knowledgeUpdate.after.state;
    const stateBadge = document.getElementById('res-state');
    stateBadge.textContent = finalState.toUpperCase();
    stateBadge.className = `badge state-${finalState}`;
    
    // Fill Changes
    const updateDOM = (idPrefix, oldVal, newVal, lowerIsBetter = false) => {
        document.getElementById(`${idPrefix}-old`).textContent = `${oldVal}%`;
        const newEl = document.getElementById(`${idPrefix}-new`);
        newEl.textContent = `${newVal}%`;
        
        if (newVal > oldVal) {
            newEl.className = lowerIsBetter ? 'text-red' : 'text-green';
        } else if (newVal < oldVal) {
            newEl.className = lowerIsBetter ? 'text-green' : 'text-red';
        } else {
            newEl.className = 'text-muted';
        }
    };
    
    updateDOM('res-mastery', knowledgeUpdate.before.mastery, knowledgeUpdate.after.mastery);
    updateDOM('res-retention', knowledgeUpdate.before.retention, knowledgeUpdate.after.retention);
    updateDOM('res-risk', knowledgeUpdate.before.risk, knowledgeUpdate.after.risk, true); // lower risk is better
});
