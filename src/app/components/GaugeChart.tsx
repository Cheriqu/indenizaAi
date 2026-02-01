import React from 'react';

const GaugeChart = ({ percentage }: { percentage: number }) => {
    // Configurações baseadas na porcentagem
    let color = "#ef4444"; // Red/Orange
    let emoji = "😐";
    let label = "BAIXA";

    if (percentage >= 70) {
        color = "#22c55e"; // Green
        emoji = "😃";
        label = "ALTA";
    } else if (percentage >= 50) {
        color = "#eab308"; // Yellow
        emoji = "🙂";
        label = "MÉDIA";
    } else {
        color = "#f97316"; // Orange
        emoji = "😐";
        label = "BAIXA";
    }

    const radius = 70;
    const stroke = 10;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative flex items-center justify-center w-44 h-44">
                <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
                    <circle
                        stroke="#e2e8f0"
                        strokeWidth={stroke}
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    <circle
                        stroke={color}
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
                        strokeLinecap="round"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-4xl filter drop-shadow-sm">{emoji}</span>
                    <span className="text-2xl font-bold" style={{ color: color }}>{percentage.toFixed(0)}%</span>
                </div>
            </div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Probabilidade <span style={{ color: color }}>{label}</span>
            </p>
        </div>
    );
};

export default GaugeChart;
