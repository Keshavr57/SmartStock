import React from 'react';
import { TrendingUp, TrendingDown, Building2, Zap, Car, Pill, Banknote, Cpu, Factory, Home } from 'lucide-react';

const SectorPerformance: React.FC = () => {
    const sectors = [
        { name: 'Banking', icon: Banknote, change: 2.4, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900' },
        { name: 'IT Services', icon: Cpu, change: 1.8, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900' },
        { name: 'Auto', icon: Car, change: -1.2, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900' },
        { name: 'Pharma', icon: Pill, change: 0.9, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900' },
        { name: 'Energy', icon: Zap, change: -2.1, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900' },
        { name: 'Realty', icon: Home, change: 3.2, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900' },
        { name: 'Metals', icon: Factory, change: -0.8, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900' },
        { name: 'Infrastructure', icon: Building2, change: 1.5, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900' }
    ];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        Sector Performance
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Today</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {sectors.map((sector, index) => {
                        const Icon = sector.icon;
                        return (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sector.bgColor}`}>
                                        <Icon className={`h-4 w-4 ${sector.color}`} />
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-white text-sm">{sector.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {sector.change >= 0 ? (
                                        <TrendingUp className="h-3 w-3 text-green-600" />
                                    ) : (
                                        <TrendingDown className="h-3 w-3 text-red-600" />
                                    )}
                                    <span className={`text-sm font-medium ${sector.color}`}>
                                        {sector.change >= 0 ? '+' : ''}{sector.change}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SectorPerformance;