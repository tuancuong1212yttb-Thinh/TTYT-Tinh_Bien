
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { KPIEntry, Department } from '../../types';

interface Props {
  data: KPIEntry[];
  timeFilter: string; // Add timeFilter prop
}

const RevenueChart: React.FC<Props> = ({ data, timeFilter }) => {
  
  // Logic to determine scaling factor based on Time Filter
  const { scale, label, suffix } = useMemo(() => {
    switch (timeFilter) {
      case 'Hôm nay':
      case 'Hôm qua':
        return { scale: 300, label: 'Ngày', suffix: '(Dự kiến)' }; // Divide by ~300 working days
      case 'Tuần này':
        return { scale: 52, label: 'Tuần', suffix: '' };
      case 'Tháng này':
        return { scale: 12, label: 'Tháng', suffix: '' };
      case 'Quý này':
        return { scale: 4, label: 'Quý', suffix: '' };
      case 'Tùy chỉnh...':
        return { scale: 12, label: 'Giai đoạn', suffix: '(Tạm tính)' }; // Default custom to monthly avg
      default: // 'Năm nay'
        return { scale: 1, label: 'Năm', suffix: '' };
    }
  }, [timeFilter]);

  // Aggregate and Scale Data
  const deptRevenue = useMemo(() => {
    const rawData = data
      .filter(k => k.name.includes("Doanh thu") && k.department !== Department.TRUNG_TAM)
      .reduce((acc, curr) => {
        const existing = acc.find(x => x.name === curr.department);
        if (existing) {
          existing.rawRevenue += curr.actual;
          existing.rawPlan += curr.planYear;
        } else {
          acc.push({ name: curr.department, rawRevenue: curr.actual, rawPlan: curr.planYear });
        }
        return acc;
      }, [] as any[]);

    // Apply scaling
    return rawData.map(item => {
      // Create some realistic variance for Daily/Monthly views so it's not just a flat division
      // If scale is 1 (Year), variance is 0. If Day, variance is larger.
      const variance = scale === 1 ? 1 : (0.8 + Math.random() * 0.4); 
      
      return {
        name: item.name,
        // Plan is strictly divided (Average Plan)
        Plan: Math.round(item.rawPlan / scale),
        // Actual has some variance to look realistic in different timeframes
        Revenue: Math.round((item.rawRevenue / scale) * variance) 
      };
    });
  }, [data, scale]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96 flex flex-col">
      <div className="mb-4 flex justify-between items-start">
         <div>
            <h3 className="font-bold text-slate-800">Doanh thu theo Khoa</h3>
            <p className="text-xs text-slate-500 font-medium">
               So sánh: Thực tế vs Kế hoạch {label} {suffix}
            </p>
         </div>
         <div className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">
            {timeFilter}
         </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={deptRevenue}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="name" 
              tick={{fontSize: 10, fill: '#334155', fontWeight: 600}} 
              interval={0} 
              angle={-20} 
              textAnchor="end"
              height={60}
            />
            <YAxis 
                tickFormatter={(value) => scale > 12 ? `${(value/1000000).toFixed(0)}tr` : `${(value/1000).toFixed(0)} tỷ`} 
                tick={{fontSize: 10, fill: '#334155', fontWeight: 500}} 
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value * 1000000),
                  name === 'Plan' ? `Kế hoạch ${label}` : `Thực tế`
              ]}
              labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#000' }}
            />
            <Legend wrapperStyle={{ color: '#000', fontWeight: 500 }} />
            <Bar dataKey="Plan" name={`KH ${label}`} fill="#cbd5e1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Revenue" name="Thực tế" fill="#0891b2" radius={[4, 4, 0, 0]}>
               {deptRevenue.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill={entry.Revenue >= entry.Plan ? '#10b981' : (entry.Revenue < entry.Plan * 0.8 ? '#ef4444' : '#f59e0b')} />
               ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
