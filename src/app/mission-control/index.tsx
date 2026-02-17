// src/app/mission-control/index.tsx
import { Link } from "react-router-dom";
import { LayoutDashboard, CheckCircle } from "lucide-react";

export default function MissionControlPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 font-archivo">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg text-center border border-gray-100">
        <LayoutDashboard className="w-16 h-16 text-[#1c80b2] mx-auto mb-4 animate-bounce" />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mission Control</h1>
        <div className="bg-green-50 text-green-700 font-bold px-4 py-2 rounded-lg inline-flex items-center gap-2 mb-6 shadow-sm border border-green-200">
          <CheckCircle className="w-5 h-5" />
          <span>Rota /mission-control ATIVA</span>
        </div>
        
        <p className="text-gray-500 mb-6 text-sm">
          Se você vê esta mensagem, o React Router carregou a página com sucesso.<br/>
          O problema anterior foi resolvido.
        </p>

        <Link 
          to="/" 
          className="text-white bg-[#1c80b2] hover:bg-[#156a92] px-6 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 inline-block"
        >
          Voltar para Home
        </Link>
      </div>
    </div>
  );
}
