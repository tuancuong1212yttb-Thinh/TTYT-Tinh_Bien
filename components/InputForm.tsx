import React, { useState } from 'react';
import { DEPARTMENTS, SERVICE_GROUPS } from '../constants';
import { Save, Plus } from 'lucide-react';

const InputForm: React.FC = () => {
  const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0]);
  const [year, setYear] = useState(2026);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4 border-l-4 border-cyan-500 pl-3">
          Thiết lập Kế hoạch Năm {year}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Khoa / Phòng</label>
            <select 
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value as any)}
            >
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Năm tài chính</label>
            <input 
              type="number" 
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-slate-500 pb-2 border-b">
            <div className="col-span-4">Chỉ tiêu / Dịch vụ</div>
            <div className="col-span-2">ĐVT</div>
            <div className="col-span-2">Nhóm</div>
            <div className="col-span-3">Kế hoạch Năm</div>
            <div className="col-span-1"></div>
          </div>

          {[1, 2, 3, 4, 5].map((item) => (
             <div key={item} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-4">
                  <input type="text" className="w-full p-2 border border-slate-300 rounded text-sm" placeholder="Tên chỉ tiêu..." defaultValue={item === 1 ? "Khám bệnh BHYT" : ""} />
                </div>
                <div className="col-span-2">
                   <input type="text" className="w-full p-2 border border-slate-300 rounded text-sm" placeholder="Lượt" defaultValue={item === 1 ? "Lượt" : ""} />
                </div>
                <div className="col-span-2">
                   <select className="w-full p-2 border border-slate-300 rounded text-sm">
                      {SERVICE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                   </select>
                </div>
                <div className="col-span-3">
                   <input type="number" className="w-full p-2 border border-slate-300 rounded text-sm font-medium text-right" placeholder="0" />
                </div>
                <div className="col-span-1 text-center">
                   <button className="text-red-500 hover:bg-red-50 p-1 rounded">X</button>
                </div>
             </div>
          ))}
          
          <button className="flex items-center text-cyan-600 font-medium text-sm hover:underline mt-2">
            <Plus size={16} className="mr-1"/> Thêm dòng
          </button>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
          <button className="flex items-center bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-700 shadow-md transition-all">
            <Save size={18} className="mr-2" /> Lưu Kế Hoạch
          </button>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm text-blue-800">
        <strong>Lưu ý:</strong> Dữ liệu sau khi lưu sẽ được đồng bộ lên Google Sheet "KeHoach_{year}". Vui lòng kiểm tra kỹ đơn vị tính trước khi lưu.
      </div>
    </div>
  );
};

export default InputForm;