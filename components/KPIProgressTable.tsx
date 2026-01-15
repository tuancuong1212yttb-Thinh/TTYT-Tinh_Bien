import React from 'react';
import { KPIEntry } from '../types';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface Props {
  data: KPIEntry[];
}

const KPIProgressTable: React.FC<Props> = ({ data }) => {
  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-emerald-500';
    if (percent >= 85) return 'bg-emerald-400';
    if (percent >= 70) return 'bg-yellow-400';
    return 'bg-red-500';
  };

  const getStatusBadge = (percent: number) => {
    if (percent >= 90) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Đạt</span>;
    if (percent >= 70) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Cảnh báo</span>;
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Chậm</span>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 flex items-center">
          <TrendingUp className="mr-2 text-cyan-600" size={20} />
          Tiến độ Thực hiện Chỉ tiêu
        </h3>
        <span className="text-xs text-slate-500 italic">* Dữ liệu cập nhật real-time</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Chỉ tiêu / Khoa</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Kế hoạch</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Thực hiện</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">Tiến độ (%)</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.slice(0, 10).map((kpi) => {
              const percent = (kpi.actual / kpi.planYear) * 100;
              return (
                <tr key={kpi.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{kpi.name}</div>
                    <div className="text-xs text-slate-500">{kpi.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                    {kpi.planYear.toLocaleString()} <span className="text-xs text-slate-400">{kpi.unit}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-800">
                    {kpi.actual.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap align-middle">
                    <div className="w-full bg-slate-200 rounded-full h-2.5 mb-1">
                      <div className={`h-2.5 rounded-full ${getProgressColor(percent)}`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
                    </div>
                    <div className="text-xs text-slate-500 text-right">{percent.toFixed(1)}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusBadge(percent)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-right">
        <button className="text-sm text-cyan-600 font-medium hover:text-cyan-800">Xem tất cả &rarr;</button>
      </div>
    </div>
  );
};

export default KPIProgressTable;
