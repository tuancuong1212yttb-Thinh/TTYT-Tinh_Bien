import React from 'react';
import { ICDStat } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface Props {
  data: ICDStat[];
}

const COLORS = ['#0891b2', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd'];

const ICDAnalysis: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="font-bold text-slate-800 mb-4">Mô hình Bệnh tật (Top 5 ICD-10)</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64">
           <ResponsiveContainer width="100%" height="100%">
             <PieChart>
               <Pie
                 data={data as any[]}
                 cx="50%"
                 cy="50%"
                 innerRadius={60}
                 outerRadius={80}
                 paddingAngle={5}
                 dataKey="cases"
               >
                 {data.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                 ))}
               </Pie>
               <Tooltip 
                 formatter={(value: number) => [`${value} ca`, 'Số lượng']}
                 contentStyle={{ borderRadius: '8px', border: 'none' }}
               />
             </PieChart>
           </ResponsiveContainer>
        </div>
        
        <div className="space-y-3">
           {data.map((item, index) => (
             <div key={item.code} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2">
                <div className="flex items-center">
                   <div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                   <div>
                      <span className="font-bold text-slate-700 mr-2">{item.code}</span>
                      <span className="text-slate-600 truncate max-w-[150px] inline-block align-bottom" title={item.name}>{item.name}</span>
                   </div>
                </div>
                <div className="text-right">
                   <div className="font-bold text-slate-800">{item.cases} ca</div>
                   <div className="text-xs text-slate-400">{(item.revenue / 1000000).toFixed(0)} tr</div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default ICDAnalysis;