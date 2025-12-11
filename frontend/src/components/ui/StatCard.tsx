import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'primary' | 'accent' | 'success' | 'warning';
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle, trend }: StatCardProps) => {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-50',
    accent: 'text-accent-600 bg-accent-50',
    success: 'text-green-600 bg-green-50',
    warning: 'text-orange-600 bg-orange-50',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
    >
      <div className="p-5">
        <div className="flex items-center">
          <div className={cn('flex-shrink-0 rounded-md p-3', colorClasses[color])}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {trend && (
                  <div
                    className={cn(
                      'ml-2 flex items-baseline text-sm font-semibold',
                      trend.isPositive ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {trend.isPositive ? '+' : '-'}
                    {Math.abs(trend.value)}%
                  </div>
                )}
              </dd>
              {subtitle && <dd className="text-xs text-gray-500 mt-1">{subtitle}</dd>}
            </dl>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
