
import React from 'react';
import { LayoutDashboard, FileSpreadsheet, Activity, Database, Settings, Menu, X, Bell } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  syncStatus: string;
  onSync: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, syncStatus, onSync }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Phân tích Chi tiết', icon: Activity },
    { id: 'input', label: 'Nhập liệu Kế hoạch', icon: FileSpreadsheet },
    { id: 'data', label: 'Dữ liệu Google Sheet', icon: Database },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 text-white transition-all duration-300 flex flex-col fixed h-full z-20 md:relative`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-700 h-16">
          {isSidebarOpen && <span className="font-bold text-lg truncate text-cyan-400">TTY Tịnh Biên</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-700 rounded">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-cyan-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
             {isSidebarOpen ? (
                <div className="text-xs text-slate-400">
                   <p>Phiên bản: 1.0.2</p>
                   <p>Cập nhật: 2 giờ trước</p>
                </div>
             ) : (
                <div className="flex justify-center"><Settings size={16} className="text-slate-500"/></div>
             )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
           <h1 className="text-xl font-bold text-slate-800">
             {menuItems.find(i => i.id === activeTab)?.label}
           </h1>
           
           <div className="flex items-center space-x-4">
              <button 
                onClick={onSync}
                className="flex items-center px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-200 hover:bg-green-100 transition-colors"
              >
                <Database size={14} className="mr-2" />
                {syncStatus}
              </button>
              <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                 <Bell size={20} />
                 <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-2">
                 <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-xs">AD</div>
                 <span className="text-sm font-medium text-slate-700 hidden md:block">Quản trị viên</span>
              </div>
           </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
           {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
