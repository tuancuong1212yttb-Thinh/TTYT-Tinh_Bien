
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { fetchData } from '../services/dataService';
import { KPIEntry, ICDStat, DoctorStats, OutcomeStat, Department, ServiceGroup } from '../types';
import KPIProgressTable from './KPIProgressTable';
import RevenueChart from './charts/RevenueChart';
import DoctorRanking from './charts/DoctorRanking';
import OutcomeChart from './charts/OutcomeChart';
import ICDAnalysis from './ICDAnalysis';
import { Filter, Calendar, Users, Briefcase, Stethoscope, ArrowRight, ChevronDown, Check, X } from 'lucide-react';

// Get list of departments for filter
const DEPARTMENTS_LIST = Object.values(Department).filter(d => d !== Department.TRUNG_TAM);

const Dashboard: React.FC = () => {
  // --- DATA STATE ---
  const [data, setData] = useState<{
    kpis: KPIEntry[];
    icd: ICDStat[];
    doctors: DoctorStats[];
    outcomes: OutcomeStat[];
  } | null>(null);
  
  const [loading, setLoading] = useState(true);

  // --- FILTER STATES ---
  // 1. Time
  const getYesterday = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  };
  const [timeFilter, setTimeFilter] = useState('Năm nay'); // Default to Year for full overview
  const [customStartDate, setCustomStartDate] = useState(getYesterday());
  const [customEndDate, setCustomEndDate] = useState(getYesterday());

  // 2. Multi-select Departments
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const deptDropdownRef = useRef<HTMLDivElement>(null);

  // 3. Other Filters
  const [selectedPatientType, setSelectedPatientType] = useState('all');
  const [selectedServiceGroup, setSelectedServiceGroup] = useState('all');

  // --- DATA FETCHING WITH DATE FILTER ---
  useEffect(() => {
    setLoading(true);

    // Calculate Start/End Date based on filter
    const now = new Date();
    let start = new Date(now.getFullYear(), 0, 1); // Default Year start
    let end = new Date(now.getFullYear(), 11, 31, 23, 59, 59); // Year end

    if (timeFilter === 'Hôm nay') {
        start = new Date(now.setHours(0,0,0,0));
        end = new Date(now.setHours(23,59,59,999));
    } else if (timeFilter === 'Hôm qua') {
        const y = new Date(now); y.setDate(y.getDate() - 1);
        start = new Date(y.setHours(0,0,0,0));
        end = new Date(y.setHours(23,59,59,999));
    } else if (timeFilter === 'Tuần này') {
        const day = now.getDay(); 
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        start = new Date(now.setDate(diff));
        start.setHours(0,0,0,0);
        end = new Date(); // To now
    } else if (timeFilter === 'Tháng này') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (timeFilter === 'Quý này') {
        const currQuarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), currQuarter * 3, 1);
        end = new Date(now.getFullYear(), (currQuarter + 1) * 3, 0, 23, 59, 59);
    } else if (timeFilter === 'Tùy chỉnh...') {
        start = new Date(customStartDate);
        start.setHours(0,0,0,0);
        end = new Date(customEndDate);
        end.setHours(23,59,59,999);
    }

    fetchData(start, end).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [timeFilter, customStartDate, customEndDate]);

  // --- CLICK OUTSIDE TO CLOSE DROPDOWN ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target as Node)) {
        setIsDeptDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- FILTER LOGIC (CLIENT-SIDE FOR DEPT/GROUP) ---
  const filteredData = useMemo(() => {
    if (!data) return null;

    // Helper: Check if a department is selected (empty means ALL)
    const isDeptSelected = (dept: string) => {
      if (selectedDepartments.length === 0) return true;
      if (dept === Department.TRUNG_TAM) return true; 
      return selectedDepartments.includes(dept);
    };

    // 1. Filter KPIs / Revenue
    // Revenue logic: Only keep KPIs of selected depts.
    const filteredKPIs = data.kpis.filter(item => {
      const matchDept = isDeptSelected(item.department);
      const matchGroup = selectedServiceGroup === 'all' || item.group === selectedServiceGroup;
      return matchDept && matchGroup;
    });

    // 2. Filter Doctors
    let filteredDoctors = data.doctors.filter(item => isDeptSelected(item.department));

    if (selectedServiceGroup !== 'all') {
       // Deep filter: Re-calculate doctor revenue based on service group
       filteredDoctors = filteredDoctors.map(doc => {
          const filteredDetails = doc.details.filter(d => 
             d.group.toLowerCase().includes(selectedServiceGroup.toLowerCase()) || 
             (selectedServiceGroup === ServiceGroup.KHAM && d.group.includes('Khám')) ||
             (selectedServiceGroup === ServiceGroup.CLS && (d.group.includes('Xét nghiệm') || d.group.includes('CĐHA')))
          );
          
          const newRevenue = filteredDetails.reduce((sum, d) => sum + d.revenue, 0);
          const newCount = filteredDetails.reduce((sum, d) => sum + d.count, 0);

          return { ...doc, revenue: newRevenue, serviceCount: newCount, details: filteredDetails };
       }).filter(doc => doc.revenue > 0); 
    }

    // 3. Filter Outcomes 
    const filteredOutcomes = data.outcomes.map(item => {
        let newValue = 0;
        if (selectedDepartments.length === 0) {
            newValue = item.value;
        } else {
            selectedDepartments.forEach(dept => {
                newValue += item.deptDistribution?.[dept] || 0;
            });
        }
        return { ...item, value: newValue };
    }).filter(item => {
        if (selectedPatientType !== 'all' && item.type === 'patientType') {
             // Optional: strict filtering for patient type chart
             // return item.name.includes(selectedPatientType);
             return true; 
        }
        return item.value > 0;
    });

    // 4. Filter ICD
    const filteredICD = data.icd.map(item => {
        let newCases = 0;
        let newRevenue = 0;

        if (selectedDepartments.length === 0) {
            newCases = item.cases;
            newRevenue = item.revenue;
        } else {
            selectedDepartments.forEach(dept => {
                newCases += item.deptDistribution?.[dept]?.cases || 0;
                newRevenue += item.deptDistribution?.[dept]?.revenue || 0;
            });
        }
        return { ...item, cases: newCases, revenue: newRevenue };
    })
    .filter(i => i.cases > 0)
    .sort((a, b) => b.cases - a.cases)
    .slice(0, 5); 

    return {
      kpis: filteredKPIs,
      icd: filteredICD, 
      doctors: filteredDoctors,
      outcomes: filteredOutcomes
    };
  }, [data, selectedDepartments, selectedServiceGroup, selectedPatientType]);


  // --- HANDLERS ---
  const toggleDepartment = (dept: string) => {
    setSelectedDepartments(prev => {
      if (prev.includes(dept)) return prev.filter(d => d !== dept);
      return [...prev, dept];
    });
  };

  const selectAllDepartments = () => {
    if (selectedDepartments.length === DEPARTMENTS_LIST.length) {
      setSelectedDepartments([]); // Deselect all (which implies ALL in logic)
    } else {
      setSelectedDepartments(DEPARTMENTS_LIST);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!data || !filteredData) return null;

  // Recalculate Totals based on Filtered Data
  const totalRevenueFiltered = filteredData.kpis
    .filter(k => k.name.includes("Doanh thu") && k.department !== Department.TRUNG_TAM)
    .reduce((sum, item) => sum + item.actual, 0);

  const totalPlanFiltered = filteredData.kpis
    .filter(k => k.name.includes("Doanh thu") && k.department !== Department.TRUNG_TAM)
    .reduce((sum, item) => sum + item.planYear, 0);
    
  const revenuePercent = totalPlanFiltered ? (totalRevenueFiltered / totalPlanFiltered) * 100 : 0;

  const totalExamFiltered = filteredData.kpis
      .filter(k => k.department !== Department.TRUNG_TAM && k.group === ServiceGroup.KHAM)
      .reduce((acc, curr) => acc + curr.actual, 0); 

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-3 items-center relative z-10">
        
        {/* Date Filter Dropdown */}
        <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 bg-white hover:border-cyan-500 transition-colors flex-1 min-w-[140px] max-w-[200px]">
          <Calendar size={18} className="text-slate-500 mr-2 flex-shrink-0" />
          <select 
            className="bg-transparent border-none outline-none text-sm text-slate-700 w-full cursor-pointer truncate" 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option>Hôm nay</option>
            <option>Hôm qua</option>
            <option>Tuần này</option>
            <option>Tháng này</option>
            <option>Quý này</option>
            <option>Năm nay</option>
            <option>Tùy chỉnh...</option>
          </select>
        </div>

        {/* Custom Date Pickers */}
        {timeFilter === 'Tùy chỉnh...' && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
             <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all shadow-sm group cursor-pointer relative">
                <Calendar size={14} className="text-slate-400 mr-2 pointer-events-none" />
                <input 
                  type="date" 
                  className="bg-transparent border-none outline-none text-xs text-slate-700 w-[110px] p-0 cursor-pointer"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
             </div>
             <ArrowRight size={14} className="text-slate-400" />
             <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all shadow-sm group cursor-pointer relative">
                <Calendar size={14} className="text-slate-400 mr-2 pointer-events-none" />
                <input 
                  type="date" 
                  className="bg-transparent border-none outline-none text-xs text-slate-700 w-[110px] p-0 cursor-pointer"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
             </div>
          </div>
        )}

        {/* --- MULTI-SELECT DEPARTMENT FILTER --- */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]" ref={deptDropdownRef}>
          <div 
            className="flex items-center justify-between border border-slate-300 rounded-lg px-3 py-2 bg-white hover:border-cyan-500 transition-colors cursor-pointer"
            onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
          >
            <div className="flex items-center truncate">
              <Briefcase size={18} className="text-slate-500 mr-2 flex-shrink-0" />
              <span className="text-sm text-slate-700 truncate">
                {selectedDepartments.length === 0 
                  ? "Tất cả khoa/phòng" 
                  : selectedDepartments.length === DEPARTMENTS_LIST.length 
                    ? "Tất cả khoa/phòng"
                    : `${selectedDepartments.length} khoa đã chọn`}
              </span>
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDeptDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Dropdown Menu */}
          {isDeptDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-[300px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
               <div className="p-2 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <span className="text-xs font-bold text-slate-500 uppercase px-2">Danh sách khoa</span>
                  {selectedDepartments.length > 0 && (
                    <button onClick={() => setSelectedDepartments([])} className="text-xs text-red-500 hover:text-red-700 flex items-center px-2">
                       <X size={12} className="mr-1"/> Bỏ chọn
                    </button>
                  )}
               </div>
               <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                  {/* Select All Option */}
                  <div 
                    className="flex items-center p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                    onClick={selectAllDepartments}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${selectedDepartments.length === DEPARTMENTS_LIST.length ? 'bg-cyan-600 border-cyan-600' : 'border-slate-300'}`}>
                       {selectedDepartments.length === DEPARTMENTS_LIST.length && <Check size={12} className="text-white" />}
                    </div>
                    <span className="text-sm font-medium text-slate-700">Chọn tất cả</span>
                  </div>
                  
                  <div className="h-px bg-slate-100 my-1"></div>

                  {/* Individual Departments */}
                  {DEPARTMENTS_LIST.map(dept => {
                    const isSelected = selectedDepartments.includes(dept);
                    return (
                      <div 
                        key={dept} 
                        className="flex items-center p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => toggleDepartment(dept)}
                      >
                         <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${isSelected ? 'bg-cyan-600 border-cyan-600' : 'border-slate-300'}`}>
                            {isSelected && <Check size={12} className="text-white" />}
                         </div>
                         <span className="text-sm text-slate-700">{dept}</span>
                      </div>
                    );
                  })}
               </div>
            </div>
          )}
        </div>

        {/* Object/Patient Type Filter */}
        <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 bg-white hover:border-cyan-500 transition-colors flex-1 min-w-[160px] max-w-[220px]">
          <Users size={18} className="text-slate-500 mr-2 flex-shrink-0" />
          <select 
            className="bg-transparent border-none outline-none text-sm text-slate-700 w-full cursor-pointer truncate"
            value={selectedPatientType}
            onChange={(e) => setSelectedPatientType(e.target.value)}
          >
            <option value="all">Tất cả đối tượng</option>
            <option value="BHYT">BHYT</option>
            <option value="Viện phí">Viện phí</option>
            <option value="Yêu cầu">Yêu cầu</option>
          </select>
        </div>

        {/* Service Group Filter */}
        <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 bg-white hover:border-cyan-500 transition-colors flex-1 min-w-[160px] max-w-[220px]">
          <Stethoscope size={18} className="text-slate-500 mr-2 flex-shrink-0" />
          <select 
            className="bg-transparent border-none outline-none text-sm text-slate-700 w-full cursor-pointer truncate"
            value={selectedServiceGroup}
            onChange={(e) => setSelectedServiceGroup(e.target.value)}
          >
            <option value="all">Tất cả nhóm dịch vụ</option>
            {Object.values(ServiceGroup).map(g => (
                <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Apply Button */}
        <button className="flex items-center justify-center bg-emerald-700 text-white px-5 py-2 rounded-lg hover:bg-emerald-800 transition-colors shadow-sm font-medium text-sm ml-auto md:ml-0">
          <Filter size={16} className="mr-2" />
          Áp dụng
        </button>
      </div>

      {/* Overview Cards (Dynamic) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-cyan-500">
           <div className="text-slate-500 text-sm font-medium mb-1">
             {selectedDepartments.length > 0 ? "Doanh thu (Đã lọc)" : "Tổng Doanh thu"}
             {totalPlanFiltered > 0 && <span className="opacity-75"> (KH: {(totalPlanFiltered/1000).toFixed(1)} Tỷ)</span>}
           </div>
           <div className="text-2xl font-bold text-slate-800">{(totalRevenueFiltered / 1000).toFixed(1)} Tỷ</div>
           <div className={`text-xs mt-2 font-medium ${revenuePercent >= 100 ? 'text-emerald-600' : 'text-orange-500'}`}>
             Đạt {revenuePercent.toFixed(1)}% chỉ tiêu
           </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
           <div className="text-slate-500 text-sm font-medium mb-1">Lượt Dịch vụ / Khám</div>
           <div className="text-2xl font-bold text-slate-800">{totalExamFiltered.toLocaleString()}</div>
           <div className="text-xs mt-2 text-emerald-600 font-medium">Đang hoạt động</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
           <div className="text-slate-500 text-sm font-medium mb-1">Điều trị Nội trú</div>
           <div className="text-2xl font-bold text-slate-800">
             {filteredData.kpis.find(k => k.name.includes("nội trú"))?.actual.toLocaleString() || 0}
           </div>
           <div className="text-xs mt-2 text-slate-400 font-medium">Bệnh nhân hiện diện</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-red-500">
           <div className="text-slate-500 text-sm font-medium mb-1">Cảnh báo tồn kho</div>
           <div className="text-2xl font-bold text-slate-800">3</div>
           <div className="text-xs mt-2 text-red-500 font-medium">Cần xử lý ngay</div>
        </div>
      </div>
      
      {/* Secondary Grid: Outcome & ICD (Moved UP) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2">
             <OutcomeChart data={filteredData.outcomes} />
         </div>
         <div className="lg:col-span-1">
             <ICDAnalysis data={filteredData.icd} />
         </div>
      </div>

      {/* Main Grid: Revenue & Doctor (Moved DOWN) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Passed timeFilter prop here */}
          <RevenueChart data={filteredData.kpis} timeFilter={timeFilter} />
        </div>
        <div className="lg:col-span-1">
          <DoctorRanking data={filteredData.doctors} />
        </div>
      </div>

      {/* Bottom Grid: KPI Table (Filtered) */}
      <div className="grid grid-cols-1">
        <KPIProgressTable data={filteredData.kpis} />
      </div>
    </div>
  );
};

export default Dashboard;
