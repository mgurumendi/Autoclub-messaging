import React, { useState, useEffect } from 'react';
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
  ClipboardPaste,
  LogOut,
  Car,
  ChevronRight,
  BarChart4,
  Briefcase,
  Wallet,
  CalendarCheck,
  Phone,
} from 'lucide-react';

// Lista de Usuarios Autorizados
const AUTHORIZED_USERS = [
  'Fabiola Narváez',
  'Gianella Baux',
  'Jordy Cruz',
  'Miguel Gurumendi',
];

export default function App() {
  // --- Carga de Librería Excel ---
  useEffect(() => {
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src =
        'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // --- ESTADOS ---
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [clients, setClients] = useState([]);
  const [senderNumber, setSenderNumber] = useState('');

  const [view, setView] = useState('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchIndex, setBatchIndex] = useState(0);
  const [batchCooldown, setBatchCooldown] = useState(0);

  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    debt: '',
    installmentValue: '',
  });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [importText, setImportText] = useState('');

  const [showClearModal, setShowClearModal] = useState(false);
  const [notification, setNotification] = useState(null);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      setIsDataLoaded(false);
      setClients([]);

      // Reset UI
      setView('dashboard');
      setBatchIndex(0);
      setBatchCooldown(0);
      setShowBatchModal(false);
      setShowAddModal(false);
      setShowPayModal(false);
      setShowImportModal(false);
      setSelectedClient(null);

      const userKey = currentUser.replace(/\s+/g, '').toLowerCase();
      const storageKey = `cobranzas_v3_data_${userKey}`;
      const settingsKey = `cobranzas_v3_settings_${userKey}`;

      setTimeout(() => {
        const savedData = localStorage.getItem(storageKey);
        const savedSettings = localStorage.getItem(settingsKey);

        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            setClients(Array.isArray(parsedData) ? parsedData : []);
          } catch (e) {
            setClients([]);
          }
        } else {
          setClients([]);
        }

        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          setSenderNumber(settings.senderNumber || '');
        } else {
          setSenderNumber('0963098362');
        }

        setLoading(false);
        setIsDataLoaded(true);
      }, 600);
    } else {
      setClients([]);
      setIsDataLoaded(false);
    }
  }, [currentUser]);

  // --- GUARDADO AUTOMÁTICO ---
  useEffect(() => {
    if (currentUser && isDataLoaded && !loading) {
      const userKey = currentUser.replace(/\s+/g, '').toLowerCase();
      const storageKey = `cobranzas_v3_data_${userKey}`;
      localStorage.setItem(storageKey, JSON.stringify(clients));
    }
  }, [clients, currentUser, loading, isDataLoaded]);

  useEffect(() => {
    if (currentUser && isDataLoaded && !loading) {
      const userKey = currentUser.replace(/\s+/g, '').toLowerCase();
      const settingsKey = `cobranzas_v3_settings_${userKey}`;
      localStorage.setItem(settingsKey, JSON.stringify({ senderNumber }));
    }
  }, [senderNumber, currentUser, loading, isDataLoaded]);

  useEffect(() => {
    let interval = null;
    if (batchCooldown > 0) {
      interval = setInterval(() => {
        setBatchCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [batchCooldown]);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- LÓGICA DE NEGOCIO ---
  const getOwedMonthsString = (debt, installmentValue) => {
    if (!installmentValue || installmentValue <= 0) return 'cuotas pendientes';
    const count = Math.ceil(debt / installmentValue);
    if (count <= 0) return 'sin deuda';

    const months = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const currentMonthIndex = new Date().getMonth();
    let owedMonths = [];

    for (let i = 0; i < count; i++) {
      let index = currentMonthIndex - i;
      if (index < 0) index = 12 + index;
      owedMonths.unshift(months[index]);
    }

    if (owedMonths.length === 1) return `${owedMonths[0]}`;
    const lastMonth = owedMonths.pop();
    return `${owedMonths.join(', ')} y ${lastMonth}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const handleAddClient = (e) => {
    e.preventDefault();
    const client = {
      id: Date.now(),
      name: newClient.name,
      phone: newClient.phone.replace(/\D/g, ''),
      debt: parseFloat(newClient.debt),
      installmentValue: parseFloat(newClient.installmentValue),
      lastMessage: null,
      status: 'active',
      messageCount: 0,
    };
    setClients([...clients, client]);
    setNewClient({ name: '', phone: '', debt: '', installmentValue: '' });
    setShowAddModal(false);
    showToast(
      `Cliente agregado a la lista de ${currentUser.split(' ')[0]}.`,
      'success'
    );
  };

  const handleClearDatabase = () => {
    setShowClearModal(true);
  };

  const confirmClearDatabase = () => {
    setClients([]);
    setShowClearModal(false);
    showToast('Tu base de datos personal ha sido limpiada.', 'success');
  };

  const processRows = (rows) => {
    const newClients = [];
    let errorCount = 0;

    rows.forEach((row, index) => {
      if (!row || row.length === 0) return;
      let columns = [];
      if (Array.isArray(row)) {
        columns = row;
      } else if (typeof row === 'string') {
        const delimiter = row.includes('\t') ? '\t' : ',';
        columns = row
          .split(delimiter)
          .map((c) => c.trim().replace(/^"|"$/g, ''));
      }

      if (
        index === 0 &&
        columns[0] &&
        (columns[0].toString().toLowerCase().includes('cliente') ||
          columns[0].toString().toLowerCase().includes('nombre'))
      )
        return;

      if (columns.length >= 4) {
        const name = columns[0] ? columns[0].toString().trim() : '';
        const phone = columns[1]
          ? columns[1].toString().replace(/\D/g, '')
          : '';
        let rawInstallment = columns[2]
          ? columns[2].toString().replace(/[^\d.]/g, '')
          : '0';
        const installmentVal = parseFloat(rawInstallment);
        let rawOverdue = columns[3]
          ? columns[3].toString().replace(/[^\d.]/g, '')
          : '0';
        const overdueCount = parseFloat(rawOverdue);

        if (name && phone && !isNaN(installmentVal) && !isNaN(overdueCount)) {
          const totalDebt = overdueCount * installmentVal;
          if (totalDebt > 0) {
            newClients.push({
              id: Date.now() + Math.random(),
              name: name,
              phone: phone,
              installmentValue: installmentVal,
              debt: totalDebt,
              lastMessage: null,
              status: 'active',
              messageCount: 0,
            });
          }
        } else {
          errorCount++;
        }
      }
    });

    if (newClients.length > 0) {
      setClients((prev) => [...prev, ...newClients]);
      showToast(
        `Se importaron ${newClients.length} clientes al perfil de ${currentUser}.`,
        'success'
      );
      setShowImportModal(false);
      setImportText('');
    } else {
      showToast('No se encontraron datos válidos.', 'error');
    }
  };

  const processTextData = (textData) => {
    if (!textData) return;
    const lines = textData.split(/\r\n|\n/);
    processRows(lines);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      if (window.XLSX) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const data = new Uint8Array(evt.target.result);
            const workbook = window.XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = window.XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
            });
            processRows(jsonData);
          } catch (error) {
            showToast('Error al leer archivo Excel.', 'error');
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        showToast('Cargando lector... intenta en 2s.', 'warning');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      processTextData(evt.target.result);
    };
    reader.readAsText(file);
  };

  const handlePayment = (e) => {
    e.preventDefault();
    if (!selectedClient) return;

    const amount = parseFloat(paymentAmount);
    const updatedClients = clients.map((c) => {
      if (c.id === selectedClient.id) {
        const newDebt = c.debt - amount;
        return {
          ...c,
          debt: newDebt <= 0 ? 0 : newDebt,
          status: newDebt <= 0 ? 'paid' : 'active',
        };
      }
      return c;
    });

    setClients(updatedClients);
    setPaymentAmount('');
    setShowPayModal(false);
    setSelectedClient(null);
    showToast('Pago registrado.', 'success');
  };

  const getClientsDueForMessage = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return [];
    }

    return clients.filter((client) => {
      if (client.status !== 'active' || client.debt <= 0) return false;
      if (!client.lastMessage) return true;
      const lastMsgDate = new Date(client.lastMessage);
      const diffTime = Math.abs(today - lastMsgDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 2;
    });
  };

  const sendWhatsApp = (client, isBatch = false) => {
    const greeting = getGreeting();
    const monthsText = getOwedMonthsString(
      client.debt,
      client.installmentValue
    );

    let phone = client.phone ? client.phone.replace(/\D/g, '') : '';
    if (phone.startsWith('0')) {
      phone = '593' + phone.substring(1);
    } else if (phone.length === 9) {
      phone = '593' + phone;
    }

    const valCuota = client.installmentValue
      ? parseFloat(client.installmentValue)
      : 0;
    const valTotal = client.debt ? parseFloat(client.debt) : 0;

    // Emojis
    const iconSmallDiamond = String.fromCodePoint(0x1f539);
    const iconMoneyBag = String.fromCodePoint(0x1f4b0);
    const iconCalendar = String.fromCodePoint(0x1f4c5);

    const message = `${greeting} ${
      client.name
    }. Esperando que se encuentre muy bien.
Le saluda  ${currentUser} del área de cartera Auto Club.
Le escribo para recordarle sus pagos pendientes:

${iconSmallDiamond} Valor de Cuota: $${valCuota.toFixed(2)}
${iconMoneyBag} Total a Pagar: $${valTotal.toFixed(2)}
${iconCalendar} Correspondiente a: ${monthsText}

Agradezcemos una vez efectuado el pago nos comparta su comprobante pago por este medio.`;

    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(
      message
    )}`;

    const newWindow = window.open(url, '_blank');
    if (
      !newWindow ||
      newWindow.closed ||
      typeof newWindow.closed == 'undefined'
    ) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    const updatedClients = clients.map((c) => {
      if (c.id === client.id) {
        return {
          ...c,
          lastMessage: new Date().toISOString().split('T')[0],
          messageCount: (c.messageCount || 0) + 1,
        };
      }
      return c;
    });
    setClients(updatedClients);

    if (isBatch) {
      setBatchCooldown(60);
      if (batchIndex < getClientsDueForMessage().length - 1) {
        setBatchIndex((prev) => prev + 1);
      } else {
        setTimeout(() => {
          setShowBatchModal(false);
          setBatchIndex(0);
          showToast('Recorrido finalizado.', 'success');
        }, 1000);
      }
    }
  };

  // --- VISTA: LOGIN (DISEÑO BLANCO Y LIMPIO + ICONOS GESTIÓN) ---
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row font-sans">
        {/* Lado Izquierdo: Branding AMARILLO con ICONOS DE GESTIÓN */}
        <div className="w-full md:w-1/2 bg-yellow-400 flex flex-col items-center justify-center p-12 relative overflow-hidden text-center shadow-2xl z-10">
          {/* Decoración sutil */}
          <div
            className="absolute top-0 left-0 w-full h-full bg-white opacity-10"
            style={{
              backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }}
          ></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-28 h-28 bg-black rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl transform hover:scale-105 transition-transform duration-500">
              <Car className="w-14 h-14 text-yellow-400" strokeWidth={2} />
            </div>

            <h1 className="text-6xl font-black text-black tracking-tighter mb-2">
              AUTO CLUB
            </h1>
            <div className="h-2 w-24 bg-black mx-auto my-6 rounded-full"></div>
            <p className="text-slate-900 text-xl font-bold tracking-widest uppercase">
              Sistema de Mensajería
            </p>
            <p className="text-slate-800 text-sm mt-2 opacity-80">
              Gestión Inteligente de Cobranzas
            </p>

            {/* ICONOS DE GESTIÓN (NUEVO) */}
            <div className="mt-12 flex items-center justify-center gap-8">
              <div className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/40 transition-colors backdrop-blur-sm">
                  <Phone className="w-6 h-6 text-black" />
                </div>
                <span className="text-xs font-bold text-black uppercase tracking-wide">
                  Contactar
                </span>
              </div>
              <div className="w-px h-8 bg-black/20"></div>
              <div className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/40 transition-colors backdrop-blur-sm">
                  <CalendarCheck className="w-6 h-6 text-black" />
                </div>
                <span className="text-xs font-bold text-black uppercase tracking-wide">
                  Gestionar
                </span>
              </div>
              <div className="w-px h-8 bg-black/20"></div>
              <div className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/40 transition-colors backdrop-blur-sm">
                  <Wallet className="w-6 h-6 text-black" />
                </div>
                <span className="text-xs font-bold text-black uppercase tracking-wide">
                  Recaudar
                </span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-10 text-slate-900 font-mono text-xs opacity-60">
            v3.0 Enterprise Edition
          </div>
        </div>

        {/* Lado Derecho: Selección de Usuario (Blanco Limpio) */}
        <div className="w-full md:w-1/2 bg-white flex flex-col justify-center p-8 md:p-16 relative">
          {/* Fondo decorativo sutil */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-slate-50 rounded-bl-full opacity-50 -z-10"></div>

          <div className="max-w-md mx-auto w-full">
            <div className="mb-10 text-left">
              <div className="inline-block p-2 bg-slate-100 rounded-lg mb-4">
                <User className="w-6 h-6 text-slate-700" />
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-2">
                Bienvenido
              </h2>
              <p className="text-slate-500 text-lg">
                Inicia sesión para acceder a tu panel.
              </p>
            </div>

            <div className="space-y-4">
              {AUTHORIZED_USERS.map((user) => (
                <button
                  key={user}
                  onClick={() => setCurrentUser(user)}
                  className="w-full flex items-center gap-5 p-5 rounded-2xl border-2 border-slate-100 hover:border-black hover:bg-slate-50 transition-all duration-300 group text-left bg-white shadow-sm hover:shadow-lg transform hover:-translate-y-1"
                >
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-yellow-400 group-hover:text-black transition-colors font-bold text-xl shadow-inner">
                    {user.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-lg group-hover:text-black">
                      {user}
                    </p>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide group-hover:text-slate-600">
                      Ejecutivo De Cobranzas
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-yellow-400 group-hover:bg-yellow-400 transition-all">
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-black" />
                  </div>
                </button>
              ))}
            </div>

            {/* PIE DE PÁGINA (FIRMA SUTIL ACTUALIZADA) */}
            <div className="mt-16 pt-6 border-t border-slate-100 flex justify-between items-center">
              <p className="text-xs text-slate-400">
                © 2025 Auto Club - Todos los derechos reservados
              </p>
              <p className="text-xs font-medium text-slate-300 hover:text-slate-500 transition-colors cursor-default">
                DEV MG
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-yellow-200 border-t-black rounded-full animate-spin mb-6"></div>
          <p className="text-slate-900 font-bold text-lg">Cargando perfil...</p>
          <p className="text-slate-500 text-sm">Bienvenido, {currentUser}</p>
        </div>
      </div>
    );
  }

  // --- VISTA PRINCIPAL (DASHBOARD) ---
  const dueClients = getClientsDueForMessage();
  const totalDebt = clients.reduce(
    (acc, curr) => acc + (curr.status === 'active' ? curr.debt : 0),
    0
  );
  const currentBatchClient = dueClients[batchIndex];
  const historyClients = clients
    .filter((c) => c.messageCount > 0)
    .sort((a, b) => new Date(b.lastMessage) - new Date(a.lastMessage));

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Toast */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce-in transition-all transform border-l-4 bg-white ${
            notification.type === 'error'
              ? 'border-red-500 text-red-600'
              : 'border-yellow-400 text-slate-800'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-6 h-6" />
          ) : (
            <CheckCircle className="w-6 h-6 text-yellow-500" />
          )}
          <div>
            <p className="font-bold text-sm">
              {notification.type === 'error' ? 'Error' : 'Éxito'}
            </p>
            <p className="text-xs opacity-70">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 hover:bg-slate-100 p-1 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER: Blanco Limpio con detalles Negros y Amarillos */}
      <header className="bg-white px-6 py-4 sticky top-0 z-10 shadow-sm border-t-4 border-yellow-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-black p-2 rounded-lg shadow-md">
              <Car className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900">
                AUTO CLUB
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1 font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md border border-yellow-200">
                  <User className="w-3 h-3" /> {currentUser}
                </span>
                <span className="opacity-30">|</span>
                <span className="flex items-center gap-1 font-mono text-slate-400">
                  <Smartphone className="w-3 h-3" />
                  {senderNumber || '---'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCurrentUser(null)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowConfigModal(true)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Configurar"
            >
              <Settings className="w-5 h-5" />
            </button>

            <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

            <button
              onClick={handleClearDatabase}
              className="flex items-center gap-2 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 px-4 py-2 rounded-lg transition-colors font-medium text-sm border border-slate-200 hover:border-red-200 shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 bg-black hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-colors font-bold text-sm shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4 text-yellow-400" />
              Importar
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black px-5 py-2 rounded-lg transition-colors font-extrabold text-sm shadow-md active:translate-y-1"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex gap-8 mt-6 border-b border-slate-200">
          <button
            onClick={() => setView('dashboard')}
            className={`pb-3 text-sm font-bold transition-colors flex items-center gap-2 border-b-2 px-2 ${
              view === 'dashboard'
                ? 'border-yellow-400 text-black'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Tablero Principal
          </button>
          <button
            onClick={() => setView('history')}
            className={`pb-3 text-sm font-bold transition-colors flex items-center gap-2 border-b-2 px-2 ${
              view === 'history'
                ? 'border-yellow-400 text-black'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <History className="w-4 h-4" />
            Historial de Gestión
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {view === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <div className="lg:col-span-2 space-y-6">
              {/* 1. Centro de Acción */}
              <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-500" />
                      Gestión Diaria
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Tienes{' '}
                      <span className="font-bold text-black bg-yellow-100 px-2 rounded-md">
                        {dueClients.length}
                      </span>{' '}
                      mensajes sugeridos para hoy.
                    </p>
                  </div>

                  {dueClients.length > 0 && (
                    <button
                      onClick={() => {
                        setBatchIndex(0);
                        setBatchCooldown(0);
                        setShowBatchModal(true);
                      }}
                      className="flex items-center gap-2 bg-black hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-lg transition-all active:scale-95 animate-pulse border-b-4 border-slate-700"
                    >
                      <Play className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      Iniciar Recorrido
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto bg-slate-50/50">
                  {dueClients.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      <CheckCircle className="w-16 h-16 mx-auto mb-3 text-emerald-500 opacity-20" />
                      <p className="font-bold text-slate-600">¡Todo al día!</p>
                      <p className="text-sm">No tienes gestiones pendientes.</p>
                    </div>
                  ) : (
                    dueClients.map((client) => (
                      <div
                        key={client.id}
                        className="p-4 hover:bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors border-l-4 border-transparent hover:border-yellow-400 hover:shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                            {client.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {client.name}
                            </p>
                            <p className="text-xs text-slate-500 mb-1 font-mono">
                              Deuda:{' '}
                              <span className="font-bold text-red-600">
                                ${client.debt}
                              </span>{' '}
                              (
                              {getOwedMonthsString(
                                client.debt,
                                client.installmentValue
                              )}
                              )
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => sendWhatsApp(client)}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-yellow-400 hover:bg-yellow-50 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          <MessageCircle className="w-3 h-3 text-yellow-600" />
                          Manual
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 2. Cartera Completa */}
              <div className="bg-white rounded-xl shadow-md border border-slate-100">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="font-bold text-lg text-slate-900">
                    Cartera Total
                  </h2>
                  <div className="relative hidden sm:block">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar cliente..."
                      className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 w-48 bg-slate-50"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3">Cliente</th>
                        <th className="px-6 py-3 text-right">Cuota</th>
                        <th className="px-6 py-3 text-right">Total Deuda</th>
                        <th className="px-6 py-3">Detalle</th>
                        <th className="px-6 py-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clients.map((client) => (
                        <tr
                          key={client.id}
                          className="hover:bg-yellow-50/50 group"
                        >
                          <td className="px-6 py-3">
                            <div className="font-bold text-slate-800">
                              {client.name}
                            </div>
                            <div className="text-xs text-slate-400">
                              {client.phone}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-right text-slate-600 font-mono">
                            ${client.installmentValue}
                          </td>
                          <td className="px-6 py-3 text-right font-mono font-bold text-slate-900">
                            ${client.debt}
                          </td>
                          <td className="px-6 py-3 text-xs text-slate-500 max-w-[200px] truncate">
                            {client.status === 'paid' ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Al día
                              </span>
                            ) : (
                              getOwedMonthsString(
                                client.debt,
                                client.installmentValue
                              )
                            )}
                          </td>
                          <td className="px-6 py-3 text-center">
                            {client.status === 'active' && (
                              <button
                                onClick={() => {
                                  setSelectedClient(client);
                                  setShowPayModal(true);
                                }}
                                className="text-slate-500 hover:text-black hover:bg-yellow-300 border border-slate-200 px-3 py-1 rounded-md font-bold text-xs transition-all"
                              >
                                Pagar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-6">
              {/* Resumen */}
              <div className="bg-black text-white rounded-xl p-6 shadow-xl border-t-4 border-yellow-400 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-20 h-20 bg-yellow-400 rounded-bl-full opacity-20"></div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Total Cartera Pendiente
                </h3>
                <div className="text-4xl font-extrabold mb-4 flex items-baseline gap-1 text-white">
                  <span className="text-2xl opacity-40 text-yellow-400">$</span>
                  {totalDebt.toFixed(2)}
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 w-full rounded-full"></div>
                </div>
                <p className="text-[10px] text-slate-500 mt-3 text-right uppercase font-bold tracking-wider">
                  Cartera de {currentUser}
                </p>
              </div>

              {/* Previsualización */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide border-b pb-2">
                  <MessageCircle className="w-4 h-4 text-yellow-500" />
                  Vista Previa
                </h3>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm text-slate-600 italic relative">
                  <div className="space-y-2">
                    <p>
                      "<strong>{getGreeting()}</strong> [Cliente]... Le saluda
                      el Ejecutivo <strong>{currentUser}</strong> del área de
                      cobranzas Auto Club."
                    </p>
                    <div className="pl-2 border-l-4 border-yellow-400 my-2">
                      <p className="not-italic text-slate-800 font-medium">
                        {String.fromCodePoint(0x1f539)}{' '}
                        <strong>Cuota: $[Valor]</strong>
                        <br />
                        {String.fromCodePoint(0x1f4b0)}{' '}
                        <strong>Total: $[Total]</strong>
                        <br />
                        {String.fromCodePoint(0x1f4c5)}{' '}
                        <strong>Meses: [Lista]</strong>
                      </p>
                    </div>
                    <p>"Agradezco su confirmación..."</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* --- VISTA: HISTORIAL --- */
          <div className="animate-fade-in">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8">
              <div className="px-6 py-6 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                    <Send className="w-5 h-5 text-yellow-500" />
                    Registro de Mensajes Enviados
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Clientes contactados por el Ejecutivo {currentUser}.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Última Gestión</th>
                      <th className="px-6 py-4 text-center">
                        Mensajes Enviados
                      </th>
                      <th className="px-6 py-4 text-center">Estado Actual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyClients.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-12 text-center text-slate-400"
                        >
                          <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p>No hay historial de gestión todavía.</p>
                        </td>
                      </tr>
                    ) : (
                      historyClients.map((client) => (
                        <tr key={client.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">
                              {client.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {client.phone}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {client.lastMessage
                              ? new Date(client.lastMessage).toLocaleDateString(
                                  'es-ES',
                                  {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  }
                                )
                              : 'Nunca'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 bg-black text-yellow-400 px-3 py-1 rounded-full font-bold text-xs border border-yellow-600">
                              <Send className="w-3 h-3" /> {client.messageCount}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {client.status === 'paid' ? (
                              <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                COBRADO
                              </span>
                            ) : (
                              <span className="text-amber-600 font-bold text-xs bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                                PENDIENTE
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: IMPORTACIÓN MASIVA */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in">
            <div className="bg-white px-6 py-4 text-slate-900 flex justify-between items-center border-b border-slate-100">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-yellow-500" /> Importar
                Excel ({currentUser})
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700">
                <p className="font-bold flex items-center gap-2 text-slate-900">
                  <FileSpreadsheet className="w-4 h-4" />
                  Soporte Excel Activo
                </p>
                <p className="mt-1">
                  Carga clientes al perfil de <strong>{currentUser}</strong>.
                </p>
              </div>

              <div className="mb-4 text-xs text-slate-500 font-medium">
                Requisito de Columnas (En orden):{' '}
                <span className="text-slate-800 bg-slate-100 px-2 py-1 rounded border">
                  Nombre
                </span>{' '}
                |{' '}
                <span className="text-slate-800 bg-slate-100 px-2 py-1 rounded border">
                  Teléfono
                </span>{' '}
                |{' '}
                <span className="text-slate-800 bg-slate-100 px-2 py-1 rounded border">
                  Valor Cuota
                </span>{' '}
                |{' '}
                <span className="text-slate-800 bg-slate-100 px-2 py-1 rounded border">
                  # Cuotas Vencidas
                </span>
              </div>

              <div className="space-y-6">
                <div className="border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl p-8 text-center transition-colors hover:bg-white hover:border-yellow-400">
                  <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-800 mb-1">
                    Subir archivo Excel (.xlsx / .xls)
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">
                    También soporta .csv
                  </p>

                  <div className="relative inline-block">
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-2 rounded-lg font-bold shadow-md transition-transform active:scale-95 border-b-4 border-yellow-500 active:border-b-0 active:translate-y-1">
                      Seleccionar Archivo
                    </button>
                  </div>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">
                    O si prefieres
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardPaste className="w-4 h-4 text-slate-500" />
                    <label className="text-sm font-medium text-slate-700">
                      Copiar y Pegar celdas
                    </label>
                  </div>
                  <textarea
                    className="w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 font-mono text-xs text-slate-600 outline-none"
                    placeholder="Pega aquí las filas si prefieres copiar manualmente..."
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                  ></textarea>
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => processTextData(importText)}
                      disabled={!importText}
                      className="text-black text-xs font-bold hover:underline disabled:opacity-50"
                    >
                      Procesar Texto Pegado
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-start">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm"
                >
                  Cerrar Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BATCH MODE */}
      {showBatchModal && currentBatchClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border-4 border-black">
            <div className="bg-black px-6 py-6 text-white flex justify-between items-start border-b border-yellow-500">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Play className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  Recorrido de Envíos
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  {currentUser} - Mensaje {batchIndex + 1} de{' '}
                  {dueClients.length}
                </p>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 text-center bg-slate-50">
              <div className="w-20 h-20 rounded-full bg-white mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-slate-800 border-4 border-black shadow-lg">
                {currentBatchClient.name.charAt(0)}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">
                {currentBatchClient.name}
              </h3>
              <p className="text-slate-500 mb-6">{currentBatchClient.phone}</p>
              <div className="bg-white rounded-xl p-4 mb-8 text-left border-l-4 border-yellow-400 shadow-sm">
                <p className="text-xs text-slate-400 font-bold uppercase mb-2">
                  Mensaje Generado:
                </p>
                <div className="text-sm text-slate-600 italic space-y-1">
                  <p>
                    "{getGreeting()} {currentBatchClient.name}... Le saluda el
                    Ejecutivo {currentUser} del área de cobranzas..."
                  </p>
                  <p>
                    {String.fromCodePoint(0x1f539)}{' '}
                    <strong>
                      Valor Cuota: ${currentBatchClient.installmentValue}
                    </strong>
                  </p>
                  <p>
                    {String.fromCodePoint(0x1f4b0)}{' '}
                    <strong>Total Pagar: ${currentBatchClient.debt}</strong>
                  </p>
                  <p>
                    {String.fromCodePoint(0x1f4c5)}{' '}
                    <strong>
                      Meses:{' '}
                      {getOwedMonthsString(
                        currentBatchClient.debt,
                        currentBatchClient.installmentValue
                      )}
                    </strong>
                  </p>
                </div>
              </div>
              {batchCooldown > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-amber-600 font-bold text-lg animate-pulse">
                    <Clock className="w-6 h-6" />
                    Esperando: {batchCooldown}s
                  </div>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Pausa de seguridad anti-spam.
                  </p>
                  <button
                    disabled
                    className="w-full bg-slate-200 text-slate-400 py-4 rounded-xl font-bold cursor-not-allowed"
                  >
                    Siguiente mensaje en {batchCooldown}s...
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => sendWhatsApp(currentBatchClient, true)}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black py-4 rounded-xl font-bold text-lg shadow-lg shadow-yellow-400/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-6 h-6" />
                  Enviar y Continuar
                </button>
              )}

              <div className="mt-4 flex justify-center">
                <button
                  onClick={() =>
                    setBatchIndex((prev) =>
                      Math.min(prev + 1, dueClients.length - 1)
                    )
                  }
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  Saltar este cliente <SkipForward className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Configurar */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-fade-in">
            <h3 className="font-bold text-lg mb-4 text-slate-800">
              Configuración de {currentUser}
            </h3>
            <div className="mb-4 opacity-50 pointer-events-none">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre del Ejecutivo
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg bg-slate-100"
                value={currentUser}
                readOnly
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tu Número de WhatsApp de Salida
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg bg-slate-50 font-mono text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder="0963098362"
              />
              <p className="text-xs text-slate-400 mt-1">
                Este número es solo referencial para tu perfil.
              </p>
            </div>
            <button
              onClick={() => setShowConfigModal(false)}
              className="w-full bg-black hover:bg-slate-900 text-yellow-400 py-2 rounded-lg font-bold border-b-4 border-yellow-500"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Nuevo Cliente */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                Nuevo Cliente
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddClient} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  required
                  type="text"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
                  value={newClient.name}
                  onChange={(e) =>
                    setNewClient({ ...newClient, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  WhatsApp
                </label>
                <input
                  required
                  type="number"
                  placeholder="593..."
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
                  value={newClient.phone}
                  onChange={(e) =>
                    setNewClient({ ...newClient, phone: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Valor Cuota
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
                    value={newClient.installmentValue}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        installmentValue: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Deuda Total
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
                    value={newClient.debt}
                    onChange={(e) =>
                      setNewClient({ ...newClient, debt: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black py-2 rounded-lg font-bold shadow-md border-b-4 border-yellow-500"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Registrar Pago */}
      {showPayModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                Registrar Pago
              </h3>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 bg-amber-50 text-amber-800 p-3 rounded-lg text-sm">
                Cliente: <strong>{selectedClient.name}</strong>
                <br />
                Deuda: <span className="font-bold">${selectedClient.debt}</span>
              </div>
              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Monto a abonar ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="number"
                      step="0.01"
                      max={selectedClient.debt}
                      className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-bold text-lg"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium shadow-lg"
                >
                  Confirmar Pago
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Limpiar */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-fade-in text-center border-t-4 border-red-500">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">
              ¿Borrar base de {currentUser}?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Esta acción eliminará <strong>SOLO tus clientes</strong> y tu
              historial.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmClearDatabase}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-lg"
              >
                Sí, Borrar Mi Base
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
