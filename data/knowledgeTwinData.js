// Mock Data for Knowledge Twin

window.KnowledgeTwinData = {
    overview: {
        mastery: 74,
        retention: 68,
        forgettingRisk: 32,
        conceptsTracked: 67
    },
    
    dimensions: [
        { id: 'recall', label: 'Recall', value: 82, icon: 'brain', colorClass: 'text-green' },
        { id: 'application', label: 'Application', value: 61, icon: 'cpu', colorClass: 'text-amber' },
        { id: 'transfer', label: 'Transfer', value: 43, icon: 'git-merge', colorClass: 'text-red' },
        { id: 'confidence', label: 'Confidence', value: 90, icon: 'shield', colorClass: 'text-blue' },
        { id: 'retention', label: 'Retention', value: 68, icon: 'database', colorClass: 'text-amber' },
        { id: 'stability', label: 'Stability', value: 54, icon: 'anchor', colorClass: 'text-amber' }
    ],

    confidenceGap: {
        confidence: 90,
        demonstrated: 56,
        gap: 34,
        title: "CONFIDENCE GAP DETECTED",
        description: "Your confidence is currently higher than your demonstrated performance across active concepts."
    },

    concepts: [
        {
            id: 'c1',
            name: 'Normalization',
            subject: 'DBMS',
            state: 'critical', // 'strong', 'fading', 'fragile', 'critical'
            mastery: 38,
            metrics: {
                recall: 45, application: 22, transfer: 15, confidence: 85, retention: 31, risk: 91
            },
            history: [
                { date: '7 days ago', mastery: 71 },
                { date: '5 days ago', mastery: 63 },
                { date: '3 days ago', mastery: 51 }
            ],
            timeline: {
                lastReviewed: '6 days ago',
                nextReview: 'Review today'
            },
            diagnostic: {
                reason: "Accuracy dropped across your last 3 recall attempts. Application performance is significantly lower than recognition performance.",
                boxClass: 'critical'
            },
            intervention: {
                title: 'Worked example + active recall',
                description: 'Rebuild a database schema from 1NF to 3NF using a guided scenario.'
            },
            decayPrediction: {
                labels: ['Today', '+2 days', '+5 days', '+7 days', '+10 days'],
                withoutRevision: [31, 22, 14, 8, 4],
                withRevision: [90, 85, 78, 72, 68]
            }
        },
        {
            id: 'c2',
            name: 'SQL Joins',
            subject: 'DBMS',
            state: 'fading',
            mastery: 57,
            metrics: {
                recall: 65, application: 52, transfer: 40, confidence: 70, retention: 58, risk: 42
            },
            history: [
                { date: '10 days ago', mastery: 85 },
                { date: '5 days ago', mastery: 72 }
            ],
            timeline: {
                lastReviewed: '5 days ago',
                nextReview: 'Review tomorrow'
            },
            diagnostic: {
                reason: "Concept stability is degrading normally. You occasionally confuse LEFT JOIN with INNER JOIN in complex queries.",
                boxClass: 'warning'
            },
            intervention: {
                title: 'Targeted Application',
                description: 'Write 5 specific queries mixing LEFT and FULL OUTER joins.'
            },
            decayPrediction: {
                labels: ['Today', '+2 days', '+5 days', '+7 days', '+10 days'],
                withoutRevision: [58, 51, 39, 32, 24],
                withRevision: [85, 82, 78, 75, 71]
            }
        },
        {
            id: 'c3',
            name: 'Transactions (ACID)',
            subject: 'DBMS',
            state: 'strong',
            mastery: 86,
            metrics: {
                recall: 92, application: 85, transfer: 78, confidence: 90, retention: 88, risk: 12
            },
            history: [
                { date: '12 days ago', mastery: 74 },
                { date: '6 days ago', mastery: 80 },
                { date: 'Yesterday', mastery: 84 }
            ],
            timeline: {
                lastReviewed: 'Yesterday',
                nextReview: 'Review in 12 days'
            },
            diagnostic: {
                reason: "You have consistently demonstrated mastery in both recall and application.",
                boxClass: ''
            },
            intervention: {
                title: 'Spaced Retrieval',
                description: 'A quick flashcard review to maintain strong retention.'
            },
            decayPrediction: {
                labels: ['Today', '+2 days', '+5 days', '+7 days', '+10 days'],
                withoutRevision: [88, 86, 84, 82, 79],
                withRevision: [95, 94, 93, 92, 91]
            }
        },
        {
            id: 'c4',
            name: 'Pointers',
            subject: 'Programming',
            state: 'strong',
            mastery: 91,
            metrics: {
                recall: 95, application: 92, transfer: 85, confidence: 95, retention: 93, risk: 8
            },
            history: [
                { date: '14 days ago', mastery: 60 },
                { date: '7 days ago', mastery: 75 },
                { date: '2 days ago', mastery: 84 }
            ],
            timeline: {
                lastReviewed: '2 days ago',
                nextReview: 'Review in 5 days'
            },
            diagnostic: {
                reason: "Memory management patterns are well solidified. Decay curve is very flat.",
                boxClass: ''
            },
            intervention: {
                title: 'Advanced Transfer',
                description: 'Implement a custom memory allocator (optional challenge).'
            },
            decayPrediction: {
                labels: ['Today', '+2 days', '+5 days', '+7 days', '+10 days'],
                withoutRevision: [93, 91, 88, 85, 81],
                withRevision: [98, 97, 96, 95, 93]
            }
        },
        {
            id: 'c5',
            name: 'Recursion',
            subject: 'Programming',
            state: 'fragile',
            mastery: 44,
            metrics: {
                recall: 75, application: 30, transfer: 20, confidence: 80, retention: 45, risk: 68
            },
            timeline: {
                lastReviewed: '2 weeks ago',
                nextReview: 'Today'
            },
            diagnostic: {
                reason: "You can identify the base case conceptually (high recall), but struggle to implement recursive tracing (low application).",
                boxClass: 'critical'
            },
            intervention: {
                title: 'Visual Tracing',
                description: 'Draw the call stack for a simple Fibonacci execution before writing code.'
            },
            decayPrediction: {
                labels: ['Today', '+2 days', '+5 days', '+7 days', '+10 days'],
                withoutRevision: [45, 38, 28, 22, 15],
                withRevision: [85, 80, 74, 68, 62]
            }
        }
    ]
};
