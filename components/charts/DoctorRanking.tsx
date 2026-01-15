
import React, { useState } from 'react';
import { DoctorStats } from '../../types';
import { Award, User, ChevronRight, Hash, X, PieChart as PieIcon, BarChart as BarIcon, Activity } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface Props {
  data: DoctorStats[];
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

const DoctorRanking: React.FC<Props> = ({ data }) => {
  const [selectedDoc, setSelectedDoc] = useState<DoctorStats | null>(null);

  // Sort by revenue desc
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue);

  // === DATA PREPARATION FOR MODAL ===
  // 1. Group Revenue Distribution
  const groupStats = selectedDoc?.details 
    ? Object.values(selectedDoc.details.reduce((acc, curr) => {
        if (!acc[curr.group]) acc[curr.group] = { name: curr.group, value: 0 };
        acc[curr.group].value += curr.revenue;
        return acc;
      }, {} as Record<string, {name: string, value: number}>))
      .sort((a, b) => b.value - a.value)
    : [];

  // 2. Top 10 Services by Revenue
  const topServices = selectedDoc?.details
    ? selectedDoc.details.slice(0, 10).map(s => ({...s, shortName: s.name.length > 20 ? s.name.substring(0, 20) + '...' : s.name}))
    : [];

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
        <div className="p-5 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 flex items-center">
            <Award className="mr-2 text-yellow-500" size={20} />
            Top Bác sĩ Doanh thu cao
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                  <User size={32} className="mb-2 opacity-50"/>
                  <span className="text-sm">Chưa có dữ liệu bác sĩ</span>
              </div>
          ) : (
              sorted.map((doc, idx) => (
              <div 
                key={doc.id} 
                onClick={() => setSelectedDoc(doc)}
                className="flex items-center p-3 hover:bg-slate-50 rounded-lg transition-all group cursor-pointer border-b border-slate-100 last:border-0"
              >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0 ${
                  idx === 0 ? 'bg-yellow-100 text-yellow-700' : 
                  idx === 1 ? 'bg-slate-200 text-slate-600' :
                  idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'
                  }`}>
                  {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 truncate" title={doc.name}>{doc.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono flex items-center">
                          {doc.id}
                      </span>
                      <div className="text-xs text-slate-500 flex items-center truncate">
                          <User size={10} className="mr-1"/> {doc.department}
                      </div>
                  </div>
                  </div>
                  <div className="text-right pl-2">
                  <div className="font-bold text-cyan-700 text-sm">{(doc.revenue / 1000000).toFixed(0)} tr</div>
                  <div className="text-xs text-slate-400">{doc.serviceCount} lượt</div>
                  </div>
                  <ChevronRight size={16} className="ml-2 text-slate-300 group-hover:text-cyan-500" />
              </div>
              ))
          )}
        </div>
      </div>

      {/* === DETAIL MODAL === */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
              
              {/* Header */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                 <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-lg mr-4">
                       {selectedDoc.name.charAt(0)}
                    </div>
                    <div>
                       <h2 className="text-xl font-bold text-slate-800">{selectedDoc.name}</h2>
                       <div className="flex items-center text-sm text-slate-500 gap-3">
                          <span className="flex items-center bg-white px-2 py-0.5 rounded border border-slate-200"><Hash size={12} className="mr-1"/> {selectedDoc.id}</span>
                          <span className="flex items-center"><User size={14} className="mr-1"/> {selectedDoc.department}</span>
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                    <X size={24} />
                 </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                 
                 {/* Top Stats Cards */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                       <div>
                          <p className="text-sm text-slate-500 font-medium">Tổng Doanh thu</p>
                          <p className="text-2xl font-bold text-emerald-600">{(selectedDoc.revenue / 1000000).toLocaleString()} <span className="text-sm font-normal text-slate-400">triệu</span></p>
                       </div>
                       <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                          <Activity size={20} />
                       </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                       <div>
                          <p className="text-sm text-slate-500 font-medium">Tổng lượt chỉ định</p>
                          <p className="text-2xl font-bold text-blue-600">{selectedDoc.serviceCount.toLocaleString()}</p>
                       </div>
                       <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                          <User size={20} />
                       </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                       <div>
                          <p className="text-sm text-slate-500 font-medium">Số dịch vụ thực hiện</p>
                          <p className="text-2xl font-bold text-purple-600">{selectedDoc.details?.length || 0}</p>
                       </div>
                       <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                          <Award size={20} />
                       </div>
                    </div>
                 </div>

                 {/* Charts Section */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 h-[400px]">
                    
                    {/* Pie Chart: Structure by Group */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                       <h4 className="font-bold text-slate-700 mb-4 flex items-center"><PieIcon size={18} className="mr-2 text-cyan-600"/> Cơ cấu Doanh thu theo Nhóm</h4>
                       <div className="flex-1 w-full min-h-0">
                          {groupStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={groupStats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {groupStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)} 
                                        contentStyle={{ color: '#000' }}
                                    />
                                    <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ color: '#000' }} />
                                </PieChart>
                            </ResponsiveContainer>
                          ) : <div className="flex h-full items-center justify-center text-slate-400">Không có dữ liệu nhóm</div>}
                       </div>
                    </div>

                    {/* Bar Chart: Top Services */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                       <h4 className="font-bold text-slate-700 mb-4 flex items-center"><BarIcon size={18} className="mr-2 text-indigo-600"/> Top 10 Dịch vụ chỉ định (Doanh thu)</h4>
                       <div className="flex-1 w-full min-h-0">
                          {topServices.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={topServices}
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                    barSize={15}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="shortName" tick={{fontSize: 11, fill: '#334155', fontWeight: 600}} width={120} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', color: '#000' }}
                                        formatter={(val: number) => [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val), 'Doanh thu']}
                                        labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} background={{ fill: '#f8fafc' }} />
                                </BarChart>
                            </ResponsiveContainer>
                          ) : <div className="flex h-full items-center justify-center text-slate-400">Không có dữ liệu dịch vụ</div>}
                       </div>
                    </div>
                 </div>

                 {/* Detailed Table */}
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                        <h4 className="font-bold text-slate-700 text-sm">Chi tiết Dịch vụ</h4>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="px-5 py-3 text-left font-medium text-slate-700 uppercase tracking-wider text-xs">Tên Dịch vụ</th>
                                    <th className="px-5 py-3 text-left font-medium text-slate-700 uppercase tracking-wider text-xs">Nhóm</th>
                                    <th className="px-5 py-3 text-right font-medium text-slate-700 uppercase tracking-wider text-xs">Số lượng</th>
                                    <th className="px-5 py-3 text-right font-medium text-slate-700 uppercase tracking-wider text-xs">Doanh thu</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {selectedDoc.details && selectedDoc.details.length > 0 ? (
                                    selectedDoc.details.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-5 py-2 text-slate-800 font-medium">{item.name}</td>
                                            <td className="px-5 py-2 text-slate-600 text-xs">{item.group}</td>
                                            <td className="px-5 py-2 text-right text-slate-700 font-bold">{item.count}</td>
                                            <td className="px-5 py-2 text-right text-cyan-800 font-bold">{(item.revenue).toLocaleString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-4 text-center text-slate-400 italic">Không có dữ liệu chi tiết (Cần file HIS đầy đủ)</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                 </div>

              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default DoctorRanking;
