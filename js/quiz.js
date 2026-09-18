// Quiz interactive logic

document.addEventListener('DOMContentLoaded', () => {
    if (typeof StateManager === 'undefined') return;

    let seconds = 0;
    let timerInterval = null;
    let selectedOption = null;
    let selectedConfidence = 80; // default

    const timerEl = document.getElementById('timer');
    if (timerEl) {
        timerInterval = setInterval(() => {
            seconds++;
            const m = Math.floor(seconds / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
            timerEl.textContent = `${m}:${s}`;
        }, 1000);
    }

    // Option selection
    const options = document.querySelectorAll('.option');
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            options.forEach(o => {
                o.classList.remove('selected');
                const marker = o.querySelector('.option-marker');
                if (marker) marker.innerHTML = '';
            });
            opt.classList.add('selected');
            const m = opt.querySelector('.option-marker');
            if (m) m.innerHTML = '<i data-lucide="check" style="color: white; width: 14px; height: 14px;"></i>';
            selectedOption = opt; // Ideally capture an ID or value here
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    });

    // Confidence selection
    const confBtns = document.querySelectorAll('.conf-btn');
    confBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            confBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedConfidence = parseInt(btn.textContent);
        });
    });

    // Submit Logic
    const submitBtn = document.querySelector('.quiz-actions .btn-primary');
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearInterval(timerInterval);
            
            // Mock a result - for this demo, assume they got 7 out of 10.
            const quizResult = {
                conceptId: 'c1', // Normalization
                score: 7,
                totalQuestions: 10,
                avgConfidence: selectedConfidence,
                recallPerformance: 82,
                applicationPerformance: 61,
                timeSeconds: seconds
            };

            // Update State Manager
            const updateResult = StateManager.recordQuizAttempt(quizResult);
            
            // Save temporary result data to show on the result page
            sessionStorage.setItem('lastQuizResult', JSON.stringify({
                quiz: quizResult,
                knowledgeUpdate: updateResult
            }));
            
            // Navigate to result
            window.location.href = 'result.html';
        });
    }
});
