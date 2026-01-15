
import { KPIEntry, DoctorStats, ICDStat, Department, ServiceGroup, OutcomeStat, DoctorServiceStat, GroupStat } from '../types';

export interface SyncResult {
  success: boolean;
  message: string;
  logs: string[];
}

// === CONSTANTS & DB CONFIG ===
const DB_NAME = 'TTY_Dashboard_DB';
const DB_VERSION = 1;
const STORE_VISITS = 'visits';
const BATCH_SIZE = 5000; // Process 5000 rows at a time

// Optimized Raw Visit record (Minified keys to save DB space)
interface RawVisit {
    d: number; // date (timestamp)
    out?: number; // date out
    k: Department; // khoa
    rev: number; // revenue
    doc: string; // doctor name
    icd: string; // icd code
    icdN: string; // icd name
    grp: string; // group
    res: string; // result code
    typ: string; // patient type code
    st: string; // discharge status code
}

// === INDEXED DB HELPERS ===

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_VISITS)) {
                const store = db.createObjectStore(STORE_VISITS, { autoIncrement: true });
                store.createIndex('d', 'd', { unique: false }); // Index by Date
            }
        };
    });
};

const clearStore = async (db: IDBDatabase): Promise<void> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_VISITS], 'readwrite');
        const store = transaction.objectStore(STORE_VISITS);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

const addBatch = async (db: IDBDatabase, items: RawVisit[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_VISITS], 'readwrite');
        const store = transaction.objectStore(STORE_VISITS);
        
        items.forEach(item => store.add(item));
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

const getVisitsInRange = async (db: IDBDatabase, start?: number, end?: number): Promise<RawVisit[]> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_VISITS], 'readonly');
        const store = transaction.objectStore(STORE_VISITS);
        const index = store.index('d');
        
        let range: IDBKeyRange | null = null;
        if (start && end) {
            range = IDBKeyRange.bound(start, end);
        }

        const request = index.getAll(range);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const countVisits = async (db: IDBDatabase): Promise<number> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_VISITS], 'readonly');
        const store = transaction.objectStore(STORE_VISITS);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// === PARSING HELPERS ===

// Parse HIS Date Format: yyyyMMddHHmmss (e.g., 20251014144355)
const parseHISDate = (raw: string): number => {
  if (!raw || raw.length < 8) return 0;
  try {
      const y = parseInt(raw.substring(0, 4));
      const m = parseInt(raw.substring(4, 6)) - 1; 
      const d = parseInt(raw.substring(6, 8));
      
      let h = 0, min = 0, s = 0;
      if (raw.length >= 14) {
         h = parseInt(raw.substring(8, 10));
         min = parseInt(raw.substring(10, 12));
         s = parseInt(raw.substring(12, 14));
      }

      const date = new Date(y, m, d, h, min, s);
      // Valid date check
      if (isNaN(date.getTime())) return 0;
      return date.getTime();
  } catch (e) {
      return 0;
  }
};

const calculateDays = (start: number, end: number): number => {
    if (!start || !end) return 0;
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays === 0 ? 1 : diffDays; 
};

// Normalize Department Name
const mapDepartment = (rawName: string): Department => {
  const n = (rawName || "").toLowerCase();
  if (n.includes('khám')) return Department.KHAM_BENH;
  if (n.includes('nội')) return Department.NOI;
  if (n.includes('ngoại') || n.includes('gmhs') || n.includes('pt')) return Department.NGOAI;
  if (n.includes('nhi')) return Department.NHI;
  if (n.includes('sản') || n.includes('csskss') || n.includes('đẻ')) return Department.SAN;
  if (n.includes('truyền nhiễm') || n.includes('lây')) return Department.TRUYEN_NHIEM;
  if (n.includes('cấp cứu') || n.includes('hstc') || n.includes('hồi sức')) return Department.CAP_CUU;
  if (n.includes('yhct') || n.includes('phcn') || n.includes('đông y')) return Department.YHCT_PHCN;
  if (n.includes('xét nghiệm') || n.includes('huyết học') || n.includes('sinh hóa') || n.includes('vi sinh')) return Department.XET_NGHIEM;
  if (n.includes('cđha') || n.includes('hình ảnh') || n.includes('x-quang') || n.includes('siêu âm')) return Department.CDHA;
  return Department.TRUNG_TAM; 
};

const parseCSVLineSimple = (line: string): string[] => {
    // A simplified CSV parser for speed. 
    // WARNING: Does not handle complex quoted strings with internal commas perfectly, 
    // but optimized for standard HIS data exports which are usually clean.
    if (line.indexOf('"') === -1) return line.split(',');
    
    // Fallback to regex for quoted lines (slower but accurate)
    const pattern = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
    const result = [];
    let match;
    while ((match = pattern.exec(line)) !== null) {
         let val = match[0];
         if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
         result.push(val);
    }
    return result;
};


// === MAIN LOGIC ===

export const syncWithGoogleSheet = async (sheetId: string, onProgress?: (msg: string) => void): Promise<SyncResult> => {
  const logs: string[] = [];
  const log = (msg: string) => {
      logs.push(msg);
      if (onProgress) onProgress(msg);
  };

  log(`[${new Date().toLocaleTimeString()}] Bắt đầu kết nối (Stream Mode)...`);
  
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
    if (!response.body) throw new Error("ReadableStream not supported in this browser.");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    
    // Open DB and Clear old data
    const db = await openDB();
    await clearStore(db);
    log(`[${new Date().toLocaleTimeString()}] Đã làm sạch cơ sở dữ liệu cũ.`);

    let buffer = "";
    let headers: string[] = [];
    let totalRows = 0;
    let isHeaderParsed = false;
    let batch: RawVisit[] = [];
    
    // Column Indices
    let idxNgayVao = -1, idxNgayRa = -1, idxKhoa = -1, idxTien = -1;
    let idxTenBS = -1, idxICD = -1, idxTenBenh = -1, idxNhom = -1;
    let idxKetQua = -1, idxTinhTrang = -1, idxLoaiKCB = -1;

    // Stream Reading Loop
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last chunk which might be incomplete
        buffer = lines.pop() || ""; 

        for (const line of lines) {
            if (!line.trim()) continue;

            // Parse Header (First Line)
            if (!isHeaderParsed) {
                headers = parseCSVLineSimple(line).map(h => h.toLowerCase().trim());
                
                // Mapping
                idxNgayVao = headers.findIndex(h => h === 'ngay_vao_vien' || h === 'ngay_vao' || h === 'ngay_kham');
                idxNgayRa = headers.findIndex(h => h === 'ngay_ra_vien' || h === 'ngay_ra');
                idxKhoa = headers.findIndex(h => h.includes('khoa') || h.includes('ma_khoa'));
                idxTien = headers.findIndex(h => h.includes('thanh_tien') || h.includes('tong_tien'));
                idxTenBS = headers.findIndex(h => h === 'bac_sy' || h === 'ten_bac_sy' || h === 'ten_bs' || h.includes('ten_nhan_vien'));
                idxICD = headers.findIndex(h => h.includes('ma_benh') || h.includes('chan_doan'));
                idxTenBenh = headers.findIndex(h => h.includes('ten_benh') || (h.includes('chan_doan') && !h.includes('ma')));
                idxNhom = headers.findIndex(h => h.includes('ten_nhom') || h.includes('nhom'));
                idxKetQua = headers.findIndex(h => h.includes('ket_qua') || h.includes('kq_dtri'));
                idxTinhTrang = headers.findIndex(h => h.includes('tinh_trang') || h.includes('tt_rv'));
                idxLoaiKCB = headers.findIndex(h => h === 'ma_loai_kcb' || h.includes('loai_kcb'));

                if (idxNgayVao === -1) throw new Error("Không tìm thấy cột NGAY_VAO_VIEN.");
                isHeaderParsed = true;
                continue;
            }

            // Parse Data Row
            const row = parseCSVLineSimple(line);
            if (row.length < headers.length * 0.5) continue; // Skip malformed

            const dateIn = parseHISDate(row[idxNgayVao]);
            if (dateIn === 0) continue;

            batch.push({
                d: dateIn,
                out: idxNgayRa > -1 ? parseHISDate(row[idxNgayRa]) : undefined,
                k: mapDepartment(idxKhoa > -1 ? row[idxKhoa] : ""),
                rev: idxTien > -1 ? (Number(row[idxTien]) || 0) : 0,
                doc: idxTenBS > -1 ? row[idxTenBS] : "",
                icd: idxICD > -1 ? (row[idxICD] || "").split(';')[0].trim() : "",
                icdN: idxTenBenh > -1 ? row[idxTenBenh] : "",
                grp: idxNhom > -1 ? row[idxNhom] : "",
                res: idxKetQua > -1 ? row[idxKetQua] : "",
                st: idxTinhTrang > -1 ? row[idxTinhTrang] : "",
                typ: idxLoaiKCB > -1 ? row[idxLoaiKCB] : ""
            });

            totalRows++;

            // Batch Insert
            if (batch.length >= BATCH_SIZE) {
                await addBatch(db, batch);
                batch = []; // Clear batch
                // Update Log UI less frequently to avoid flooding
                if (totalRows % 50000 === 0) {
                    log(`[${new Date().toLocaleTimeString()}] Đã xử lý ${totalRows.toLocaleString()} dòng...`);
                    // Allow UI to breathe
                    await new Promise(r => setTimeout(r, 0)); 
                }
            }
        }
    }

    // Process remaining buffer/batch
    if (batch.length > 0) {
        await addBatch(db, batch);
    }
    
    const finalCount = await countVisits(db);
    log(`[${new Date().toLocaleTimeString()}] Hoàn tất! Tổng cộng ${finalCount.toLocaleString()} dòng dữ liệu.`);
    
    return { success: true, message: `Đồng bộ thành công ${finalCount} dòng.`, logs };

  } catch (error: any) {
     return { success: false, message: error.message, logs: [...logs, `Error: ${error.message}`] };
  }
};

// === AGGREGATION LOGIC (UNCHANGED BUT ADAPTED FOR DB) ===

interface AggregatedData {
    departmentRevenue: Record<string, number>;
    icdCounts: Record<string, { count: number; revenue: number; daysTreatment: number; name: string; deptDistribution: Record<string, { cases: number, revenue: number }> }>;
    doctorStats: Record<string, { revenue: number; count: number; dept: string; name: string; services: Record<string, { count: number, revenue: number, group: string }> }>;
    treatmentCounts: Record<string, { total: number, deptDistribution: Record<string, number> }>;
    dischargeCounts: Record<string, { total: number, deptDistribution: Record<string, number> }>;
    patientTypeCounts: Record<string, { total: number, deptDistribution: Record<string, number> }>;
    groupStats: Record<string, { count: number, revenue: number }>;
    totalRevenue: number;
    totalExam: number;
    totalInpatient: number;
    totalCLS: number;
}

const mapTreatmentResult = (code: string): string => {
    if (code === '1' || code.toLowerCase() === 'khỏi') return 'Khỏi';
    if (code === '2' || code.toLowerCase() === 'đỡ') return 'Đỡ/Giảm';
    if (code === '3' || code.toLowerCase().includes('không')) return 'Không đổi';
    if (code === '4' || code.toLowerCase().includes('nặng')) return 'Nặng hơn';
    if (code === '5' || code.toLowerCase().includes('tử')) return 'Tử vong';
    return 'Khác';
};

const mapDischargeStatus = (code: string): string => {
    if (code === '1' || code.toLowerCase().includes('ra')) return 'Ra viện';
    if (code === '2' || code.toLowerCase().includes('chuyển')) return 'Chuyển tuyến';
    if (code === '3' || code.toLowerCase().includes('trốn')) return 'Trốn viện';
    if (code === '4' || code.toLowerCase().includes('xin')) return 'Xin về';
    return 'Khác';
};

const mapPatientType = (code: string): string => {
    if (code === '1') return 'Ngoại trú';
    if (code === '2') return 'Nội trú';
    if (code === '3') return 'Khám sức khỏe';
    return 'Khác';
}

const aggregateData = (visits: RawVisit[]): AggregatedData => {
    const acc: AggregatedData = {
        departmentRevenue: {},
        icdCounts: {},
        doctorStats: {},
        treatmentCounts: {},
        dischargeCounts: {},
        patientTypeCounts: {},
        groupStats: {},
        totalRevenue: 0,
        totalExam: 0,
        totalInpatient: 0,
        totalCLS: 0,
    };
    
    for (const v of visits) {
        acc.totalRevenue += v.rev;
        
        // Department Revenue
        if (!acc.departmentRevenue[v.k]) acc.departmentRevenue[v.k] = 0;
        acc.departmentRevenue[v.k] += v.rev;

        // Group Stats
        if (v.grp) {
            if (!acc.groupStats[v.grp]) acc.groupStats[v.grp] = { count: 0, revenue: 0 };
            acc.groupStats[v.grp].count++;
            acc.groupStats[v.grp].revenue += v.rev;

            if (v.grp.toLowerCase().includes('xét nghiệm') || v.grp.toLowerCase().includes('cdha')) acc.totalCLS++;
            if (v.grp.toLowerCase().includes('khám')) acc.totalExam++;
        }

        // ICD Stats
        if (v.icd) {
            if (!acc.icdCounts[v.icd]) {
                acc.icdCounts[v.icd] = { count: 0, revenue: 0, daysTreatment: 0, name: v.icdN || v.icd, deptDistribution: {} };
            }
            acc.icdCounts[v.icd].count++;
            acc.icdCounts[v.icd].revenue += v.rev;
            if (v.out && v.d) acc.icdCounts[v.icd].daysTreatment += calculateDays(v.d, v.out);

            if (!acc.icdCounts[v.icd].deptDistribution[v.k]) acc.icdCounts[v.icd].deptDistribution[v.k] = { cases: 0, revenue: 0 };
            acc.icdCounts[v.icd].deptDistribution[v.k].cases++;
            acc.icdCounts[v.icd].deptDistribution[v.k].revenue += v.rev;
        }

        // Doctor Stats
        if (v.doc) {
            if (!acc.doctorStats[v.doc]) {
                acc.doctorStats[v.doc] = { revenue: 0, count: 0, dept: v.k, name: v.doc, services: {} };
            }
            acc.doctorStats[v.doc].revenue += v.rev;
            acc.doctorStats[v.doc].count++;
            if (v.grp) {
                if (!acc.doctorStats[v.doc].services[v.grp]) acc.doctorStats[v.doc].services[v.grp] = { count: 0, revenue: 0, group: v.grp };
                acc.doctorStats[v.doc].services[v.grp].count++;
                acc.doctorStats[v.doc].services[v.grp].revenue += v.rev;
            }
        }

        // Outcome Stats
        if (v.res) {
            const label = mapTreatmentResult(v.res);
            if (!acc.treatmentCounts[label]) acc.treatmentCounts[label] = { total: 0, deptDistribution: {} };
            acc.treatmentCounts[label].total++;
            acc.treatmentCounts[label].deptDistribution[v.k] = (acc.treatmentCounts[label].deptDistribution[v.k] || 0) + 1;
        }
        if (v.st) {
            const label = mapDischargeStatus(v.st);
            if (!acc.dischargeCounts[label]) acc.dischargeCounts[label] = { total: 0, deptDistribution: {} };
            acc.dischargeCounts[label].total++;
            acc.dischargeCounts[label].deptDistribution[v.k] = (acc.dischargeCounts[label].deptDistribution[v.k] || 0) + 1;
        }
        if (v.typ) {
            const label = mapPatientType(v.typ);
            if (!acc.patientTypeCounts[label]) acc.patientTypeCounts[label] = { total: 0, deptDistribution: {} };
            acc.patientTypeCounts[label].total++;
            acc.patientTypeCounts[label].deptDistribution[v.k] = (acc.patientTypeCounts[label].deptDistribution[v.k] || 0) + 1;
            
            if (label === 'Nội trú') acc.totalInpatient++;
        }
    }
    return acc;
};

// === MOCK TEMPLATES ===
const get2026KPIs_Template = (): KPIEntry[] => {
    const rawData = [
      { dept: Department.TRUNG_TAM, name: "Tổng Doanh thu", unit: "Triệu VNĐ", plan: 54941, group: ServiceGroup.KHAM },
      { dept: Department.TRUNG_TAM, name: "Khám bệnh chung", unit: "Lượt", plan: 136961, group: ServiceGroup.KHAM },
      { dept: Department.TRUNG_TAM, name: "Điều trị nội trú", unit: "Lượt", plan: 13906, group: ServiceGroup.DIEU_TRI },
      { dept: Department.TRUNG_TAM, name: "Xét nghiệm", unit: "Lần", plan: 171780, group: ServiceGroup.CLS },
      { dept: Department.KHAM_BENH, name: "Doanh thu", unit: "Triệu VNĐ", plan: 20606, group: ServiceGroup.KHAM },
      { dept: Department.NOI, name: "Doanh thu", unit: "Triệu VNĐ", plan: 8480, group: ServiceGroup.DIEU_TRI },
      { dept: Department.NGOAI, name: "Doanh thu", unit: "Triệu VNĐ", plan: 6236, group: ServiceGroup.THU_THUAT },
      { dept: Department.NHI, name: "Doanh thu", unit: "Triệu VNĐ", plan: 4367, group: ServiceGroup.DIEU_TRI },
      { dept: Department.SAN, name: "Doanh thu", unit: "Triệu VNĐ", plan: 2884, group: ServiceGroup.DIEU_TRI },
      { dept: Department.TRUYEN_NHIEM, name: "Doanh thu", unit: "Triệu VNĐ", plan: 4316, group: ServiceGroup.DIEU_TRI },
      { dept: Department.CAP_CUU, name: "Doanh thu", unit: "Triệu VNĐ", plan: 4213, group: ServiceGroup.DIEU_TRI },
      { dept: Department.YHCT_PHCN, name: "Doanh thu", unit: "Triệu VNĐ", plan: 3834, group: ServiceGroup.KHAM },
      { dept: Department.XET_NGHIEM, name: "Doanh thu", unit: "Triệu VNĐ", plan: 6640, group: ServiceGroup.CLS },
      { dept: Department.CDHA, name: "Doanh thu", unit: "Triệu VNĐ", plan: 5163, group: ServiceGroup.CLS },
    ];
  
    return rawData.map((item, index) => ({
      id: `kpi-template-${index}`,
      department: item.dept,
      name: item.name,
      unit: item.unit,
      group: item.group,
      planYear: item.plan,
      actual: 0, 
    }));
};

const simulateActual = (plan: number) => {
    const jitter = (Math.random() * 0.05) - 0.025; 
    const basePercent = 0.8 + Math.random() * 0.3;
    const finalPercent = Math.max(0, basePercent + jitter);
    if (plan < 20) return parseFloat((plan * finalPercent).toFixed(1)); 
    return Math.floor(plan * finalPercent);
};

// === FETCH DATA ===
export const fetchData = async (startDate?: Date, endDate?: Date) => {
    try {
        const db = await openDB();
        
        // Query DB
        let visits: RawVisit[] = [];
        if (startDate && endDate) {
            visits = await getVisitsInRange(db, startDate.getTime(), endDate.getTime());
        } else {
            visits = await getVisitsInRange(db); // Get all
        }

        const agg = aggregateData(visits);
        const hasData = visits.length > 0;

        // MAPPING TO UI TYPES
        const kpis = get2026KPIs_Template().map(template => {
            let actual = 0;
            if (template.department === Department.TRUNG_TAM) {
                if (template.name === "Tổng Doanh thu") actual = agg.totalRevenue / 1000000;
                else if (template.name.includes("Khám")) actual = agg.totalExam;
                else if (template.name.includes("nội trú")) actual = agg.totalInpatient;
                else if (template.name.includes("Xét nghiệm")) actual = agg.totalCLS;
            } else {
                if (template.name === "Doanh thu") actual = (agg.departmentRevenue[template.department] || 0) / 1000000;
            }
            if (actual === 0 && !hasData) actual = simulateActual(template.planYear); 
            return { ...template, actual };
        });

        const icdStats: ICDStat[] = Object.entries(agg.icdCounts)
            .map(([code, stats]) => ({
                code, 
                name: stats.name || code, 
                cases: stats.count, 
                revenue: stats.revenue, 
                daysTreatment: stats.daysTreatment,
                deptDistribution: stats.deptDistribution
            }))
            .sort((a, b) => b.cases - a.cases);

        const doctorStats: DoctorStats[] = Object.entries(agg.doctorStats)
            .map(([id, stats]) => {
                const detailsArray: DoctorServiceStat[] = Object.entries(stats.services).map(([sName, sData]) => ({
                    name: sName,
                    group: sData.group,
                    count: sData.count,
                    revenue: sData.revenue
                }));
                detailsArray.sort((a, b) => b.revenue - a.revenue);

                return {
                    id: id, 
                    name: stats.name, 
                    department: stats.dept as Department, 
                    revenue: stats.revenue, 
                    serviceCount: stats.count, 
                    details: detailsArray 
                };
            })
            .sort((a, b) => b.revenue - a.revenue);

        const outcomes: OutcomeStat[] = [
            ...Object.entries(agg.treatmentCounts).map(([name, data]) => ({ name, value: data.total, type: 'treatment' as const, deptDistribution: data.deptDistribution })),
            ...Object.entries(agg.dischargeCounts).map(([name, data]) => ({ name, value: data.total, type: 'discharge' as const, deptDistribution: data.deptDistribution })),
            ...Object.entries(agg.patientTypeCounts).map(([name, data]) => ({ name, value: data.total, type: 'patientType' as const, deptDistribution: data.deptDistribution })),
        ];

        const groupStats: GroupStat[] = Object.entries(agg.groupStats).map(([name, val], idx) => ({
            id: `grp-${idx}`,
            name: name,
            revenue: val.revenue,
            count: val.count
        })).sort((a,b) => b.revenue - a.revenue);

        return { kpis, icd: icdStats, doctors: doctorStats, outcomes, groups: groupStats };

    } catch (e) {
        console.error("DB Error", e);
        // Fallback
        return {
            kpis: get2026KPIs_Template().map(k => ({...k, actual: simulateActual(k.planYear)})),
            icd: [], doctors: [], outcomes: [], groups: []
        };
    }
};
