
import React from 'react';
import { OutcomeStat } from '../../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, Label, CartesianGrid } from 'recharts';
import { Activity, LogOut, Users, ArrowRight } from 'lucide-react';

interface Props {
  data: OutcomeStat[];
}

const COLORS_PATIENT_TYPE = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#64748b']; // Sky, Violet, Amber, Slate
const COLORS_BAR = '#10b981'; // Emerald for positive vibes
const COLORS_BAR_DISCHARGE = '#6366f1'; // Indigo for discharge

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg text-sm">
        <p className="font-semibold text-slate-800 mb-1">{payload[0].payload.name}</p>
        <p className="text-slate-600">
          Số lượng: <span className="font-bold text-slate-900">{payload[0].value.toLocaleString()}</span>
        </p>
      </div>
    );
  }
  return null;
};

const OutcomeChart: React.FC<Props> = ({ data }) => {
  const treatmentData = data.filter(d => d.type === 'treatment').sort((a, b) => b.value - a.value);
  const dischargeData = data.filter(d => d.type === 'discharge').sort((a, b) => b.value - a.value);
  const patientTypeData = data.filter(d => d.type === 'patientType');
  
  const totalPatients = patientTypeData.reduce((acc, cur) => acc + cur.value, 0);

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-800">Phân tích Chất lượng KCB</h3>
        <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-500 rounded">Real-time</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
         {/* LEFT: Patient Type Overview (Donut) */}
         <div className="lg:col-span-4 flex flex-col">
            <div className="flex items-center text-slate-700 font-semibold text-sm mb-2">
                <Users size={16} className="text-sky-500 mr-2"/> Loại hình KCB
            </div>
            <div className="flex-1 min-h-[180px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={patientTypeData as any[]}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={2}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                        >
                            {patientTypeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS_PATIENT_TYPE[index % COLORS_PATIENT_TYPE.length]} strokeWidth={0} />
                            ))}
                            <Label 
                                value={totalPatients.toLocaleString()} 
                                position="center" 
                                className="text-2xl font-bold fill-slate-900"
                                dy={-5}
                            />
                            <Label 
                                value="Tổng lượt" 
                                position="center" 
                                className="text-xs fill-slate-500 font-bold"
                                dy={15}
                            />
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 px-2">
                {patientTypeData.map((item, index) => (
                    <div key={index} className="flex items-center text-xs text-slate-700 font-medium">
                        <div className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: COLORS_PATIENT_TYPE[index % COLORS_PATIENT_TYPE.length]}}></div>
                        <span className="truncate">{item.name}</span>
                    </div>
                ))}
            </div>
         </div>

         {/* CENTER: Treatment Result (Horizontal Bar) */}
         <div className="lg:col-span-4 flex flex-col border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
            <div className="flex items-center text-slate-700 font-semibold text-sm mb-2">
                <Activity size={16} className="text-emerald-500 mr-2"/> Kết quả Điều trị
            </div>
            <div className="flex-1 w-full min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={treatmentData as any[]}
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                        barSize={12}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis 
                            type="category" 
                            dataKey="name" 
                            tick={{fontSize: 11, fill: '#334155', fontWeight: 600}} 
                            width={90} 
                            interval={0}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                        <Bar dataKey="value" fill={COLORS_BAR} radius={[0, 4, 4, 0]} background={{ fill: '#f1f5f9' }} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
         </div>

         {/* RIGHT: Discharge Status (Horizontal Bar) */}
         <div className="lg:col-span-4 flex flex-col border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
            <div className="flex items-center text-slate-700 font-semibold text-sm mb-2">
                <LogOut size={16} className="text-indigo-500 mr-2"/> Tình trạng Ra viện
            </div>
            <div className="flex-1 w-full min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={dischargeData as any[]}
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                        barSize={12}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis 
                            type="category" 
                            dataKey="name" 
                            tick={{fontSize: 11, fill: '#334155', fontWeight: 600}} 
                            width={90}
                            interval={0}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                        <Bar dataKey="value" fill={COLORS_BAR_DISCHARGE} radius={[0, 4, 4, 0]} background={{ fill: '#f1f5f9' }} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
};

export default OutcomeChart;
