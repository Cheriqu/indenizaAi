import { useEffect, useState } from "react";
import {
  Zap,
  ArrowRight,
  Shield,
  Users,
  TrendingUp,
  CheckCircle,
  FileText,
  Search,
  Award,
  Clock,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Plane,
  CreditCard,
  Heart,
  AlertTriangle,
  Building2,
  Smile,
  Lock,
  Loader2,
  Download,
  ExternalLink,
  ChevronRight,
  History
} from "lucide-react";
import logoImage from "@/assets/logo.png";
import wavesBackground from "@/assets/background-waves.png";
import AnimatedCounter from "@/app/components/AnimatedCounter";
import { SuccessCases } from "@/app/components/SuccessCases";
import "@/styles/animations.css";

// Logic Components
import GaugeChart from "@/app/components/GaugeChart";
import SkeletonResults from "@/app/components/SkeletonResults";
import Testimonials from "@/app/components/Testimonials";
import { maskPhone } from "@/utils/maskPhone";
import { api, loadStates, loadCitiesByState } from "@/services/api";

export default function App() {
  // STATE: Flow Control
  const [step, setStep] = useState<'INPUT' | 'LOADING' | 'RESULT' | 'SUCCESS'>('INPUT');
  const [loadingText, setLoadingText] = useState('Conectando ao Tribunal de Justiça...');

  // STATE: Input Data
  const [inputValue, setInputValue] = useState("");
  const [formData, setFormData] = useState({ nome: '', email: '', whatsapp: '', cidade: '', estado: '', aceitaAdvogado: false });
  const [listaEstados, setListaEstados] = useState<{ sigla: string, nome: string }[]>([]);
  const [listaCidades, setListaCidades] = useState<string[]>([]);
  const [selectedEstado, setSelectedEstado] = useState("");

  // STATE: Analysis Data
  const [analiseId, setAnaliseId] = useState('');
  const [resultData, setResultData] = useState<any>(null);
  const [fullData, setFullData] = useState<any>(null);

  // STATE: Payment Polling
  const [aguardandoPagamento, setAguardandoPagamento] = useState(false);

  // STATE: History
  const [historico, setHistorico] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // --- USE EFFECTS ---

  useEffect(() => {
    // Initial Load - States
    loadStates().then(setListaEstados);

    // History
    const hist = JSON.parse(localStorage.getItem('indeniza_historico') || '[]');
    setHistorico(hist);

    // Intersection Observer
    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-visible");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    document.querySelectorAll(".animate-on-scroll").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Load Cities when State changes
  useEffect(() => {
    if (selectedEstado) {
      loadCitiesByState(selectedEstado).then(setListaCidades);
      setFormData(prev => ({ ...prev, estado: selectedEstado, cidade: '' })); // Reset city
    } else {
      setListaCidades([]);
    }
  }, [selectedEstado]);

  // Save History
  useEffect(() => {
    if (analiseId && !historico.includes(analiseId)) {
      const novo = [analiseId, ...historico].slice(0, 5);
      setHistorico(novo);
      localStorage.setItem('indeniza_historico', JSON.stringify(novo));
    }
  }, [analiseId]);

  // Loading Text Animation
  useEffect(() => {
    if (step === 'LOADING') {
      const msgs = [
        "Conectando ao Tribunal de Justiça...",
        "Consultando Jurisprudência (TJPR)...",
        "Comparando com casos similares...",
        "Calculando probabilidade de êxito...",
        "Gerando relatório preliminar..."
      ];
      let i = 0;
      if (!loadingText.includes("Recuperando")) setLoadingText(msgs[0]);

      const interval = setInterval(() => {
        if (!loadingText.includes("Recuperando")) {
          i = (i + 1) % msgs.length;
          setLoadingText(msgs[i]);
        }
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Payment Polling
  useEffect(() => {
    let intervalo: any;
    if (aguardandoPagamento && analiseId) {
      intervalo = setInterval(async () => {
        try {
          const data = await api.getStatusPagamento(analiseId);
          if (data.pago === true) {
            setAguardandoPagamento(false);
            unlockReport();
            clearInterval(intervalo);
          }
        } catch (e) { console.error(e); }
      }, 3000);
    }
    return () => clearInterval(intervalo);
  }, [aguardandoPagamento, analiseId]);

  // --- ACTIONS ---

  const handleAnalyze = async () => {
    if (inputValue.length < 10) return alert("Por favor, descreva melhor o caso.");
    setStep('LOADING');
    try {
      const data = await api.analyze(inputValue);
      setResultData(data);
      setAnaliseId(data.id_analise);
      setStep('RESULT');
    } catch (error: any) {
      alert(error.message || "Erro desconhecido.");
      setStep('INPUT');
    }
  };

  const handlePayment = async () => {
    if (!formData.nome || !formData.email) return alert("Preencha seus dados para continuar.");
    if (!formData.aceitaAdvogado) return alert("Por favor, aceite o termo de contato para continuar.");

    setAguardandoPagamento(true);
    try {
      const payload = {
        ...formData, resumo: inputValue, categoria: resultData.categoria,
        prob: resultData.probabilidade, valor: resultData.valor_estimado, aceita_advogado: formData.aceitaAdvogado, id_analise: analiseId
      };
      const data = await api.pagar(payload);
      if (data.link) window.open(data.link, '_blank');
    } catch (error) {
      alert("Erro ao gerar pagamento.");
      setAguardandoPagamento(false);
    }
  };

  const unlockReport = async () => {
    try {
      const data = await api.getRelatorio(analiseId);
      if (data.casos && data.casos[0].link !== '#') {
        setFullData(data);
        setStep('SUCCESS');
      } else {
        alert("Pagamento ainda não confirmado.");
      }
    } catch (error) { console.error(error); }
  };

  const loadFromHistory = async (id: string) => {
    setAnaliseId(id);
    setStep('LOADING');
    setLoadingText("Recuperando análise salva...");
    try {
      const data = await api.getRelatorio(id);
      if (data.casos && data.casos[0].link !== '#') {
        setFullData(data);
        setStep('SUCCESS');
      } else {
        setResultData(data);
        setStep('RESULT');
      }
    } catch (e) {
      alert("Não foi possível recuperar.");
      setStep('INPUT');
    }
    setShowHistory(false);
  };

  const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


  // --- RENDER HELPERS ---

  const renderInputForm = () => (
    <div className="form-card bg-white rounded-3xl p-6 md:p-8 shadow-xl relative animate-in fade-in zoom-in duration-300">
      <div className="mb-5">
        <label className="block text-sm md:text-base font-semibold text-[#0f172a] mb-2 flex justify-between">
          Conte o que aconteceu com você:
          <span className={`text-xs ${inputValue.length > 50 ? 'text-green-500' : 'text-gray-400'}`}>{inputValue.length} chars</span>
        </label>
        <textarea
          className="form-input w-full min-h-[120px] bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm md:text-base text-[#0f172a] resize-none transition-all duration-300 focus:outline-none focus:border-[#1c80b2] focus:ring-2 focus:ring-[#1c80b2]/20 shadow-inner"
          placeholder="Ex: Meu voo foi cancelado sem aviso prévio, descobri um empréstimo no meu nome que não fiz, fui cobrado por taxas bancárias abusivas..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 mb-5 text-xs md:text-sm text-[#a3c852]">
        <Zap className="w-4 h-4" />
        <span className="font-medium">Resultado em 30 segundos</span>
      </div>

      <button
        onClick={handleAnalyze}
        className="btn-primary w-full text-white text-base md:text-lg font-semibold py-3 md:py-4 px-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 bg-[#1c80b2] hover:bg-[#1567a0] cursor-pointer"
      >
        <span>Calcular Probabilidade</span>
        <Search className="w-5 h-5" />
      </button>

      <div className="mt-5 pt-5 border-t border-[#e2e8f0] flex items-center justify-center gap-2 text-xs md:text-sm text-[#64748b]">
        <Shield className="w-4 h-4 text-[#1C80B2]" />
        <span>Usamos a base de dados dos tribunais do Paraná</span>
      </div>

      {/* Testimonials inserted here */}
      <div className="mt-6">
        <Testimonials />
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="bg-white rounded-3xl p-10 md:p-12 shadow-xl flex flex-col items-center justify-center min-h-[400px] animate-in fade-in zoom-in duration-300">
      <SkeletonResults />
      <div className="mt-8 flex flex-col items-center gap-4">
        <Loader2 className="size-12 text-[#1c80b2] animate-spin" />
        <p className="text-[#0f172a] font-bold text-xl animate-pulse text-center">{loadingText}</p>
      </div>
    </div>
  );

  const renderResult = () => (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-3xl mx-auto">
      <div className="bg-green-50 rounded-xl p-4 border border-green-200 mb-6 text-center">
        <h3 className="text-[#15803d] font-bold uppercase tracking-wider text-xs mb-2">Análise Concluída com Sucesso</h3>
        <GaugeChart percentage={resultData.probabilidade} />
        <p className="text-gray-500 text-xs mt-2">Baseado em {resultData.n_casos} casos similares</p>
      </div>

      <div className="border-2 border-[#8ab03d] p-6 rounded-2xl shadow-lg relative bg-white">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#8ab03d] text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Lock className="size-3" /> RELATÓRIO BLOQUEADO
        </div>

        <h2 className="text-[#0f172a] font-bold text-xl text-center mb-6 mt-2">Desbloqueie seu Relatório Completo</h2>

        <div className="flex flex-col gap-4">
          <input placeholder="Nome Completo" className="form-input border border-gray-300 p-3 rounded-xl w-full focus:ring-2 focus:ring-[#8ab03d] outline-none" onChange={e => setFormData({ ...formData, nome: e.target.value })} />
          <input placeholder="E-mail" className="form-input border border-gray-300 p-3 rounded-xl w-full focus:ring-2 focus:ring-[#8ab03d] outline-none" onChange={e => setFormData({ ...formData, email: e.target.value })} />
          <input placeholder="WhatsApp / Celular" value={formData.whatsapp} maxLength={15} className="form-input border border-gray-300 p-3 rounded-xl w-full focus:ring-2 focus:ring-[#8ab03d] outline-none" onChange={e => setFormData({ ...formData, whatsapp: maskPhone(e.target.value) })} />
          <div className="relative flex gap-2">
            <div className="w-1/3">
              <select
                className="border border-gray-300 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-[#8ab03d] bg-white text-gray-700 appearance-none"
                value={selectedEstado}
                onChange={e => setSelectedEstado(e.target.value)}
              >
                <option value="">UF</option>
                {listaEstados.map((e) => <option key={e.sigla} value={e.sigla}>{e.sigla}</option>)}
              </select>
            </div>
            <div className="w-2/3 relative">
              <input
                list="cities-list"
                placeholder={selectedEstado ? "Digite a cidade..." : "Selecione o estado"}
                className="border border-gray-300 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-[#8ab03d] disabled:bg-gray-100"
                value={formData.cidade.split(' - ')[0]} // Show only city name part
                disabled={!selectedEstado}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, cidade: `${val} - ${selectedEstado}` });
                }}
              />
              <datalist id="cities-list">
                {listaCidades.map((c, i) => <option key={i} value={c} />)}
              </datalist>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer bg-gray-50 p-3 rounded-lg border border-gray-100">
            <input type="checkbox" className="mt-1 accent-[#8ab03d] size-4" checked={formData.aceitaAdvogado} onChange={e => setFormData({ ...formData, aceitaAdvogado: e.target.checked })} />
            <span className="text-xs text-gray-600 leading-tight">
              Aceito que um advogado parceiro indicado pela Indeniza Aí entre em contato comigo para avaliar meu caso gratuitamente.
            </span>
          </label>

          <button
            onClick={handlePayment}
            disabled={aguardandoPagamento}
            className={`w-full text-white py-4 rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${aguardandoPagamento ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1c80b2] hover:bg-[#156a92]'}`}
          >
            {aguardandoPagamento ? <><Loader2 className="animate-spin" /> Aguardando Pagamento...</> : 'DESBLOQUEAR POR R$ 9,90'}
          </button>
          <p className="text-[10px] text-center text-gray-400">Pagamento único • Ambiente Seguro via Mercado Pago 🔒</p>
        </div>
      </div>

      <div className="text-center mt-6">
        <button onClick={() => setStep('INPUT')} className="text-[#64748b] text-sm underline hover:text-[#1c80b2]">Fazer nova análise</button>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="bg-white rounded-3xl p-8 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-4xl mx-auto">
      <div className="bg-green-100 p-4 rounded-xl border border-green-300 flex items-center gap-3 mb-6">
        <CheckCircle className="text-green-700 size-6" />
        <div>
          <h3 className="text-green-900 font-bold text-sm">Pagamento Confirmado!</h3>
          <p className="text-green-800 text-xs">Seu relatório foi liberado com sucesso.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-center">
          <p className="text-[#64748b] text-xs uppercase tracking-wider font-bold mb-2">Probabilidade de Êxito</p>
          <h1 className="text-[#22c55e] text-5xl font-bold">{fullData.probabilidade.toFixed(0)}%</h1>
        </div>
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-center">
          <p className="text-[#64748b] text-xs uppercase tracking-wider font-bold mb-2">Valor Estimado</p>
          <h1 className="text-[#1c80b2] text-3xl font-bold">{formatBRL(fullData.valor_estimado)}</h1>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-bold text-[#0f172a] text-lg flex items-center gap-2 mb-4">
          <FileText className="size-5 text-[#1c80b2]" /> Jurisprudência Encontrada:
        </h3>
        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {fullData.casos.map((caso: any, index: number) => (
            <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-[#1c80b2]/30 transition-colors">
              <div className='flex justify-between items-center mb-2'>
                <span className="font-bold text-[#0f172a] text-sm">Decisão TJPR - {caso.data}</span>
                {caso.link && caso.link !== '#' && (
                  <a href={caso.link} target="_blank" rel="noopener noreferrer" className="text-[#1c80b2] flex items-center gap-1 hover:underline text-xs font-bold bg-blue-50 px-2 py-1 rounded-full">
                    Ver Processo <ExternalLink size={10} />
                  </a>
                )}
              </div>
              <p className="text-gray-600 text-xs italic mb-2">"{caso.resumo}"</p>
              <p className={`text-xs font-bold ${caso.tipo_resultado === 'VITORIA' ? 'text-green-600' : 'text-gray-400'}`}>
                {caso.tipo_resultado === 'VITORIA' ? `Valor da Causa: ${formatBRL(caso.valor || 0)}` : 'Indenização Negada'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <button onClick={() => api.downloadPdf(analiseId)} className="bg-[#1c80b2] w-full flex gap-2 items-center justify-center py-4 rounded-xl shadow-lg hover:bg-[#156a92] transition-transform active:scale-95 text-white font-bold text-lg">
          <Download className="size-6" /> BAIXAR RELATÓRIO COMPLETO (PDF)
        </button>
        <button onClick={() => setStep('INPUT')} className="text-[#64748b] text-sm underline mx-auto hover:text-[#1c80b2]">Fazer nova análise</button>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen w-full bg-[#E5EEF2] relative overflow-hidden font-archivo">
      {/* HISTORY BUTTON */}
      {step === 'INPUT' && historico.length > 0 && (
        <div className="fixed top-4 right-4 z-50">
          <button onClick={() => setShowHistory(!showHistory)} className="bg-white p-3 rounded-full shadow-lg text-[#1c80b2] hover:scale-110 transition-transform">
            <History className="size-6" />
          </button>
          {showHistory && (
            <div className="absolute top-12 right-0 bg-white shadow-xl rounded-xl p-4 w-72 border border-gray-100 animate-in fade-in zoom-in duration-200">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Análises Recentes</h4>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {historico.map((id) => (
                  <button key={id} onClick={() => loadFromHistory(id)} className="text-left text-sm text-[#0f172a] hover:bg-gray-50 p-2 rounded flex items-center justify-between group border-b border-gray-50 last:border-0">
                    <span>Análise #{id.slice(0, 4)}</span>
                    <ChevronRight className="size-4 text-gray-300 group-hover:text-[#1c80b2]" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header/Logo */}
      <header className="logo-animation pt-8 pb-4 px-4 md:px-8 flex justify-center relative z-20">
        <img
          src={logoImage}
          alt="IndenizaAi"
          className="h-10 md:h-12 w-auto object-contain cursor-pointer"
          onClick={() => setStep('INPUT')}
        />
      </header>

      {/* CONTENT AREA */}
      <section className="relative min-h-[80vh]">
        {/* Background Waves - TOP */}
        <div className="absolute top-0 left-0 w-full h-[800px] pointer-events-none overflow-hidden mix-blend-multiply opacity-40 -mt-32">
          <img src={wavesBackground} alt="" className="w-full h-full object-contain scale-150 origin-top" />
        </div>

        {/* Background Waves - BOTTOM */}
        <div className="absolute bottom-0 left-0 w-full h-[800px] pointer-events-none overflow-hidden mix-blend-multiply opacity-40 rotate-180 z-0">
          <img src={wavesBackground} alt="" className="w-full h-full object-contain scale-150 origin-top" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10">

          {/* TITLE - Chỉ hiển thị ở Input Step */}
          {step === 'INPUT' && (
            <div className="text-center mb-10 hero-content-animation">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1c80b2] mb-6 leading-tight font-archivo">
                Descubra se você tem direito
                <br />
                a indenização
              </h1>
              <div className="text-base md:text-lg text-[#64748b] max-w-2xl mx-auto">
                <span className="font-semibold text-[#1c80b2]">IA analisa seu caso em 30 segundos.</span>{" "}
                <span>Gratuito, seguro e sem burocracia.</span>
              </div>
            </div>
          )}

          {/* DYNAMIC CONTENT AREA */}
          <div className="max-w-2xl mx-auto mb-32 relative z-20 transition-all duration-500">
            {step === 'INPUT' && renderInputForm()}
            {step === 'LOADING' && renderLoading()}
            {(step === 'RESULT' || step === 'SUCCESS') && (step === 'RESULT' ? renderResult() : renderSuccess())}
          </div>

        </div>

        {/* REST OF LANDING PAGE (Only visible in INPUT step) */}
        {step === 'INPUT' && (
          <div className="animate-in fade-in duration-1000 relative z-10">
            {/* How It Works */}
            <div className="max-w-4xl mx-auto pt-8 pb-32 px-4 md:px-8 relative animate-on-scroll">
              <h2 className="text-2xl md:text-3xl font-bold text-[#0f172a] text-center mb-10 font-archivo">
                Como funciona?
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="step bg-white rounded-2xl p-6 shadow-md transition-all duration-300 hover:shadow-lg flex flex-col items-center">
                  <div className="bg-[#E8F4F8] w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-[#1C80B2]" />
                  </div>
                  <div className="bg-[#E8F4F8] px-3 py-1 rounded-full mb-3 text-center">
                    <span className="text-sm font-bold text-[#1c80b2]">1. Relate</span>
                  </div>
                  <p className="text-sm text-[#64748b] text-center leading-relaxed">Descreva o que aconteceu com você</p>
                </div>

                <div className="step bg-white rounded-2xl p-6 shadow-md transition-all duration-300 hover:shadow-lg flex flex-col items-center">
                  <div className="bg-[#1c80b2] w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="bg-[#E8F4F8] px-3 py-1 rounded-full mb-3 text-center">
                    <span className="text-sm font-bold text-[#1c80b2]">2. IA Analisa</span>
                  </div>
                  <p className="text-sm text-[#64748b] text-center leading-relaxed">Busca em milhares de casos reais</p>
                </div>

                <div className="step bg-white rounded-2xl p-6 shadow-md transition-all duration-300 hover:shadow-lg flex flex-col items-center">
                  <div className="bg-[#D8ECC4] w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                    <Smile className="w-6 h-6 text-[#8AB03D]" />
                  </div>
                  <div className="bg-[#D8ECC4] px-3 py-1 rounded-full mb-3 text-center">
                    <span className="text-sm font-bold text-[#8ab03d]">3. Resultado</span>
                  </div>
                  <p className="text-sm text-[#64748b] text-center leading-relaxed">Veja probabilidade e valor estimado</p>
                </div>
              </div>
            </div>

            {/* Trust Bar */}
            <section className="bg-gradient-to-b from-white to-[#eaf2f6] py-20 animate-on-scroll">
              <div className="max-w-6xl mx-auto px-4 md:px-8">
                <div className="grid md:grid-cols-3 gap-12">
                  <div className="stat-item bg-white rounded-2xl p-8 border-2 border-[#e2e8f0] shadow-lg shadow-[#1c80b2]/10 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1c80b2]/15">
                    <div className="bg-gradient-to-b from-[#e0ecf3] to-[#c5dae8] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-[#1C80B2]" />
                    </div>
                    <p className="text-4xl font-bold text-[#1c80b2] mb-2 font-archivo">
                      <AnimatedCounter end={5000} suffix="+" />
                    </p>
                    <p className="text-base text-[#64748b]">Casos analisados</p>
                  </div>

                  <div className="stat-item bg-white rounded-2xl p-8 border-2 border-[#e2e8f0] shadow-lg shadow-[#1c80b2]/10 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1c80b2]/15">
                    <div className="bg-gradient-to-b from-[#d8ecc4] to-[#b8d99c] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-[#8AB03D]" />
                    </div>
                    <p className="text-4xl font-bold text-[#a3c852] mb-2 font-archivo">
                      R$ <AnimatedCounter end={2.5} decimals={1} suffix="M+" />
                    </p>
                    <p className="text-base text-[#64748b]">Recuperados</p>
                  </div>

                  <div className="stat-item bg-white rounded-2xl p-8 border-2 border-[#e2e8f0] shadow-lg shadow-[#1c80b2]/10 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1c80b2]/15">
                    <div className="bg-gradient-to-b from-[#1c80b2] to-[#165f8a] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-4xl font-bold text-[#1c80b2] mb-2 font-archivo">
                      <AnimatedCounter end={87} suffix="%" />
                    </p>
                    <p className="text-base text-[#64748b]">Taxa de sucesso</p>
                  </div>
                </div>
              </div>
            </section>

            <SuccessCases />

            {/* Problems Section ... (Kept original) */}
            <section className="bg-gradient-to-b from-[#eaf2f6] to-white py-20 animate-on-scroll">
              <div className="max-w-6xl mx-auto px-4 md:px-8">
                <h2 className="text-5xl font-bold text-[#0f172a] text-center mb-4 tracking-tight font-archivo">Problemas que resolvemos</h2>
                <p className="text-lg text-[#64748b] text-center mb-12">Identifique se você tem direito a indenização em qualquer uma dessas situações</p>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  <div className="problem-card bg-white rounded-2xl p-10 border-2 border-[#e2e8f0] shadow-lg shadow-[#1c80b2]/10 transition-all duration-300 hover:-translate-y-1 hover:border-[#1c80b2]/30 hover:shadow-xl hover:shadow-[#1c80b2]/15">
                    <div className="bg-gradient-to-b from-[#fee2e2] to-[#fecaca] w-16 h-16 rounded-2xl flex items-center justify-center mb-6"><AlertTriangle className="w-8 h-8 text-[#DC2626]" /></div>
                    <h3 className="text-2xl font-semibold text-[#0f172a] mb-3 font-archivo">Empréstimos não contratados</h3>
                    <p className="text-base text-[#64748b] leading-relaxed">Descobriu um empréstimo no seu nome que você nunca fez? Você tem direito à indenização.</p>
                  </div>
                  <div className="problem-card bg-white rounded-2xl p-10 border-2 border-[#e2e8f0] shadow-lg shadow-[#1c80b2]/10 transition-all duration-300 hover:-translate-y-1 hover:border-[#1c80b2]/30 hover:shadow-xl hover:shadow-[#1c80b2]/15">
                    <div className="bg-gradient-to-b from-[#e0ecf3] to-[#c5dae8] w-16 h-16 rounded-2xl flex items-center justify-center mb-6"><CreditCard className="w-8 h-8 text-[#1C80B2]" /></div>
                    <h3 className="text-2xl font-semibold text-[#0f172a] mb-3 font-archivo">Tarifas bancárias abusivas</h3>
                    <p className="text-base text-[#64748b] leading-relaxed">Cobranças indevidas, taxas escondidas ou pacotes não solicitados. Recupere seu dinheiro.</p>
                  </div>
                  <div className="problem-card bg-white rounded-2xl p-10 border-2 border-[#e2e8f0] shadow-lg shadow-[#1c80b2]/10 transition-all duration-300 hover:-translate-y-1 hover:border-[#1c80b2]/30 hover:shadow-xl hover:shadow-[#1c80b2]/15">
                    <div className="bg-gradient-to-b from-[#e0ecf3] to-[#c5dae8] w-16 h-16 rounded-2xl flex items-center justify-center mb-6"><Plane className="w-8 h-8 text-[#1C80B2]" /></div>
                    <h3 className="text-2xl font-semibold text-[#0f172a] mb-3 font-archivo">Atrasos de voo</h3>
                    <p className="text-base text-[#64748b] leading-relaxed">Voo atrasado ou cancelado? Você pode ter direito a até R$ 10.000 de indenização.</p>
                  </div>
                  <div className="problem-card bg-white rounded-2xl p-10 border-2 border-[#e2e8f0] shadow-lg shadow-[#1c80b2]/10 transition-all duration-300 hover:-translate-y-1 hover:border-[#1c80b2]/30 hover:shadow-xl hover:shadow-[#1c80b2]/15">
                    <div className="bg-gradient-to-b from-[#d8ecc4] to-[#b8d99c] w-16 h-16 rounded-2xl flex items-center justify-center mb-6"><Smile className="w-8 h-8 text-[#8AB03D]" /></div>
                    <h3 className="text-2xl font-semibold text-[#0f172a] mb-3 font-archivo">Score de crédito incorreto</h3>
                    <p className="text-base text-[#64748b] leading-relaxed">Score errado impactando suas finanças? Corrija e seja indenizado pelos danos.</p>
                  </div>
                </div>
              </div>
            </section>

            <footer className="bg-[#1e293b] py-6 text-center">
              <p className="text-sm text-[#94a3b8]">© 2026 IndenizaAí - Todos os direitos reservados</p>
            </footer>
          </div>
        )}
      </section>
    </div>
  );
}