
import React, { useState, useRef, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InputForm from './components/InputForm';
import Analytics from './components/Analytics';
import { Edit2, Check, X, AlertCircle, ExternalLink, Terminal, FileText, Database } from 'lucide-react';
import { syncWithGoogleSheet } from './services/dataService';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [syncStatus, setSyncStatus] = useState('Chưa kết nối');
  const [lastSyncTime, setLastSyncTime] = useState('-');
  // Updated default ID for testing
  const [sheetId, setSheetId] = useState('1cUu001Mo3oyRskFvC34az33ggtA9hLS6'); 
  const [isEditingId, setIsEditingId] = useState(false);
  const [tempId, setTempId] = useState('');
  
  // New state for Logs
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Use a refresh trigger to force Dashboard to re-fetch
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const scrollToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [connectionLogs]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Đang kết nối...');
    setConnectionLogs([]); // Clear old logs

    // Real connection attempt with Progress Callback
    const result = await syncWithGoogleSheet(sheetId, (msg) => {
        setConnectionLogs(prev => {
            const newLogs = [...prev];
            // Only keep last 50 logs to prevent rendering lag during massive imports
            if (newLogs.length > 50) newLogs.shift(); 
            return [...newLogs, msg];
        });
    });
    
    // Final update to logs to ensure result message is seen
    setConnectionLogs(prev => [...prev, ...result.logs.filter(l => !prev.includes(l))]);
    
    if (result.success) {
        setSyncStatus('Đã đồng bộ');
        setLastSyncTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
        setRefreshTrigger(prev => prev + 1);
    } else {
        setSyncStatus('Lỗi kết nối');
    }
    setIsSyncing(false);
  };

  const startEdit = () => {
    setTempId(sheetId);
    setIsEditingId(true);
  };

  const saveId = () => {
    setSheetId(tempId);
    setIsEditingId(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard key={refreshTrigger} />;
      case 'input':
        return <InputForm />;
      case 'analytics':
        return <Analytics />;
      case 'data':
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-4xl mx-auto mt-6">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Trung tâm Kết nối Dữ liệu</h2>
                    <p className="text-slate-500">Quản lý nguồn dữ liệu từ Google Sheets</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Config */}
                    <div className="md:col-span-2 space-y-6">
                        {/* ID Input */}
                        <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Google Spreadsheet ID</label>
                             <div className="flex items-center gap-2">
                                {isEditingId ? (
                                    <>
                                        <input 
                                            type="text" 
                                            value={tempId}
                                            onChange={(e) => setTempId(e.target.value)}
                                            className="flex-1 p-2 text-sm border border-cyan-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            placeholder="Nhập ID (ví dụ: 1BxiMVs...)"
                                        />
                                        <button onClick={saveId} className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200"><Check size={18}/></button>
                                        <button onClick={() => setIsEditingId(false)} className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200"><X size={18}/></button>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex-1 bg-white p-2 border border-slate-200 rounded text-sm font-mono text-slate-700 truncate select-all">
                                            {sheetId}
                                        </div>
                                        <button onClick={startEdit} className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-slate-100 rounded transition-colors"><Edit2 size={18}/></button>
                                    </>
                                )}
                             </div>
                             <p className="text-xs text-slate-400 mt-2 italic">ID là chuỗi ký tự nằm giữa /d/ và /edit trong URL của Sheet.</p>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex items-center justify-between bg-slate-50 p-5 rounded-lg border border-slate-200">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Trạng thái hiện tại</p>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${syncStatus.includes('Đã đồng bộ') ? 'bg-green-500' : syncStatus.includes('Lỗi') ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                    <span className="font-semibold text-slate-800">{syncStatus}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Cập nhật: {lastSyncTime}</p>
                            </div>
                            <button 
                                onClick={handleSync} 
                                disabled={isSyncing}
                                className={`px-5 py-2.5 rounded-lg font-medium text-white transition-all shadow-md flex items-center ${
                                    isSyncing
                                    ? 'bg-slate-400 cursor-not-allowed' 
                                    : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
                                }`}
                            >
                                {isSyncing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Đang xử lý...
                                    </>
                                ) : 'Kết nối & Đồng bộ'}
                            </button>
                        </div>

                        {/* Logs Console */}
                        <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-green-400 h-48 overflow-y-auto border border-slate-700 shadow-inner">
                            <div className="flex items-center text-slate-400 mb-2 border-b border-slate-700 pb-1">
                                <Terminal size={14} className="mr-2"/> Connection Logs (Big Data Mode)
                            </div>
                            {connectionLogs.length === 0 && (
                                <div className="text-slate-600 italic mt-2">Đang chờ lệnh kết nối...</div>
                            )}
                            {connectionLogs.map((log, idx) => (
                                <div key={idx} className="mb-1 break-all">
                                    <span className="text-slate-500 mr-2">{'>'}</span>{log}
                                </div>
                            ))}
                            <div ref={logEndRef} />
                        </div>
                    </div>

                    {/* Column 2: Instructions */}
                    <div className="md:col-span-1 space-y-4">
                        <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 text-sm">
                            <h3 className="font-bold text-blue-800 mb-3 flex items-center">
                                <AlertCircle size={16} className="mr-2"/>
                                Hướng dẫn Kết nối
                            </h3>
                            <div className="space-y-3 text-blue-900">
                                <p>Để ứng dụng đọc được dữ liệu, bạn cần <strong>Publish to web</strong>:</p>
                                <ol className="list-decimal pl-4 space-y-2 marker:text-blue-500">
                                    <li>Mở file Google Sheet.</li>
                                    <li>Menu <strong>File (Tệp)</strong> &rarr; <strong>Share</strong> &rarr; <strong>Publish to web</strong>.</li>
                                    <li>Chọn Sheet cần lấy, định dạng <strong>CSV</strong>.</li>
                                    <li>Nhấn <strong>Publish</strong>.</li>
                                    <li>Copy ID từ URL trang web.</li>
                                </ol>
                            </div>
                        </div>

                        <div className="bg-emerald-50 p-5 rounded-lg border border-emerald-100 text-sm">
                            <h3 className="font-bold text-emerald-800 mb-3 flex items-center">
                                <Database size={16} className="mr-2"/>
                                Dữ liệu Lớn (1M+)
                            </h3>
                            <div className="space-y-2 text-emerald-900">
                                <p>Hệ thống sử dụng công nghệ <strong>IndexedDB</strong> và <strong>Streaming</strong> để xử lý file lớn mà không gây treo máy.</p>
                                <p>Quá trình đồng bộ có thể mất 30s - 1 phút tùy tốc độ mạng.</p>
                                <p className="text-xs italic mt-2 opacity-80">Vui lòng không tắt trình duyệt khi đang "Đang xử lý...".</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
      default:
        return <Dashboard key={refreshTrigger} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      syncStatus={syncStatus}
      onSync={() => { setActiveTab('data'); }} // Redirect to Data tab when clicking sync in header
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
