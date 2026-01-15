import { Department, ServiceGroup } from './types';

export const DEPARTMENTS = Object.values(Department);
export const SERVICE_GROUPS = Object.values(ServiceGroup);

export const TIME_FILTERS = [
  { value: 'day', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'quarter', label: 'Quý này' },
  { value: 'year', label: 'Năm nay' },
];

export const MOCK_DOCTORS = [
  "BS CKII. Nguyễn Văn A",
  "BS CKI. Trần Thị B",
  "ThS BS. Lê Văn C",
  "BS. Phạm Thị D",
  "BS. Hoàng Văn E"
];
