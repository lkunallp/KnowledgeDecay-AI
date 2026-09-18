// Mock Data Layer for Dashboard

window.DashboardData = {
    knowledgeHealth: {
        currentScore: 74,
        trend: 8,
        stats: {
            strong: 42,
            fading: 18,
            critical: 7
        },
        // Decaying retention over days (mock analytics for the chart)
        decayHistory: [
            { day: 'Day 1', retention: 92 },
            { day: 'Day 3', retention: 84 },
            { day: 'Day 5', retention: 68 },
            { day: 'Day 7', retention: 51 },
            { day: 'Day 10', retention: 38 },
        ]
    },
    
    tomorrowsBrain: [
        {
            id: 'c1',
            concept: 'Normalization',
            predictedRetention: 31,
            forgettingRisk: 91,
            status: 'critical', // 'critical', 'warning', 'good'
            actionText: 'Review today'
        },
        {
            id: 'c2',
            concept: 'Process Scheduling',
            predictedRetention: 58,
            forgettingRisk: 64,
            status: 'warning',
            actionText: 'Review tomorrow'
        },
        {
            id: 'c3',
            concept: 'C Pointers',
            predictedRetention: 86,
            forgettingRisk: 17,
            status: 'good',
            actionText: 'Review in 5 days'
        }
    ],

    knowledgeTwin: [
        { id: 'c1', subject: 'Normalization', mastery: 38 },
        { id: 'c2', subject: 'SQL Joins', mastery: 57 },
        { id: 'c3', subject: 'Transactions (ACID)', mastery: 86 },
        { id: 'c4', subject: 'Pointers', mastery: 91 }
    ],

    knowledgeGaps: [
        {
            id: 'g1',
            concept: 'Normalization',
            stats: [
                { label: 'Application ability', value: '48%' },
                { label: 'Confidence', value: '90%' }
            ],
            statusText: 'Confidence gap detected',
            statusClass: 'badge-red'
        },
        {
            id: 'g2',
            concept: 'Process Scheduling',
            stats: [
                { label: 'Recall', value: '58%' }
            ],
            statusText: 'Fading',
            statusClass: 'badge-amber'
        }
    ],

    recentPerformance: [
        {
            id: 'p1',
            subject: 'DBMS',
            concept: 'Normalization',
            score: '7/10',
            application: '48%',
            timeAgo: '2 hours ago'
        },
        {
            id: 'p2',
            subject: 'C Programming',
            concept: 'Pointers',
            score: '9/10',
            application: '87%',
            timeAgo: 'Yesterday'
        },
        {
            id: 'p3',
            subject: 'Operating Systems',
            concept: 'Scheduling',
            score: '8/10',
            application: '72%',
            timeAgo: '2 days ago'
        }
    ]
};
