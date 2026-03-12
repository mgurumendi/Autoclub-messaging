import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageCircle,
  UserPlus,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Search,
  Trash2,
  Clock,
  X,
  Settings,
  User,
  Play,
  SkipForward,
  History,
  LayoutDashboard,
  Send,
  Smartphone,
  FileSpreadsheet,
  LogOut,
  Car,
  ChevronRight,
  Wallet,
  Gavel,
  PlusCircle,
  Calendar as CalendarIcon,
  UploadCloud,
  Zap,
  Flame,
  Bird,
  ShieldCheck,
  Hammer,
  Gem,
  Sparkles,
  Wand2,
  Scroll,
  Trophy,
  Globe
} from 'lucide-react';

const DEFAULT_EXECUTIVES = [
  'Fabiola Narváez',
  'Gianella Baux',
  'Jordy Cruz',
  'Miguel Gurumendi',
];

export default function App() {
  // --- CARGA DE LIBRERÍA EXCEL ---
  useEffect(() => {
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // --- ESTADOS ---
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [clients, setClients] = useState([]);
  const [executives, setExecutives] = useState([]); 
  const [senderNumber, setSenderNumber] = useState('0963098362');
  const [view, setView] = useState('overview'); 
  const [adjSubView, setAdjSubView] = useState('ADP'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAdjImportModal, setShowAdjImportModal] = useState(false);
  const [showUserMgmtModal, setShowUserMgmtModal] = useState(false); 
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); 
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  const [newExecName, setNewExecName] = useState('');
  const [importingSubType, setImportingSubType] = useState('ADP'); 
  const [notification, setNotification] = useState(null);

  const initialClientState = {
    name: '', phone: '', installmentValue: '', planAmount: '', type: 'standard', subType: 'ADP', overdueCount: 1 
  };
  const [newClient, setNewClient] = useState(initialClientState);

  // --- EFECTOS INTERACTIVOS (PARTÍCULAS MÁGICAS) ---
  const [particles, setParticles] = useState([]);
  const handleMouseMove = (e) => {
    if (Math.random() > 0.88) {
      const newParticle = { id: Math.random(), x: e.clientX, y: e.clientY, size: Math.random() * 3 + 2 };
      setParticles(prev => [...prev.slice(-15), newParticle]);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setParticles(prev => prev.slice(1)), 150);
    return () => clearInterval(timer);
  }, []);

  // --- UTILIDADES ---
  const showToast = (message) => {
    setNotification({ message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogout = () => {
    setIsDataLoaded(false);
    setClients([]);
    setCurrentUser(null);
    setView('overview');
  };

  const generateUniqueId = (prefix = 'cli') => {
    const userPrefix = currentUser ? currentUser.replace(/\s+/g, '').substring(0, 3) : 'usr';
    return `${userPrefix}-${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  };

  // --- MOTOR DE CÁLCULO FINANCIERO (MORA Y COBRANZA ACV) ---
  const calculateFinancials = (client) => {
    try {
      if (!client) return { totalBase: 0, totalMora: 0, totalGasto: 0, grandTotal: 0, breakdown: [] };
      const cuota = parseFloat(client.installmentValue) || 0;
      const count = Math.max(0, parseInt(client.overdueCount) || 0);
      const montoPlan = parseFloat(client.planAmount) || 0;
      const isACV = client.subType === 'ACV';
      const today = new Date();

      if (!isACV) {
        const totalNeto = cuota * count;
        return { totalBase: totalNeto, totalMora: 0, totalGasto: 0, grandTotal: totalNeto, breakdown: [] };
      }

      let tapDecimal = montoPlan > 0 ? (((cuota * 72) - montoPlan) / montoPlan) / 6 : 0;
      let totalMoraValue = 0, totalGastoValue = 0, breakdown = [];

      for (let i = 0; i < count; i++) {
        const dueDate = new Date(today.getFullYear(), today.getMonth() - i, 5);
        const days = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
        let recargoPerc = days >= 61 ? 0.10 : (days >= 31 ? 0.09 : (days >= 16 ? 0.07 : 0.05));
        const tasaAnualMora = tapDecimal + (tapDecimal * recargoPerc);
        const moraMes = (cuota * (tasaAnualMora / 365)) * days;
        const fee = (days > 15) ? 18.00 : 0; 

        totalMoraValue += moraMes;
        totalGastoValue += fee;
        
        breakdown.push({ 
          date: dueDate.toLocaleDateString('es-EC'), 
          days, 
          cuotaBase: cuota,
          moraValue: moraMes, 
          collectionFee: fee, 
          subtotal: cuota + moraMes + fee 
        });
      }

      const totalBase = cuota * count;
      return { 
        totalBase,
        totalMora: totalMoraValue, 
        totalGasto: totalGastoValue, 
        grandTotal: totalBase + totalMoraValue + totalGastoValue, 
        breakdown 
      };
    } catch (e) { return { totalBase: 0, totalMora: 0, totalGasto: 0, grandTotal: 0, breakdown: [] }; }
  };

  const sendWhatsApp = (client) => {
    if (!client) return;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : 'Buenas tardes';
    const calc = calculateFinancials(client);
    
    let message = `${greeting} *${client.name.toUpperCase()}*. Esperando que se encuentre muy bien.\n`;
    message += `Le saluda *${currentUser}* del área de cartera Auto Club.\n`;
    message += `Le escribo para recordarle sus pagos pendientes:\n\n`;
    
    message += `*AUTO CLUB - REPORTE DE PAGO*\n`;
    message += `--------------------------------------------\n`;
    message += `*APORTES PENDIENTES DE PAGO*\n`;
    message += `--------------------------------------------\n`;
    message += `*Cliente:* ${client.name.toUpperCase()}\n`;
    message += `*Estado:* ${client.type === 'standard' ? 'ESTÁNDAR' : `ADJUDICADO (${client.subType})`}\n`;
    message += `*Cuota Mensual:* $${parseFloat(client.installmentValue).toFixed(2)}\n`;
    message += `*# Ctas. Vencidas:* ${client.overdueCount}\n`;
    message += `--------------------------------------------\n`;
    message += `*DETALLE DE DEUDA:*\n`;

    if (client.subType === 'ACV' && calc.breakdown.length > 0) {
      calc.breakdown.forEach((item, index) => {
        message += `\n*#${index + 1} | Vence:* ${item.date}\n`;
        message += `| Cuota: $${item.cuotaBase.toFixed(2)}\n`;
        message += `| Mora (${item.days} d.): $${item.moraValue.toFixed(2)}\n`;
        message += `| Gto. Cobranza: $${item.collectionFee.toFixed(2)}\n`;
        message += `| *SUBTOTAL: $${item.subtotal.toFixed(2)}*\n`;
      });
    } else {
      message += `\n*Total Cuotas:* $${calc.totalBase.toFixed(2)}\n`;
      message += `| *SUBTOTAL: $${calc.totalBase.toFixed(2)}*\n`;
    }

    message += `\n--------------------------------------------\n`;
    if (client.subType === 'ACV') {
      message += `Valor Mora Total: $${calc.totalMora.toFixed(2)}\n`;
      message += `Gastos Cobranza: $${calc.totalGasto.toFixed(2)}\n`;
    }
    message += `💰 *TOTAL A PAGAR: $${calc.grandTotal.toFixed(2)}*\n`;
    message += `--------------------------------------------\n\n`;
    message += `Agradecemos realizar su pago a la brevedad y compartir el comprobante.`;

    let phone = (client.phone || '').toString().replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '593' + phone.substring(1); else if (phone.length === 9) phone = '593' + phone;
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
    
    setClients(prev => prev.map(c => c.id === client.id ? { ...c, lastMessage: new Date().toISOString().split('T')[0], messageCount: (c.messageCount || 0) + 1 } : c));
  };

  // --- PERSISTENCIA ---
  useEffect(() => {
    const savedExecs = localStorage.getItem('cobranzas_v6_executives');
    setExecutives(savedExecs ? JSON.parse(savedExecs) : DEFAULT_EXECUTIVES);
  }, []);

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      const userKey = currentUser.replace(/\s+/g, '').toLowerCase();
      setTimeout(() => {
        const savedData = localStorage.getItem(`cobranzas_v6_data_${userKey}`);
        setClients(savedData ? JSON.parse(savedData) : []);
        setLoading(false);
        setIsDataLoaded(true);
      }, 400);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && isDataLoaded && !loading) {
      const userKey = currentUser.replace(/\s+/g, '').toLowerCase();
      localStorage.setItem(`cobranzas_v6_data_${userKey}`, JSON.stringify(clients));
    }
  }, [clients, currentUser, loading, isDataLoaded]);

  // --- GESTIÓN DE BASES ---
  const handleClearDatabase = () => {
    if (deleteTarget === 'all') {
      setClients([]);
    } else if (deleteTarget === 'standard') {
      setClients(prev => prev.filter(c => c.type !== 'standard'));
    } else {
      setClients(prev => prev.filter(c => c.subType !== deleteTarget));
    }
    setShowDeleteConfirm(false);
    showToast("Bóveda purificada.");
  };

  const handleOpenDeleteConfirm = (target) => {
    setDeleteTarget(target);
    setShowDeleteConfirm(true);
  };

  const handleAddExecutive = (e) => {
    e.preventDefault();
    if (!newExecName.trim() || executives.includes(newExecName.trim())) return;
    const newList = [...executives, newExecName.trim()];
    setExecutives(newList);
    localStorage.setItem('cobranzas_v6_executives', JSON.stringify(newList));
    setNewExecName('');
  };

  const handleDeleteExecutive = (name) => {
    const newList = executives.filter(e => e !== name);
    setExecutives(newList);
    localStorage.setItem('cobranzas_v6_executives', JSON.stringify(newList));
    if (currentUser === name) handleLogout();
  };

  const handleOpenManualModal = (type, subType = 'ADP') => {
    setNewClient({ ...initialClientState, type, subType });
    setShowAddModal(true);
  };

  const handleFileUpload = (e, type, subType) => {
    const file = e?.target?.files?.[0];
    if (!file || !window.XLSX) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const workbook = window.XLSX.read(new Uint8Array(evt.target.result), { type: 'array' });
        const rows = window.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        const newBatch = rows.slice(1).filter(r => r[0] && r[1]).map(row => ({
          id: generateUniqueId(subType),
          name: String(row[0]).trim(),
          phone: String(row[1]).replace(/\D/g, ''),
          installmentValue: parseFloat(String(row[2]).replace(/[^\d.]/g, '')) || 0,
          overdueCount: parseInt(String(row[3]).replace(/[^\d.]/g, '')) || 1,
          planAmount: parseFloat(String(row[4]).replace(/[^\d.]/g, '')) || 0,
          type, subType, status: 'active', messageCount: 0, lastMessage: null, paidToday: 0
        }));
        setClients(prev => [...prev, ...newBatch]);
        showToast(`${newBatch.length} registros invocados.`);
      } catch (err) { showToast("Error en el pergamino."); }
      finally { setShowImportModal(false); setShowAdjImportModal(false); }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAddClient = (e) => {
    e.preventDefault();
    setClients(prev => [...prev, { ...newClient, id: generateUniqueId(newClient.subType), status: 'active', messageCount: 0, lastMessage: null, paidToday: 0 }]);
    setShowAddModal(false);
    showToast("Mago registrado.");
  };

  const filteredList = useMemo(() => {
    const base = view === 'standard' 
      ? clients.filter(c => c && c.type === 'standard') 
      : clients.filter(c => c && c.type === 'adjudicated' && c.subType === adjSubView);
    return base.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [view, clients, adjSubView, searchTerm]);

  const stats = useMemo(() => {
    if (!Array.isArray(clients)) return { std: 0, adp: 0, acv: 0, total: 0 };
    const std = clients.filter(c => c && c.type === 'standard').reduce((acc, c) => acc + (parseFloat(c.installmentValue) * parseFloat(c.overdueCount)), 0);
    const adp = clients.filter(c => c && c.subType === 'ADP').reduce((acc, c) => acc + (parseFloat(c.installmentValue) * parseFloat(c.overdueCount)), 0);
    const acv = clients.filter(c => c && c.subType === 'ACV').reduce((acc, c) => acc + calculateFinancials(c).grandTotal, 0);
    return { std, adp, acv, total: std + adp + acv };
  }, [clients]);

  return (
    <div className="min-h-screen bg-slate-950 font-serif text-amber-50 relative overflow-x-hidden selection:bg-amber-500/30" onMouseMove={handleMouseMove}>
      
      {/* VELAS FLOTANTES */}
      <div className="candle-container">
        <div className="candle" style={{ left: '10%', animationDelay: '0s' }}></div>
        <div className="candle" style={{ left: '40%', animationDelay: '2s' }}></div>
        <div className="candle" style={{ left: '70%', animationDelay: '1s' }}></div>
        <div className="candle" style={{ left: '90%', animationDelay: '3s' }}></div>
      </div>

      {/* LECHUZA MENSAJERA */}
      <div className="owl-messenger">
        <Bird className="w-12 h-12 text-amber-200/20" />
      </div>

      {particles.map(p => (
        <div key={p.id} className="magic-particle" style={{ left: p.x, top: p.y, width: p.size, height: p.size }} />
      ))}

      <div className="fixed inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-leather.png")' }}></div>

      {!currentUser ? (
        <div className="min-h-screen flex items-center justify-center p-6 relative z-10 pensieve-zoom text-left">
          <div className="w-full max-w-4xl flex flex-col md:flex-row bg-slate-900/60 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-amber-500/30 overflow-hidden magic-glow-border">
            <div className="w-full md:w-5/12 bg-red-950/80 p-12 flex flex-col justify-between border-r border-amber-500/20 text-left">
              <div className="hover-float text-left">
                <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center mb-10 shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-pulse-glow mx-auto md:mx-0">
                  <Flame className="w-10 h-10 text-black" />
                </div>
                <h1 className="text-5xl font-black italic uppercase tracking-tighter text-left font-cinzel leading-none">AUTO CLUB</h1>
                <p className="text-amber-500/80 mt-4 text-xs font-bold uppercase tracking-[0.3em] text-left">Academia de Cobranzas Mágicas</p>
              </div>
              <button onClick={() => setShowUserMgmtModal(true)} className="flex items-center gap-3 text-[10px] font-black text-amber-500/60 hover:text-amber-400 uppercase tracking-widest border border-amber-500/20 px-6 py-4 rounded-2xl transition-all hover:bg-amber-500/10 lumos-effect mt-10">
                <ShieldCheck className="w-4 h-4" /> Registro de Prefectos
              </button>
            </div>
            <div className="w-full md:w-7/12 p-12 lg:p-16 text-left">
              <h2 className="text-2xl font-black uppercase mb-8 tracking-widest text-amber-200 font-cinzel text-left">Identifícate</h2>
              <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar text-left">
                {executives.map(user => (
                  <button key={`login-${user}`} onClick={() => setCurrentUser(user)} className="w-full flex items-center justify-between p-6 rounded-2xl bg-slate-800/40 border border-amber-500/10 hover:border-amber-500 hover:bg-amber-500/10 transition-all group magic-item-hover text-left">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 font-black italic text-xl">{(user || 'U').charAt(0)}</div>
                      <span className="font-black text-amber-50 uppercase text-sm tracking-wider text-left">{user}</span>
                    </div>
                    <Wand2 className="w-5 h-5 text-amber-500/20 group-hover:text-amber-500 group-hover:rotate-[20deg] transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="pensieve-zoom flex flex-col min-h-screen relative z-10 text-left">
          <header className="sticky top-0 z-[100] bg-slate-900/80 backdrop-blur-xl border-b border-amber-500/20 px-8 py-4 shadow-2xl">
            <div className="max-w-[1400px] mx-auto flex justify-between items-center text-left">
              <div className="flex items-center gap-10 text-left">
                <div className="flex items-center gap-4 cursor-pointer group text-left" onClick={() => setView('overview')}>
                  <div className="bg-amber-500 p-2.5 rounded-xl group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    <Zap className="w-5 h-5 text-black" />
                  </div>
                  <h1 className="text-xl font-black text-amber-500 font-cinzel uppercase italic leading-none tracking-tighter">GRINGOTTS AC</h1>
                </div>
                <nav className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-amber-500/10 text-left">
                   <button onClick={() => setView('overview')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all lumos-effect ${view === 'overview' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-amber-500/30 hover:text-amber-100'}`}>Bóvedas</button>
                   <button onClick={() => setView('standard')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all lumos-effect ${view === 'standard' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-amber-500/30 hover:text-amber-100'}`}>Muggles</button>
                   <button onClick={() => setView('adjudicated')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all lumos-effect ${view === 'adjudicated' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-amber-500/30 hover:text-amber-100'}`}>Hechizados</button>
                </nav>
              </div>
              <div className="flex items-center gap-5 text-left">
                <div className="relative text-left flex items-center bg-black/30 border border-amber-500/20 rounded-xl px-4 py-1.5">
                   <Search className="w-3 h-3 text-amber-500/40" />
                   <input 
                    className="bg-transparent border-none outline-none text-xs font-black uppercase text-amber-100 pl-3 w-32 placeholder:text-amber-900"
                    placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                   />
                </div>
                <button onClick={handleLogout} className="p-3 bg-red-950/40 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 transition-all active:scale-90"><LogOut className="w-4 h-4" /></button>
              </div>
            </div>
          </header>

          <main className="max-w-[1400px] mx-auto p-10 flex-1 w-full text-left">
            {view === 'overview' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in text-left">
                 <div className="bg-slate-900/40 rounded-[3rem] p-10 border border-amber-500/10 hover-float magic-glow-border group relative overflow-hidden text-left shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 opacity-5 -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-all duration-1000"></div>
                    <h3 className="text-2xl font-black italic uppercase mb-6 text-amber-100 tracking-widest font-cinzel text-left leading-none">Muggles Estándar</h3>
                    <p className="text-[10px] font-bold text-amber-500/40 uppercase tracking-[0.2em] mb-2 text-left">Saldos Netos en Pergamino</p>
                    <p className="text-4xl font-black mb-10 text-amber-50 font-mono tracking-tighter text-left leading-none">${stats.std.toLocaleString()}</p>
                    <div className="flex gap-2">
                       <button onClick={() => setView('standard')} className="flex-1 py-5 bg-amber-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest lumos-effect shadow-xl shadow-amber-900/20 font-cinzel">Gestionar</button>
                       <button onClick={() => handleOpenDeleteConfirm('standard')} className="p-5 bg-red-950 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                    </div>
                 </div>
                 <div className="bg-indigo-950/40 rounded-[3rem] p-10 border border-blue-500/20 hover-float magic-glow-border-blue group relative overflow-hidden text-left shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-5 -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-all duration-1000"></div>
                    <h3 className="text-2xl font-black uppercase italic mb-6 text-blue-100 tracking-widest font-cinzel text-left leading-none">Bóvedas ADP</h3>
                    <p className="text-[10px] font-bold text-blue-500/40 uppercase tracking-[0.2em] mb-2 text-left">Saldos Netos</p>
                    <p className="text-4xl font-black mb-10 text-blue-400 font-mono tracking-tighter text-left leading-none">${stats.adp.toLocaleString()}</p>
                    <div className="flex gap-2">
                       <button onClick={() => { setView('adjudicated'); setAdjSubView('ADP'); }} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest lumos-effect shadow-xl shadow-blue-900/20 font-cinzel">Abrir</button>
                       <button onClick={() => handleOpenDeleteConfirm('ADP')} className="p-5 bg-red-950 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                    </div>
                 </div>
                 <div className="bg-emerald-950/40 rounded-[3rem] p-10 border border-emerald-500/20 hover-float magic-glow-border-green group relative overflow-hidden text-left shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-5 -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-all duration-1000"></div>
                    <h3 className="text-2xl font-black uppercase italic mb-6 text-emerald-100 tracking-widest font-cinzel text-left text-left text-left leading-none">Bóvedas ACV</h3>
                    <p className="text-[10px] font-bold text-emerald-500/40 uppercase tracking-[0.2em] mb-2 text-left">Mora Dinámica Institucional</p>
                    <p className="text-4xl font-black mb-10 text-emerald-400 font-mono tracking-tighter text-left text-left leading-none">${stats.acv.toLocaleString()}</p>
                    <div className="flex gap-2">
                       <button onClick={() => { setView('adjudicated'); setAdjSubView('ACV'); }} className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest lumos-effect shadow-xl shadow-emerald-900/20 font-cinzel">Lanzar</button>
                       <button onClick={() => handleOpenDeleteConfirm('ACV')} className="p-5 bg-red-950 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 backdrop-blur-md border border-amber-500/10 rounded-[3rem] overflow-hidden shadow-2xl magic-glow-border animate-fade-in text-left flex flex-col">
                <div className="p-8 border-b border-amber-500/10 flex justify-between items-center bg-black/20 text-left">
                  <h2 className="text-2xl font-black uppercase italic text-amber-100 font-cinzel tracking-widest leading-none text-left">Sección {view === 'standard' ? 'Muggles' : adjSubView}</h2>
                  <div className="flex gap-4">
                    <button onClick={() => handleOpenDeleteConfirm(view === 'standard' ? 'standard' : adjSubView)} className="bg-red-950 text-red-500 border border-red-500/20 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"><Trash2 className="w-4 h-4" /> Purgar Base</button>
                    <button onClick={() => setShowImportModal(true)} className="bg-slate-800 text-amber-500 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest lumos-effect border border-amber-500/20">Invocar Excel</button>
                    <button onClick={() => handleOpenManualModal(view === 'standard' ? 'standard' : 'adjudicated', adjSubView)} className="bg-amber-500 text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest lumos-effect shadow-lg shadow-amber-900/30 transition-all">Nuevo</button>
                  </div>
                </div>
                
                {view === 'adjudicated' && (
                   <div className="bg-black/40 p-2 border-b border-amber-500/10 flex justify-center text-left">
                      <div className="flex bg-slate-800 p-1 rounded-xl gap-2 border border-amber-500/10 shadow-inner">
                         <button onClick={() => setAdjSubView('ADP')} className={`px-12 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${adjSubView === 'ADP' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>ADP</button>
                         <button onClick={() => setAdjSubView('ACV')} className={`px-12 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${adjSubView === 'ACV' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}>ACV</button>
                      </div>
                   </div>
                )}

                <div className="overflow-x-auto text-left">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-black/40 border-b border-amber-500/10 text-[10px] font-black uppercase text-amber-500/40 tracking-widest text-left">
                        {adjSubView === 'ACV' && view === 'adjudicated' ? (
                          <tr>
                            <th className="px-10 py-6 text-left">Cliente</th>
                            <th className="px-10 py-6 text-right uppercase">Base</th>
                            <th className="px-10 py-6 text-right uppercase text-orange-400">Mora</th>
                            <th className="px-10 py-6 text-right uppercase text-slate-400">Gasto</th>
                            <th className="px-10 py-6 text-right uppercase text-emerald-500">Total</th>
                            <th className="px-10 py-6 text-center">Magia</th>
                          </tr>
                        ) : (
                          <tr>
                            <th className="px-10 py-6 text-left">Identidad</th>
                            <th className="px-10 py-6 text-right uppercase">Cuota</th>
                            <th className="px-10 py-6 text-right uppercase">Saldo Neto</th>
                            <th className="px-10 py-6 text-center">Magia</th>
                          </tr>
                        )}
                      </thead>
                      <tbody className="divide-y divide-amber-500/5 text-left font-serif italic text-left">
                        {filteredList.map(c => {
                          const f = calculateFinancials(c);
                          const totalVal = (view === 'standard' ? (parseFloat(c.installmentValue) * parseFloat(c.overdueCount)) : f.grandTotal);
                          return (
                            <tr key={c.id} className="hover:bg-amber-500/[0.04] transition-all group cursor-default text-left">
                              <td className="px-10 py-7 text-left leading-tight text-left">
                                <p className="font-black uppercase text-amber-100 tracking-wider text-left leading-none mb-1 font-cinzel">{c.name}</p>
                                <p className="text-[10px] text-amber-500/30 font-mono tracking-widest not-italic text-left">{c.overdueCount} LUNAS VENCIDAS</p>
                              </td>
                              <td className="px-10 py-7 text-right font-mono font-bold text-amber-500/40 text-left">${(parseFloat(c.installmentValue) || 0).toFixed(2)}</td>
                              
                              {adjSubView === 'ACV' && view === 'adjudicated' ? (
                                <>
                                  <td className="px-10 py-7 text-right font-mono font-bold text-orange-500 text-left">${f.totalMora.toFixed(2)}</td>
                                  <td className="px-10 py-7 text-right font-mono font-bold text-slate-500 text-left">${f.totalGasto.toFixed(2)}</td>
                                  <td className="px-10 py-7 text-right font-black text-emerald-500 text-xl font-mono text-left drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">${f.grandTotal.toFixed(2)}</td>
                                </>
                              ) : (
                                <td className="px-10 py-7 text-right font-black text-amber-500 text-xl font-mono text-left shadow-inner">
                                  ${totalVal.toFixed(2)}
                                </td>
                              )}

                              <td className="px-10 py-7 text-center">
                                 <div className="flex justify-center gap-2">
                                    <button onClick={() => sendWhatsApp(c)} className="bg-slate-800 p-4 rounded-2xl text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-black transition-all group-hover:scale-110 lumos-effect shadow-md"><MessageCircle className="w-5 h-5" /></button>
                                    <button onClick={() => setClients(prev => prev.filter(item => item.id !== c.id))} className="p-4 rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90 border border-red-500/10"><Trash2 className="w-5 h-5" /></button>
                                 </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                   </table>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* --- MODALES --- */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-red-950/95 z-[700] flex items-center justify-center p-6 backdrop-blur-2xl animate-fade-in text-center">
          <div className="bg-slate-900 rounded-[3.5rem] max-w-sm p-12 text-left shadow-[0_0_100px_rgba(239,68,68,0.2)] mx-auto border-2 border-red-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]"></div>
            <div className="w-20 h-20 bg-red-500 text-black rounded-3xl flex items-center justify-center mb-8 shadow-xl mx-auto"><AlertCircle className="w-10 h-10" /></div>
            <h3 className="text-2xl font-black uppercase mb-3 tracking-tighter text-amber-100 text-center font-cinzel">¿Confirmar Purga?</h3>
            <p className="text-amber-100/40 text-xs mb-10 leading-relaxed text-center font-serif italic">
              Este hechizo de desvanecimiento eliminará permanentemente los registros de <strong>{deleteTarget === 'all' ? 'TODA LA BÓVEDA' : deleteTarget}</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="space-y-3">
               <button onClick={handleClearDatabase} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] shadow-xl active:scale-95 text-center tracking-[0.2em] hover:bg-red-500 transition-all font-cinzel">LANZAR PURGA</button>
               <button onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }} className="w-full bg-slate-800 text-amber-500/40 py-4 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-700 transition-all text-center tracking-widest">DESHACER</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL USER MGMT */}
      {showUserMgmtModal && (
        <div className="fixed inset-0 bg-slate-950/95 z-[600] flex items-center justify-center p-6 backdrop-blur-2xl animate-fade-in text-left">
          <div className="bg-slate-900 rounded-[3rem] w-full max-w-md overflow-hidden border-2 border-amber-500/30 flex flex-col max-h-[90vh] shadow-2xl pensieve-zoom text-left text-left">
            <div className="px-10 py-8 border-b border-amber-500/10 flex justify-between items-center bg-black/40 text-left">
              <div className="flex items-center gap-3 text-left">
                 <ShieldCheck className="w-5 h-5 text-amber-500" />
                 <span className="text-xs font-black uppercase text-amber-100 tracking-widest font-cinzel text-left">Registro de Prefectos</span>
              </div>
              <button onClick={() => setShowUserMgmtModal(false)} className="text-amber-500/40 hover:text-amber-50 transition-all hover:rotate-90 p-2 text-left"><X className="w-8 h-8 text-left" /></button>
            </div>
            <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar text-left">
              <form onSubmit={handleAddExecutive} className="flex gap-3 text-left">
                <input required type="text" placeholder="Nombre..." className="flex-1 p-5 bg-black/40 border border-amber-500/20 rounded-2xl text-sm font-black uppercase outline-none focus:border-amber-500 text-amber-100 transition-all shadow-inner text-left" value={newExecName} onChange={e => setNewExecName(e.target.value)} />
                <button type="submit" className="bg-amber-500 text-black px-6 rounded-2xl hover:bg-amber-400 shadow-lg active:scale-95 lumos-effect font-black text-xl text-left">+</button>
              </form>
              <div className="space-y-3 text-left">
                {executives.map(name => (
                  <div key={`exec-${name}`} className="flex items-center justify-between p-5 bg-black/20 rounded-2xl border border-amber-500/5 group hover:border-amber-500/30 transition-all magic-item-hover text-left">
                    <span className="font-black text-amber-100/80 text-sm uppercase tracking-wider text-left">{name}</span>
                    <button onClick={() => handleDeleteExecutive(name)} className="p-2 text-red-950 hover:text-red-500 transition-all text-left"><UserMinus className="w-5 h-5 text-left" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/90 z-[500] flex items-center justify-center p-6 backdrop-blur-md animate-fade-in text-left">
          <div className="bg-slate-900 rounded-[3.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-amber-500/30 pensieve-zoom text-left">
            <div className={`h-3 w-full ${newClient.subType === 'ACV' ? 'bg-emerald-500' : 'bg-blue-600'}`}></div>
            <form onSubmit={handleAddClient} className="p-10 space-y-6 text-left">
              <h3 className="text-xl font-black uppercase text-amber-100 font-cinzel tracking-widest text-left leading-none font-cinzel">Inscripción Manual</h3>
              <div className="space-y-5 text-left">
                <div>
                  <label className="block text-[10px] font-black uppercase text-amber-500/40 mb-2 tracking-widest text-left">Identidad Muggle</label>
                  <input required className="w-full p-4 bg-black/40 border border-amber-500/20 rounded-2xl text-amber-100 font-black uppercase text-sm outline-none focus:border-amber-500 text-left" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} placeholder="Nombre" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-amber-500/40 mb-2 tracking-widest text-left">Búho (Celular)</label>
                  <input required className="w-full p-4 bg-black/40 border border-amber-500/20 rounded-2xl text-amber-100 font-black text-sm outline-none focus:border-amber-500 font-mono text-left" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} placeholder="593..." />
                </div>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="text-left">
                    <label className="block text-[10px] font-black uppercase text-amber-500/40 mb-2 tracking-widest text-left text-left">Cuota Galeón</label>
                    <input required type="number" step="0.01" className="w-full p-4 bg-black/40 border border-amber-500/20 rounded-2xl text-amber-100 font-black outline-none focus:border-amber-500 font-mono text-left" value={newClient.installmentValue} onChange={e => setNewClient({...newClient, installmentValue: e.target.value})} />
                  </div>
                  <div className="text-left text-left">
                    <label className="block text-[10px] font-black uppercase text-amber-500/40 mb-2 tracking-widest text-left text-left">Lunas</label>
                    <input required type="number" className="w-full p-4 bg-black/40 border border-amber-500/20 rounded-2xl text-amber-100 font-black outline-none focus:border-amber-500 font-mono text-left" value={newClient.overdueCount} onChange={e => setNewClient({...newClient, overdueCount: e.target.value})} />
                  </div>
                </div>
                {newClient.subType === 'ACV' && (
                  <div>
                    <label className="block text-[10px] font-black uppercase text-amber-500/40 mb-2 tracking-widest text-left text-emerald-500">Valor del Plan ($)</label>
                    <input required type="number" step="0.01" className="w-full p-4 bg-black/40 border border-emerald-500/20 rounded-2xl text-amber-100 font-black outline-none focus:border-emerald-500 font-mono" value={newClient.planAmount} onChange={e => setNewClient({...newClient, planAmount: e.target.value})} placeholder="Monto total del plan" />
                  </div>
                )}
              </div>
              <button type="submit" className="w-full py-5 bg-amber-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest lumos-effect shadow-xl active:scale-95 border-b-4 border-amber-700 font-cinzel text-center">Sellar Registro</button>
              <button type="button" onClick={() => setShowAddModal(false)} className="w-full text-xs font-black text-slate-500 uppercase tracking-widest pt-2 hover:text-amber-100 text-center transition-colors">Cerrar</button>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/95 z-[500] flex items-center justify-center p-6 backdrop-blur-3xl animate-fade-in text-center">
          <div className="bg-slate-900 rounded-[4rem] shadow-[0_0_100px_rgba(245,158,11,0.1)] w-full max-w-sm p-12 border-2 border-amber-500/30 text-center relative pensieve-zoom text-center">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-amber-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-900/40 animate-pulse-glow text-left"><Sparkles className="w-12 h-12 text-black text-left" /></div>
             <h3 className="text-3xl font-black italic uppercase mb-2 tracking-tighter text-amber-100 mt-10 font-cinzel text-center leading-tight">Invocar Registros</h3>
             <p className="text-amber-500/40 text-[9px] font-black uppercase mb-12 tracking-[0.4em] text-center">Pergamino Sagrado de Datos</p>
             <input type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e, view === 'standard' ? 'standard' : 'adjudicated', view === 'standard' ? 'ADP' : adjSubView)} className="hidden" id="file-std-modal" />
             <label htmlFor="file-std-modal" className="cursor-pointer block w-full py-6 bg-amber-500 text-black rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-amber-400 active:scale-95 transition-all mb-6 lumos-effect font-cinzel text-center">Elegir Pergamino</label>
             <button onClick={() => setShowImportModal(false)} className="text-[10px] font-black uppercase text-amber-500/20 hover:text-amber-50 transition-all tracking-widest font-cinzel text-center text-center">Regresar</button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Montserrat:wght@100;400;700;900&display=swap');
        
        body { font-family: 'Montserrat', sans-serif; cursor: url('https://img.icons8.com/color/48/000000/magic-wand.png'), auto; background: #020617; overflow-x: hidden; }
        .font-cinzel { font-family: 'Cinzel', serif; }
        
        /* VELAS FLOTANTES */
        .candle-container { position: fixed; inset: 0; pointer-events: none; z-index: 5; }
        .candle {
          position: absolute;
          width: 8px; height: 30px;
          background: rgba(255,255,255,0.6);
          border-radius: 4px;
          box-shadow: 0 0 15px #f59e0b;
          animation: float-candle 12s ease-in-out infinite;
        }
        .candle::before {
          content: ''; position: absolute; top: -10px; left: 2px;
          width: 4px; height: 10px; background: #f59e0b;
          border-radius: 50% 50% 20% 20%; animation: flicker 0.2s infinite alternate;
        }
        @keyframes float-candle { 0%, 100% { transform: translateY(110vh); } 50% { transform: translateY(-10vh); } }
        @keyframes flicker { from { transform: scale(1); opacity: 1; } to { transform: scale(1.3); opacity: 0.7; } }

        /* LECHUZA MENSAJERA */
        .owl-messenger {
          position: fixed; z-index: 50; pointer-events: none;
          animation: owl-flight 40s linear infinite;
        }
        @keyframes owl-flight {
          0% { transform: translate(-150px, 200px) rotate(20deg); opacity: 0; }
          5% { opacity: 0.5; }
          95% { opacity: 0.5; }
          100% { transform: translate(120vw, 500px) rotate(10deg); opacity: 0; }
        }

        .magic-particle {
          position: fixed; background: #fbbf24; border-radius: 50%;
          pointer-events: none; z-index: 9999;
          animation: particle-fade 1s ease-out forwards;
          box-shadow: 0 0 12px #f59e0b;
        }
        @keyframes particle-fade { from { transform: scale(1); opacity: 0.9; } to { transform: scale(0.1); opacity: 0; } }

        .pensieve-zoom { animation: pensieve-zoom 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes pensieve-zoom { from { transform: scale(1.15); filter: blur(25px); opacity: 0; } to { transform: scale(1); filter: blur(0); opacity: 1; } }

        .magic-glow-border { border: 1px solid rgba(245, 158, 11, 0.3) !important; box-shadow: 0 0 25px rgba(245, 158, 11, 0.05); }
        .magic-glow-border-blue { border: 1px solid rgba(59, 130, 246, 0.3) !important; box-shadow: 0 0 25px rgba(59, 130, 246, 0.05); }
        .magic-glow-border-green { border: 1px solid rgba(16, 185, 129, 0.3) !important; box-shadow: 0 0 25px rgba(16, 185, 129, 0.05); }

        .hover-float:hover { transform: translateY(-10px); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .magic-item-hover:hover { transform: scale(1.02); box-shadow: 0 0 35px rgba(245, 158, 11, 0.15); }
        .lumos-effect:active { box-shadow: 0 0 60px #fff !important; transition: box-shadow 0.1s; cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="%238B4513" d="M2 30L30 2l-2-2L0 28z"/><circle cx="30" cy="2" r="2" fill="%23FFF"/><circle cx="30" cy="2" r="4" fill="%23FFF" fill-opacity="0.3"/></svg>') 30 2, auto; }

        .animate-slow-spin { animation: spin 25s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .animate-slow-bounce { animation: bounce 4s ease-in-out infinite; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }

        .animate-pulse-glow { animation: pulse-glow 3s infinite; }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 25px rgba(245, 158, 11, 0.4); transform: scale(1); } 50% { box-shadow: 0 0 50px rgba(245, 158, 11, 0.7); transform: scale(1.01); } }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f59e0b; border-radius: 10px; box-shadow: 0 0 5px rgba(245,158,11,0.5); }
        
        /* VARITA CURSOR */
        * { cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="%235D4037" d="M4 28L28 4l2 2L6 30z"/><circle cx="28" cy="4" r="2" fill="%23FFD54F"/><circle cx="28" cy="4" r="5" fill="%23FFD54F" fill-opacity="0.4"/></svg>') 28 4, auto !important; }
      `}} />

      {/* TOAST MAGIA */}
      {notification && (
        <div className="fixed bottom-12 right-12 z-[700] animate-bounce-in text-left">
          <div className="bg-slate-900/90 backdrop-blur-xl text-amber-50 px-8 py-6 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-2 border-amber-500/30 flex items-center gap-5 text-left group magic-glow-border text-left">
             <div className="bg-amber-500 p-2 rounded-xl text-black group-hover:rotate-12 transition-transform text-left"><CheckCircle className="w-5 h-5 text-left text-left" /></div>
             <div className="text-left text-left">
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1 font-cinzel text-left">Encantamiento Realizado</p>
                <span className="text-xs font-black uppercase tracking-wider text-amber-100 text-left text-left italic">{notification.message}</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}