import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ArrowUpRight,
  TrendingUp,
  Zap,
  BarChart3,
  Users,
  Activity,
  ArrowRight,
  Info,
  UserCog,
  UserMinus,
  Globe,
  Briefcase,
  Trophy,
  PieChart,
  Target,
  RefreshCw
} from 'lucide-react';

// Lista inicial de asesores
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
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAdjImportModal, setShowAdjImportModal] = useState(false);
  const [showUserMgmtModal, setShowUserMgmtModal] = useState(false); 
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); 
  const [deleteTarget, setDeleteTarget] = useState(null); // 'standard', 'ADP', 'ACV', 'all'
  
  const [newExecName, setNewExecName] = useState('');
  const [importingSubType, setImportingSubType] = useState('ADP'); 
  const [notification, setNotification] = useState(null);

  const initialClientState = {
    name: '', 
    phone: '', 
    installmentValue: '', 
    planAmount: '', 
    type: 'standard', 
    subType: 'ADP', 
    overdueCount: 1 
  };

  const [newClient, setNewClient] = useState(initialClientState);

  // --- UTILIDADES ---
  const showToast = (message) => {
    setNotification({ message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogout = () => {
    setIsDataLoaded(false);
    setClients([]);
    setCurrentUser(null);
  };

  const generateUniqueId = (prefix = 'cli') => {
    const userPrefix = currentUser ? currentUser.replace(/\s+/g, '').substring(0, 3) : 'usr';
    return `${userPrefix}-${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  };

  const getCurrentMonthName = () => {
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return months[new Date().getMonth()];
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Buenos días' : 'Buenas tardes';
  };

  // --- MOTOR FINANCIERO DINÁMICO (SOLO ACV) ---
  const calculateFinancials = (client) => {
    try {
      if (!client) return { totalMora: 0, totalGasto: 0, grandTotal: 0, breakdown: [] };
      
      const cuota = Number(client.installmentValue) || 0;
      const count = Math.max(0, Math.min(Number(client.overdueCount) || 0, 120));
      const montoPlan = Number(client.planAmount) || 0;
      const isACV = client.subType === 'ACV';
      const today = new Date();

      if (!isACV) {
        const totalNeto = cuota * count;
        return {
          totalMora: 0,
          totalGasto: 0,
          grandTotal: Number(totalNeto.toFixed(2)),
          breakdown: Array.from({ length: count }).map((_, i) => ({
            date: new Date(today.getFullYear(), today.getMonth() - i, 5).toLocaleDateString('es-EC'),
            moraValue: 0, collectionFee: 0, subtotal: Number(cuota.toFixed(2))
          }))
        };
      }

      // TAP Dinámica ACV: ((Cuota * 72) - MontoPlan) / MontoPlan / 6
      let tapDecimal = montoPlan > 0 ? (((cuota * 72) - montoPlan) / montoPlan) / 6 : 0;
      let totalMoraValue = 0, totalGastoValue = 0, grandTotalValue = 0, breakdown = [];

      for (let i = 0; i < count; i++) {
        const dueDate = new Date(today.getFullYear(), today.getMonth() - i, 5);
        const days = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
        
        let recargoPerc = 0;
        if (days >= 1 && days <= 15) recargoPerc = 0.05;
        else if (days >= 16 && days <= 30) recargoPerc = 0.07;
        else if (days >= 31 && days <= 60) recargoPerc = 0.09;
        else if (days >= 61) recargoPerc = 0.10;

        const tasaAnualMora = tapDecimal + (tapDecimal * recargoPerc);
        const valorDiarioMora = cuota * (tasaAnualMora / 365);
        const moraMes = valorDiarioMora * days;
        const fee = (days > 15) ? 18.00 : 0; 

        const sub = cuota + moraMes + fee;
        totalMoraValue += moraMes;
        totalGastoValue += fee;
        grandTotalValue += sub;
        
        breakdown.push({
          date: dueDate.toLocaleDateString('es-EC'),
          days, 
          moraValue: Number(moraMes.toFixed(2)),
          collectionFee: Number(fee.toFixed(2)),
          subtotal: Number(sub.toFixed(2))
        });
      }

      return { 
        totalMora: Number(totalMoraValue.toFixed(2)), 
        totalGasto: Number(totalGastoValue.toFixed(2)), 
        grandTotal: Number(grandTotalValue.toFixed(2)), 
        breakdown,
        maxDays: breakdown[0]?.days || 0 
      };
    } catch (e) { return { totalMora: 0, totalGasto: 0, grandTotal: 0, breakdown: [] }; }
  };

  // --- WHATSAPP ---
  const sendWhatsApp = (client) => {
    if (!client) return;
    const greeting = getGreeting();
    const currentMonth = getCurrentMonthName();
    const execName = currentUser || "Miguel Gurumendi";
    
    let message = `${greeting} *${client.name.toUpperCase()}*. Esperando que se encuentre muy bien.\n`;
    message += `Le saluda *${execName}* del área de cartera Auto Club.\n`;
    message += `Le escribo para recordarle sus pagos pendientes:\n\n`;

    if (client.type === 'standard') {
      message += `🔹 *Valor de Cuota:* $${Number(client.installmentValue).toFixed(2)}\n`;
      message += `#️⃣ *Cuotas Pendientes:* ${client.overdueCount}\n`;
      message += `💰 *Total a Pagar:* $${(Number(client.installmentValue) * Number(client.overdueCount)).toFixed(2)}\n`;
      message += `📅 *Correspondiente a:* ${currentMonth}\n\n`;
      message += `Agradecemos, una vez efectuado el pago, nos comparta su comprobante de pago por este medio.`;
    } else {
      const calc = calculateFinancials(client);
      const valorTotalPlan = Number(client.installmentValue) * 72;
      
      message += `*AUTO CLUB - REPORTE DE PAGO*\n`;
      message += `--------------------------------------------\n`;
      message += `*APORTES PENDIENTES DE PAGO*\n`;
      message += `--------------------------------------------\n`;
      message += `*Cliente:* ${client.name.toUpperCase()}\n`;
      message += `*Estado:* ADJUDICADO (${client.subType})\n`;
      
      if(client.subType === 'ACV') {
        if (client.planAmount) message += `*Monto del Plan:* $${Number(client.planAmount).toLocaleString()}\n`;
        message += `*Valor Total Plan:* $${valorTotalPlan.toLocaleString()}\n`;
      }

      message += `*Cuota Mensual:* $${Number(client.installmentValue).toFixed(2)}\n`;
      message += `*# Ctas. Vencidas:* ${client.overdueCount}\n`;
      message += `--------------------------------------------\n`;
      message += `*DETALLE DE DEUDA:*\n`;

      (calc.breakdown || []).forEach((item, index) => {
        message += `\n*#${index + 1} | Vence:* ${item.date}\n`;
        message += `| Cuota: $${Number(client.installmentValue).toFixed(2)}\n`;
        if (client.subType === 'ACV') {
          message += `| Mora (${item.days} d.): $${item.moraValue.toFixed(2)}\n`;
          message += `| Gto. Cobranza: $${item.collectionFee.toFixed(2)}\n`;
        }
        message += `| *SUBTOTAL: $${item.subtotal.toFixed(2)}*\n`;
      });

      message += `\n--------------------------------------------\n`;
      if (client.subType === 'ACV') {
        message += `Valor Mora Total: $${calc.totalMora.toFixed(2)}\n`;
        message += `Gastos Cobranza: $${calc.totalGasto.toFixed(2)}\n`;
      }
      message += `💰 *TOTAL A PAGAR: $${calc.grandTotal.toFixed(2)}*\n`;
      message += `--------------------------------------------\n\n`;
      message += `Agradecemos realizar su pago a la brevedad y compartir el comprobante.`;
    }

    let phone = (client.phone || '').toString().replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '593' + phone.substring(1); else if (phone.length === 9) phone = '593' + phone;
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
  };

  // --- CARGA INICIAL ---
  useEffect(() => {
    const savedExecs = localStorage.getItem('cobranzas_v6_executives');
    if (savedExecs) {
      setExecutives(JSON.parse(savedExecs));
    } else {
      setExecutives(DEFAULT_EXECUTIVES);
      localStorage.setItem('cobranzas_v6_executives', JSON.stringify(DEFAULT_EXECUTIVES));
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      const userKey = currentUser.replace(/\s+/g, '').toLowerCase();
      setTimeout(() => {
        const savedData = localStorage.getItem(`cobranzas_v6_data_${userKey}`);
        const savedSettings = localStorage.getItem(`cobranzas_v6_settings_${userKey}`);
        setClients(savedData ? JSON.parse(savedData) : []);
        if (savedSettings) setSenderNumber(JSON.parse(savedSettings).senderNumber || '0963098362');
        setLoading(false);
        setIsDataLoaded(true);
      }, 300);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && isDataLoaded && !loading) {
      const userKey = currentUser.replace(/\s+/g, '').toLowerCase();
      localStorage.setItem(`cobranzas_v6_data_${userKey}`, JSON.stringify(clients));
      localStorage.setItem(`cobranzas_v6_settings_${userKey}`, JSON.stringify({ senderNumber }));
    }
  }, [clients, senderNumber, currentUser, loading, isDataLoaded]);

  // --- GESTIÓN ASESORES ---
  const handleAddExecutive = (e) => {
    e.preventDefault();
    const name = newExecName.trim();
    if (!name || executives.includes(name)) {
      showToast("Nombre inválido o duplicado.");
      return;
    }
    const newList = [...executives, name];
    setExecutives(newList);
    localStorage.setItem('cobranzas_v6_executives', JSON.stringify(newList));
    setNewExecName('');
    showToast("Asesor añadido.");
  };

  const handleDeleteExecutive = (name) => {
    const newList = executives.filter(e => e !== name);
    setExecutives(newList);
    localStorage.setItem('cobranzas_v6_executives', JSON.stringify(newList));
    if (currentUser === name) handleLogout();
    showToast("Asesor eliminado.");
  };

  // --- BORRADO INDEPENDIENTE ---
  const handleClearDatabase = () => {
    if (deleteTarget === 'all') {
      setClients([]);
    } else if (deleteTarget === 'standard') {
      setClients(prev => prev.filter(c => c.type !== 'standard'));
    } else {
      setClients(prev => prev.filter(c => c.subType !== deleteTarget));
    }
    
    setShowDeleteConfirm(false);
    setShowConfigModal(false);
    showToast(`Base ${deleteTarget === 'all' ? 'total' : deleteTarget} vaciada.`);
    setDeleteTarget(null);
  };

  // --- IMPORTACIÓN ---
  const handleFileUpload = (e, type, subType) => {
    const file = e?.target?.files?.[0];
    if (!file || !window.XLSX) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = window.XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = window.XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        const newBatch = [];
        rows.forEach((row, idx) => {
          if (!row || row.length < 2 || idx === 0) return;
          const cuota = parseFloat(String(row[2] || '').replace(/[^\d.]/g, '')) || 0;
          const vencidas = parseInt(String(row[3] || '').replace(/[^\d.]/g, '')) || 1;
          const montoPlan = parseFloat(String(row[4] || '').replace(/[^\d.]/g, '')) || 0;
          if (row[0] && row[1] && cuota > 0) {
            newBatch.push({
              id: generateUniqueId(subType),
              name: String(row[0]).trim(),
              phone: String(row[1]).replace(/\D/g, ''),
              installmentValue: cuota, 
              debt: cuota * vencidas,
              overdueCount: vencidas,
              planAmount: montoPlan,
              type, subType, status: 'active'
            });
          }
        });
        setClients(prev => [...prev, ...newBatch]);
        showToast(`${newBatch.length} registros cargados en ${subType || 'Estándar'}.`);
      } catch (err) { showToast("Error en el archivo."); }
      finally { setShowImportModal(false); setShowAdjImportModal(false); if (e.target) e.target.value = ''; }
    };
    reader.readAsArrayBuffer(file);
  };

  // --- FILTROS ---
  const standardList = useMemo(() => clients.filter(c => c && c.type === 'standard'), [clients]);
  const adpList = useMemo(() => clients.filter(c => c && c.type === 'adjudicated' && c.subType === 'ADP'), [clients]);
  const acvList = useMemo(() => clients.filter(c => c && c.type === 'adjudicated' && c.subType === 'ACV'), [clients]);

  const currentStats = useMemo(() => {
    const std = standardList.reduce((acc, c) => acc + (Number(c.installmentValue) * Number(c.overdueCount)), 0);
    const adp = adpList.reduce((acc, c) => acc + (Number(c.installmentValue) * Number(c.overdueCount)), 0);
    const acv = acvList.reduce((acc, c) => acc + calculateFinancials(c).grandTotal, 0);
    return { std, adp, acv, total: std + adp + acv };
  }, [standardList, adpList, acvList]);

  const globalStats = useMemo(() => {
    if (view !== 'global') return [];
    return executives.map(adv => {
      try {
        const userKey = adv.replace(/\s+/g, '').toLowerCase();
        const raw = localStorage.getItem(`cobranzas_v6_data_${userKey}`);
        if (!raw) return { name: adv, standard: 0, adp: 0, acv: 0, total: 0 };
        const data = JSON.parse(raw);
        let sStd = 0, sAdp = 0, sAcv = 0;
        (Array.isArray(data) ? data : []).forEach(c => {
          if (!c || c.status !== 'active') return;
          const val = Number(c.installmentValue) * Number(c.overdueCount);
          if (c.type === 'standard') sStd += val;
          else if (c.subType === 'ADP') sAdp += val;
          else if (c.subType === 'ACV') sAcv += calculateFinancials(c).grandTotal;
        });
        return { name: adv, standard: sStd, adp: sAdp, acv: sAcv, total: sStd + sAdp + sAcv };
      } catch (e) { return { name: adv, standard: 0, adp: 0, acv: 0, total: 0 }; }
    });
  }, [executives, view]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 text-left relative overflow-x-hidden">
      
      {!currentUser ? (
        /* LOGIN */
        <div className="min-h-screen bg-white flex items-center justify-center p-6 text-left">
          <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
            <div className="w-full md:w-5/12 bg-slate-900 p-12 text-white flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 bg-yellow-400 rounded-3xl flex items-center justify-center mb-10 shadow-xl shadow-yellow-400/20"><Car className="w-8 h-8 text-black" /></div>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter text-left">AUTO CLUB</h1>
                <p className="text-slate-400 mt-4 text-sm leading-relaxed text-left">Gestión de Carteras Institucional.</p>
              </div>
              <button onClick={() => setShowUserMgmtModal(true)} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-yellow-400 uppercase tracking-widest border border-slate-800 px-4 py-3 rounded-xl transition-all"><UserCog className="w-4 h-4" /> Perfiles</button>
            </div>
            <div className="w-full md:w-7/12 p-12 lg:p-16 bg-slate-50/50 text-left">
              <h2 className="text-2xl font-black uppercase italic mb-8 tracking-tight text-left">Panel de Acceso</h2>
              <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {(executives || []).map(user => (
                  <button key={`login-${user}`} onClick={() => setCurrentUser(user)} className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-900 hover:shadow-xl transition-all text-left">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black">{(user || 'U').charAt(0)}</div>
                    <div className="flex-1">
                       <p className="font-black text-slate-800 uppercase text-sm leading-none text-left">{user}</p>
                       <p className="text-[10px] text-slate-400 uppercase font-bold mt-1 tracking-widest text-left">Asesor de Cartera</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DASHBOARD PRINCIPAL */
        <>
          <header className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 py-4">
            <div className="max-w-[1400px] mx-auto flex justify-between items-center">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('overview')}>
                  <div className="bg-slate-900 p-2 rounded-lg shadow-md"><Car className="w-5 h-5 text-yellow-400" /></div>
                  <h1 className="text-xl font-black italic tracking-tighter">AUTO CLUB</h1>
                </div>
                <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                   <button onClick={() => setView('overview')} className={`px-5 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'overview' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Inicio</button>
                   <button onClick={() => setView('standard')} className={`px-5 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'standard' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Estándar</button>
                   <button onClick={() => setView('adjudicated')} className={`px-5 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'adjudicated' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Adjudicados</button>
                   <button onClick={() => setView('global')} className={`px-5 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${view === 'global' ? 'bg-slate-900 text-yellow-400 shadow-xl' : 'text-slate-400'}`}>Global</button>
                </nav>
              </div>
              <div className="flex items-center gap-4">
                <div onClick={() => setShowConfigModal(true)} className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-200 transition-all text-left">
                  <p className="text-[10px] font-black uppercase hidden md:block">{currentUser}</p>
                  <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center font-black">{(currentUser || 'U').charAt(0)}</div>
                </div>
                <button onClick={handleLogout} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all active:scale-90"><LogOut className="w-4 h-4" /></button>
              </div>
            </div>
          </header>

          <main className="max-w-[1400px] mx-auto p-8 text-left">
            {view === 'global' ? (
              <div className="space-y-8 animate-fade-in text-left">
                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-left">Consolidado Nacional</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left text-left">
                   <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">Total General</p>
                      <p className="text-2xl font-black text-left">${currentStats.total.toLocaleString()}</p>
                   </div>
                   <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-left">
                      <p className="text-[10px] font-bold text-slate-400 uppercase text-left">Estándar</p>
                      <p className="text-2xl font-black text-left">${currentStats.std.toLocaleString()}</p>
                   </div>
                   <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-left text-blue-600">
                      <p className="text-[10px] font-bold text-slate-400 uppercase text-left">ADP</p>
                      <p className="text-2xl font-black text-left">${currentStats.adp.toLocaleString()}</p>
                   </div>
                   <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-left text-emerald-600">
                      <p className="text-[10px] font-bold text-slate-400 uppercase text-left">ACV (Dinámico)</p>
                      <p className="text-2xl font-black text-left">${currentStats.acv.toLocaleString()}</p>
                   </div>
                </div>
                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm text-left">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-400 text-left text-left">
                        <tr><th className="px-8 py-4 text-left">Asesor</th><th className="px-8 py-4 text-right">Estándar</th><th className="px-8 py-4 text-right">ADP</th><th className="px-8 py-4 text-right">ACV</th><th className="px-8 py-4 text-right">Total</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {globalStats.map(adv => (
                          <tr key={`global-${adv.name}`} className="hover:bg-slate-50">
                            <td className="px-8 py-6 font-black uppercase text-sm text-left text-left">{adv.name}</td>
                            <td className="px-8 py-6 text-right font-mono">${adv.standard.toLocaleString()}</td>
                            <td className="px-8 py-6 text-right font-mono text-blue-500">${adv.adp.toLocaleString()}</td>
                            <td className="px-8 py-6 text-right font-mono text-emerald-500">${adv.acv.toLocaleString()}</td>
                            <td className="px-8 py-6 text-right font-black">${adv.total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </div>
            ) : view === 'overview' ? (
              <div className="space-y-12 animate-fade-in text-left">
                 <h2 className="text-5xl font-black italic uppercase tracking-tighter text-left">Hola, {currentUser.split(' ')[0]}</h2>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                    <div className="bg-white rounded-[3rem] p-8 border border-slate-200 flex flex-col h-full shadow-sm hover:border-slate-400 transition-all text-left">
                       <h3 className="text-2xl font-black uppercase italic mb-4 text-left">Estándar</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-left">Pendiente Neto</p>
                       <p className="text-3xl font-black mb-8 text-left">${currentStats.std.toLocaleString()}</p>
                       <button onClick={() => setView('standard')} className="mt-auto w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black active:scale-95 transition-all">Gestionar</button>
                    </div>
                    <div className="bg-blue-600 rounded-[3rem] p-8 text-white flex flex-col h-full shadow-xl hover:bg-blue-700 transition-all text-left">
                       <h3 className="text-2xl font-black uppercase italic mb-4 text-left">ADP</h3>
                       <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1 text-left">Sin Mora Aplicada</p>
                       <p className="text-3xl font-black mb-8 text-left">${currentStats.adp.toLocaleString()}</p>
                       <button onClick={() => { setView('adjudicated'); setAdjSubView('ADP'); }} className="mt-auto w-full py-4 bg-white text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Gestionar</button>
                    </div>
                    <div className="bg-emerald-600 rounded-[3rem] p-8 text-white flex flex-col h-full shadow-xl hover:bg-emerald-700 transition-all text-left">
                       <h3 className="text-2xl font-black uppercase italic mb-4 text-left text-left text-left">ACV</h3>
                       <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mb-1 text-left">Mora Dinámica (5-10%)</p>
                       <p className="text-3xl font-black mb-8 text-left">${currentStats.acv.toLocaleString()}</p>
                       <button onClick={() => { setView('adjudicated'); setAdjSubView('ACV'); }} className="mt-auto w-full py-4 bg-white text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Gestionar</button>
                    </div>
                 </div>
              </div>
            ) : view === 'standard' ? (
              <div className="space-y-6 animate-fade-in text-left">
                <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white flex justify-between items-end shadow-2xl">
                   <div className="text-left text-left">
                     <h2 className="text-3xl font-black italic uppercase mb-2 tracking-tight text-left">Cartera Estándar</h2>
                     <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] text-left">Base Independiente • Montos Netos</p>
                   </div>
                   <div className="flex gap-3 text-left">
                      <button onClick={() => setShowImportModal(true)} className="bg-white/10 px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-white/20 transition-all"><FileSpreadsheet className="w-4 h-4" /> Importar</button>
                      <button onClick={() => handleOpenManualModal('standard')} className="bg-yellow-400 text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-yellow-300 transition-all active:scale-95 text-left"><PlusCircle className="w-4 h-4" /> Nuevo</button>
                   </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm text-left">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-400 text-left">
                        <tr><th className="px-8 py-4">Cliente</th><th className="px-8 py-4 text-right">Cuota</th><th className="px-8 py-4 text-right">Venc.</th><th className="px-8 py-4 text-right text-right">Total</th><th className="px-8 py-4 text-center">Acción</th></tr>
                      </thead>
                      <tbody>
                        {standardList.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50 border-b border-slate-50 transition-colors">
                            <td className="px-8 py-6 font-black uppercase text-sm text-left text-left">{c.name}<br/><span className="text-[10px] font-bold text-slate-400">{c.phone}</span></td>
                            <td className="px-8 py-6 text-right font-mono font-bold text-slate-500">${Number(c.installmentValue).toFixed(2)}</td>
                            <td className="px-8 py-6 text-right font-bold text-slate-400">{c.overdueCount}</td>
                            <td className="px-8 py-6 text-right font-black text-red-500 text-lg">${(Number(c.installmentValue) * Number(c.overdueCount)).toFixed(2)}</td>
                            <td className="px-8 py-6 text-center"><button onClick={() => sendWhatsApp(c)} className="bg-slate-900 p-3 rounded-xl text-yellow-400 shadow-md active:scale-90 transition-all"><MessageCircle className="w-5 h-5" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in text-left">
                <div className="bg-blue-600 p-10 rounded-[2.5rem] text-white flex justify-between items-end shadow-2xl">
                   <div className="text-left">
                     <h2 className="text-3xl font-black italic uppercase mb-2 tracking-tight text-left">Adjudicados</h2>
                     <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em] text-left">Gestión Independiente: {adjSubView}</p>
                   </div>
                   <button onClick={() => handleOpenManualModal('adjudicated', adjSubView)} className="bg-blue-900 px-8 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg hover:bg-black transition-all active:scale-95 text-left text-left"><PlusCircle className="w-5 h-5" /> Nuevo {adjSubView}</button>
                </div>
                <div className="flex justify-between items-center text-left text-left">
                   <div className="bg-white p-1.5 rounded-xl border border-slate-200 flex gap-1 shadow-sm">
                      <button onClick={() => setAdjSubView('ADP')} className={`px-12 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${adjSubView === 'ADP' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>ADP</button>
                      <button onClick={() => setAdjSubView('ACV')} className={`px-12 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${adjSubView === 'ACV' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>ACV</button>
                   </div>
                   <button onClick={() => { setImportingSubType(adjSubView); setShowAdjImportModal(true); }} className="bg-slate-900 text-yellow-400 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-black transition-all shadow-md"><UploadCloud className="w-4 h-4" /> Importar {adjSubView}</button>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm text-left">
                   <div className="p-4 bg-slate-50 border-b flex items-center gap-3 text-left">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${adjSubView === 'ACV' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                      <span className="text-[10px] font-black uppercase text-slate-500 text-left text-left">{adjSubView === 'ACV' ? 'Cálculo Mora Dinámica Institucional' : 'Saldos Netos sin Mora'}</span>
                   </div>
                   <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-400 text-left">
                        <tr><th className="px-8 py-4">Cliente</th><th className="px-8 py-4 text-right">Base</th><th className="px-8 py-4 text-right text-orange-400">Mora</th><th className="px-8 py-4 text-right">Gasto</th><th className="px-8 py-4 text-right text-slate-900">Total</th><th className="px-8 py-4 text-center text-left">Acción</th></tr>
                      </thead>
                      <tbody>
                        {(adjSubView === 'ADP' ? adpList : acvList).map(c => {
                          const f = calculateFinancials(c);
                          return (
                            <tr key={c.id} className="hover:bg-slate-50 border-b border-slate-50 transition-colors">
                              <td className="px-8 py-6 font-black uppercase text-sm text-left text-left text-left">{c.name}<br/><span className="text-[10px] font-bold text-blue-500 tracking-wider text-left">{c.overdueCount} Cuotas Vencidas</span></td>
                              <td className="px-8 py-6 text-right font-mono font-bold text-slate-500">${Number(c.installmentValue).toFixed(2)}</td>
                              <td className="px-8 py-6 text-right font-mono text-orange-600 font-bold text-left">${f.totalMora.toFixed(2)}</td>
                              <td className="px-8 py-6 text-right font-mono text-slate-400 text-left">${f.totalGasto.toFixed(2)}</td>
                              <td className={`px-8 py-6 text-right font-black text-xl ${adjSubView === 'ACV' ? 'text-emerald-600' : 'text-blue-700'}`}>${f.grandTotal.toFixed(2)}</td>
                              <td className="px-8 py-6 text-center text-center"><button onClick={() => sendWhatsApp(c)} className={`p-4 rounded-xl text-white shadow-lg active:scale-90 transition-all ${adjSubView === 'ACV' ? 'bg-emerald-500' : 'bg-blue-600'}`}><Send className="w-4 h-4" /></button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                   </table>
                </div>
              </div>
            )}
          </main>
        </>
      )}

      {/* --- MODALES CORREGIDOS --- */}

      {/* GESTIÓN ASESORES - FIXED */}
      {showUserMgmtModal && (
        <div className="fixed inset-0 bg-slate-900/90 z-[600] flex items-center justify-center p-6 backdrop-blur-xl animate-fade-in text-left">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] shadow-2xl">
            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50 text-left">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-left">Gestión de Asesores</span>
              <button onClick={() => setShowUserMgmtModal(false)} className="text-slate-400 transition-all hover:rotate-90 p-2"><X className="w-6 h-6 text-left" /></button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar text-left">
              <form onSubmit={handleAddExecutive} className="flex gap-2 text-left">
                <input required type="text" placeholder="Nombre completo..." className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black uppercase outline-none focus:border-slate-900" value={newExecName} onChange={e => setNewExecName(e.target.value)} />
                <button type="submit" className="bg-slate-900 text-white px-5 rounded-xl hover:bg-black shadow-lg transition-all active:scale-95 flex items-center justify-center text-left"><UserPlus className="w-5 h-5 text-left" /></button>
              </form>
              <div className="space-y-2 text-left">
                {(executives || []).map(name => (
                  <div key={`exec-${name}`} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 group hover:border-slate-300 transition-all text-left">
                    <span className="font-black text-slate-700 text-sm uppercase text-left">{name}</span>
                    <button onClick={() => handleDeleteExecutive(name)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all text-left"><UserMinus className="w-4 h-4 text-left" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRO MANUAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[500] flex items-center justify-center p-6 backdrop-blur-md animate-fade-in text-left">
          <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100">
            <div className={`h-2 w-full ${newClient.subType === 'ACV' ? 'bg-emerald-500' : (newClient.subType === 'ADP' ? 'bg-blue-600' : 'bg-yellow-400')}`}></div>
            <form onSubmit={handleAddClient} className="p-8 space-y-4 text-left text-left">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-left">Nuevo Registro Manual</span>
                 <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-slate-900 transition-all p-1 text-left"><X className="w-5 h-5 text-left" /></button>
              </div>
              <div className="space-y-4 text-left">
                <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-1 text-left">Nombre Completo</label><input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-sm outline-none focus:border-slate-900 transition-all text-left" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} /></div>
                <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-1 text-left">Celular</label><input required type="text" className="w-full p-3 border border-slate-200 rounded-xl font-mono text-sm outline-none focus:border-slate-900 transition-all text-left" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-left"><label className="block text-[10px] font-black uppercase text-slate-400 mb-1 text-left">Cuota ($)</label><input required type="number" step="0.01" className="w-full p-3 border border-slate-200 rounded-xl font-mono text-sm outline-none focus:border-slate-900 transition-all text-left" value={newClient.installmentValue} onChange={e => setNewClient({...newClient, installmentValue: e.target.value})} /></div>
                  <div className="text-left"><label className="block text-[10px] font-black uppercase text-slate-400 mb-1 text-left"># Vencidas</label><input required type="number" className="w-full p-3 border border-slate-200 rounded-xl font-mono text-sm outline-none focus:border-slate-900 transition-all text-left" value={newClient.overdueCount} onChange={e => setNewClient({...newClient, overdueCount: e.target.value})} /></div>
                </div>
                {newClient.subType === 'ACV' && (
                  <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-1 text-left">Monto Plan ($)</label><input required type="number" className="w-full p-3 border border-slate-200 rounded-xl font-mono text-sm outline-none focus:border-emerald-500 transition-all text-left" value={newClient.planAmount} onChange={e => setNewClient({...newClient, planAmount: e.target.value})} /></div>
                )}
              </div>
              <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-black transition-all active:scale-95 mt-4 text-center">Guardar Registro</button>
            </form>
          </div>
        </div>
      )}

      {/* CONFIGURACIÓN CON BORRADO INDEPENDIENTE */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-[500] flex items-center justify-center p-6 backdrop-blur-md animate-fade-in text-left">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-10 shadow-2xl text-left">
            <div className="flex justify-between items-center mb-8 text-left">
               <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest text-left">Ajustes Generales</h3>
               <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-900 transition-all p-1 text-left"><X className="w-5 h-5 text-left" /></button>
            </div>
            <div className="space-y-6 text-left">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 text-left">WhatsApp Institucional</label>
                <input type="text" className="w-full bg-transparent border-b-2 border-slate-200 p-2 font-mono font-black text-lg outline-none text-left" value={senderNumber} onChange={e => setSenderNumber(e.target.value)} />
              </div>
              <div className="pt-4 border-t border-slate-100 text-left">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 text-left">Zona de Peligro (Independiente)</p>
                <div className="grid grid-cols-1 gap-2">
                   <button onClick={() => { setDeleteTarget('standard'); setShowDeleteConfirm(true); }} className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-black uppercase text-[9px] hover:bg-red-600 hover:text-white transition-all text-left px-4">Borrar Estándar</button>
                   <button onClick={() => { setDeleteTarget('ADP'); setShowDeleteConfirm(true); }} className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-black uppercase text-[9px] hover:bg-red-600 hover:text-white transition-all text-left px-4">Borrar ADP</button>
                   <button onClick={() => { setDeleteTarget('ACV'); setShowDeleteConfirm(true); }} className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-black uppercase text-[9px] hover:bg-red-600 hover:text-white transition-all text-left px-4">Borrar ACV</button>
                   <button onClick={() => { setDeleteTarget('all'); setShowDeleteConfirm(true); }} className="w-full border border-red-200 text-red-700 py-3 rounded-xl font-black uppercase text-[9px] hover:bg-red-700 hover:text-white transition-all text-left px-4">Borrar Todo</button>
                </div>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-[10px] shadow-lg hover:bg-black transition-all active:scale-95 mt-2 text-center">Guardar y Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-red-900/90 z-[600] flex items-center justify-center p-6 backdrop-blur-xl animate-fade-in text-center">
          <div className="bg-white rounded-[2rem] max-w-sm p-10 text-left shadow-2xl mx-auto border-t-8 border-red-600">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-md"><AlertCircle className="w-8 h-8 text-left" /></div>
            <h3 className="text-xl font-black uppercase mb-2 tracking-tighter text-left">Confirmar Borrado?</h3>
            <p className="text-slate-50 text-sm mb-8 leading-relaxed text-left">
              Se eliminarán permanentemente los clientes de la base <strong>{deleteTarget === 'all' ? 'TOTAL' : deleteTarget}</strong> del asesor <strong>{currentUser}</strong>.
            </p>
            <div className="space-y-2 text-left">
               <button onClick={handleClearDatabase} className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase text-[10px] shadow-lg active:scale-95 text-center">Confirmar Borrado</button>
               <button onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }} className="w-full bg-slate-100 text-slate-400 py-4 rounded-xl font-black uppercase text-[10px] hover:bg-slate-200 transition-all text-center">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORTACIÓN */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/90 z-[500] flex items-center justify-center p-6 backdrop-blur-2xl animate-fade-in text-center">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm p-12 border-4 border-slate-900 text-center">
             <div className="w-20 h-20 bg-slate-900 text-yellow-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl text-left"><FileSpreadsheet className="w-10 h-10 text-left" /></div>
             <h3 className="text-2xl font-black italic uppercase mb-2 tracking-tighter text-slate-900 text-center text-center">Carga Estándar</h3>
             <p className="text-slate-400 text-[10px] font-black uppercase mb-10 tracking-[0.2em] text-center text-center">Base Independiente • Excel</p>
             <input type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e, 'standard', 'ADP')} className="hidden" id="file-std" />
             <label htmlFor="file-std" className="cursor-pointer block w-full py-5 bg-slate-900 text-yellow-400 rounded-2xl text-[10px] font-black uppercase shadow-2xl hover:scale-105 active:scale-95 transition-all text-center">Seleccionar Archivo</label>
             <button onClick={() => setShowImportModal(false)} className="mt-8 text-[10px] font-black uppercase text-slate-300 hover:text-slate-500 transition-all text-center text-center">Cancelar</button>
          </div>
        </div>
      )}

      {showAdjImportModal && (
        <div className="fixed inset-0 bg-slate-900/90 z-[500] flex items-center justify-center p-6 backdrop-blur-2xl animate-fade-in text-center">
          <div className={`bg-white rounded-[3rem] shadow-2xl w-full max-w-sm p-12 border-4 ${importingSubType === 'ACV' ? 'border-emerald-500' : 'border-blue-600'} text-center`}>
             <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl ${importingSubType === 'ACV' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'} text-left`}><FileSpreadsheet className="w-10 h-10 text-left" /></div>
             <h3 className="text-2xl font-black italic uppercase mb-2 tracking-tighter text-slate-900 text-center text-center text-center">Carga {importingSubType}</h3>
             <p className="text-slate-400 text-[10px] font-black uppercase mb-10 tracking-[0.2em] text-center text-center text-center">Mapeo: CLIENTE, TEL, CUOTA, #VENC, MONTO PLAN</p>
             <input type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e, 'adjudicated', importingSubType)} className="hidden" id="file-adj" />
             <label htmlFor="file-adj" className={`cursor-pointer block w-full py-5 rounded-2xl text-[10px] font-black uppercase shadow-2xl text-white hover:scale-105 active:scale-95 transition-all text-center ${importingSubType === 'ACV' ? 'bg-emerald-500' : 'bg-blue-600'}`}>Seleccionar Excel {importingSubType}</label>
             <button onClick={() => setShowAdjImportModal(false)} className="mt-8 text-[10px] font-black uppercase text-slate-300 hover:text-slate-500 transition-all text-center text-center text-center">Cancelar</button>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICACIÓN */}
      {notification && (
        <div className="fixed bottom-10 right-10 z-[700] animate-bounce-in text-left">
          <div className="bg-slate-900 text-white px-6 py-5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 text-left">
             <div className="bg-yellow-400 p-1 rounded-lg text-black text-left"><CheckCircle className="w-5 h-5 text-left" /></div>
             <span className="text-[10px] font-black uppercase tracking-[0.1em] text-left">{notification.message}</span>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        @keyframes bounce-in { 0% { opacity: 0; transform: scale(0.3) translateY(50px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
      `}} />
    </div>
  );
}