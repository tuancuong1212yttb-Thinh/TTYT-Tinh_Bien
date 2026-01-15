
import React, { useEffect, useState } from 'react';
import { fetchData } from '../services/dataService';
import { GroupStat } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Package, TrendingUp, DollarSign, List } from 'lucide-react';

const COLORS = ['#0891b2', '#0ea5e9', '#38bdf8', '#818cf8', '#a78bfa', '#c084fc', '#f472b6', '#fb7185', '#fda4af', '#e2e8f0'];

const Analytics: React.FC = () => {
  const [groups, setGroups] = useState<GroupStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<'revenue' | 'count'>('revenue');

  useEffect(() => {
    fetchData().then((res) => {
      setGroups(res.groups || []);
      setLoading(false);
    });
  }, []);

  const sortedGroups = [...groups].sort((a, b) => {
      if (sortMode === 'revenue') return b.revenue - a.revenue;
      return b.count - a.count;
  });

  const top10 = sortedGroups.slice(0, 10);
  const totalRevenue = groups.reduce((acc, curr) => acc + curr.revenue, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       {/* Header Stats */}
       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                 <h2 className="text-xl font-bold text-slate-800 flex items-center">
                    <Package className="mr-2 text-cyan-600"/>
                    Phân tích Nhóm Dịch vụ / Vật tư
                 </h2>
                 <p className="text-slate-500 text-sm mt-1">Dữ liệu tổng hợp từ cột TEN_NHOM trong file chi tiết</p>
              </div>
              <div className="text-right">
                  <div className="text-sm text-slate-500">Tổng Doanh thu Dịch vụ</div>
                  <div className="text-2xl font-bold text-emerald-600">
                     {(totalRevenue / 1000000000).toFixed(2)} <span className="text-sm font-normal text-slate-400">tỷ VNĐ</span>
                  </div>
              </div>
           </div>
       </div>

       {/* Charts Section */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Bar Chart */}
           <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[500px]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-slate-700 flex items-center">
                    <TrendingUp size={18} className="mr-2 text-blue-500"/> 
                    Top 10 Nhóm Dịch vụ
                 </h3>
                 <div className="flex bg-slate-100 rounded-lg p-1">
                    <button 
                        onClick={() => setSortMode('revenue')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${sortMode === 'revenue' ? 'bg-white shadow text-cyan-700' : 'text-slate-500'}`}
                    >
                        Theo Doanh thu
                    </button>
                    <button 
                        onClick={() => setSortMode('count')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${sortMode === 'count' ? 'bg-white shadow text-cyan-700' : 'text-slate-500'}`}
                    >
                        Theo Số lượng
                    </button>
                 </div>
              </div>
              
              <div className="flex-1 w-full min-h-0">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={top10 as any[]}
                        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                        barSize={20}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis 
                            type="category" 
                            dataKey="name" 
                            tick={{fontSize: 12, fill: '#000000', fontWeight: 700}} 
                            width={180}
                        />
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            formatter={(value: number) => [
                                sortMode === 'revenue' 
                                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
                                    : value.toLocaleString(),
                                sortMode === 'revenue' ? 'Doanh thu' : 'Số lượng'
                            ]}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', color: '#000000' }}
                            itemStyle={{ color: '#000000' }}
                            labelStyle={{ color: '#000000', fontWeight: 'bold' }}
                        />
                        <Bar 
                            dataKey={sortMode} 
                            radius={[0, 4, 4, 0]}
                            name={sortMode === 'revenue' ? "Doanh thu" : "Số lượng"}
                        >
                            {top10.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Summary / Pie */}
           <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[500px]">
              <h3 className="font-bold text-slate-700 mb-6 flex items-center">
                 <DollarSign size={18} className="mr-2 text-yellow-500"/>
                 Cơ cấu (Top 5)
              </h3>
              <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={top10.slice(0, 5) as any[]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="revenue"
                            >
                                {top10.slice(0, 5).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)}
                                contentStyle={{ color: '#000000' }}
                                itemStyle={{ color: '#000000' }}
                            />
                            <Legend 
                                layout="vertical" 
                                align="center" 
                                verticalAlign="bottom" 
                                wrapperStyle={{fontSize: '12px', paddingTop: '20px', color: '#000000', fontWeight: 700}} 
                            />
                        </PieChart>
                  </ResponsiveContainer>
              </div>
           </div>
       </div>

       {/* Detail Table */}
       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center">
               <List size={18} className="text-slate-500 mr-2"/>
               <h3 className="font-bold text-slate-700">Chi tiết Số liệu toàn bộ Nhóm</h3>
           </div>
           <div className="max-h-[500px] overflow-y-auto">
               <table className="min-w-full divide-y divide-slate-200">
                   <thead className="bg-slate-50 sticky top-0 z-10">
                       <tr>
                           <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">STT</th>
                           <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Tên Nhóm Dịch vụ / Vật tư</th>
                           <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Số lượng</th>
                           <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Doanh thu</th>
                           <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">% Tổng</th>
                       </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-slate-200">
                       {sortedGroups.map((group, idx) => (
                           <tr key={idx} className="hover:bg-slate-50">
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">{idx + 1}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{group.name}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-700 font-medium">{group.count.toLocaleString()}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-cyan-800">
                                   {group.revenue.toLocaleString()}
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-700 font-medium">
                                   {((group.revenue / totalRevenue) * 100).toFixed(2)}%
                               </td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           </div>
       </div>
    </div>
  );
};

export default Analytics;
