import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  className
}) => {
  return (
    <Card className={cn('bg-gray-900 border-gray-800', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white mb-1">
          {value}
        </div>
        {trend && (
          <p className={cn(
            'text-xs',
            trendUp === undefined 
              ? 'text-gray-500'
              : trendUp 
                ? 'text-green-400'
                : 'text-red-400'
          )}>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;