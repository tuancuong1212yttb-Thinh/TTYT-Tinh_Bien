
export enum Department {
  TRUNG_TAM = "Toàn Trung tâm",
  KHAM_BENH = "Khoa Khám bệnh",
  NOI = "Khoa Nội",
  NGOAI = "Khoa Ngoại - PT - GMHS",
  NHI = "Khoa Nhi",
  SAN = "Khoa CSSKSS & Phụ sản",
  TRUYEN_NHIEM = "Khoa Truyền nhiễm",
  CAP_CUU = "Khoa CC - HSTC - CĐ",
  YHCT_PHCN = "Khoa YHCT - PHCN",
  XET_NGHIEM = "Khoa XN - KSNK",
  CDHA = "Khoa CĐHA",
}

export enum ServiceGroup {
  KHAM = "Khám bệnh",
  DIEU_TRI = "Điều trị nội trú",
  CLS = "Cận lâm sàng",
  THU_THUAT = "Thủ thuật - Phẫu thuật",
  DUOC = "Thuốc - Vật tư",
}

export interface KPIEntry {
  id: string;
  name: string;
  unit: string;
  department: Department;
  planYear: number;
  actual: number;
  group: ServiceGroup;
}

export interface DoctorServiceStat {
  name: string;
  group: string;
  count: number;
  revenue: number;
}

export interface DoctorStats {
  id: string;
  name: string;
  department: Department;
  revenue: number;
  serviceCount: number;
  // Detailed breakdown
  details: DoctorServiceStat[]; 
}

export interface ICDStat {
  code: string;
  name: string;
  cases: number;
  revenue: number;
  daysTreatment: number;
  // Support Filtering: Breakdown by Department
  deptDistribution?: Record<string, { cases: number, revenue: number }>;
}

export interface ServiceStat {
  id: string;
  name: string;
  category: 'KT' | 'THUOC'; // Kỹ thuật hoặc Thuốc
  count: number;
  revenue: number;
}

export interface OutcomeStat {
  name: string;
  value: number;
  type: 'treatment' | 'discharge' | 'patientType'; // treatment: Kết quả, discharge: Ra viện, patientType: Loại KCB
  // Support Filtering: Breakdown by Department
  deptDistribution?: Record<string, number>;
}

export interface GroupStat {
  id: string;
  name: string;
  revenue: number;
  count: number;
}

export interface DateFilter {
  type: 'day' | 'week' | 'month' | 'quarter' | 'year';
  value: string;
}
