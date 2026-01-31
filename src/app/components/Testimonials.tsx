import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

const Testimonials = () => {
    const cases = [
        { name: "João Silva", value: "R$ 5.000", text: "Recuperei meu dinheiro da passagem aérea em 2 semanas!" },
        { name: "Maria Oliveira", value: "R$ 3.000", text: "Nome limpo e indenização por danos morais." },
        { name: "Carlos Souza", value: "R$ 8.500", text: "O banco devolveu o valor cobrado indevidamente." }
    ];
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        const i = setInterval(() => setIdx(curr => (curr + 1) % cases.length), 4000);
        return () => clearInterval(i);
    }, []);

    return (
        <div className="w-full mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
                <Star className="size-4 text-yellow-400 fill-yellow-400" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Casos de Sucesso</p>
            </div>
            {/* Note: In a real implementation we might want a proper carousel lib or AnimatePresence */}
            <div key={idx} className="animate-in fade-in slide-in-from-right duration-500">
                <p className="text-[#0f172a] font-medium text-sm">"{cases[idx].text}"</p>
                <div className="flex justify-between items-center mt-2">
                    <p className="text-gray-500 text-xs">{cases[idx].name}</p>
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">
                        Ganhou {cases[idx].value}
                    </span>
                </div>
            </div>
            <div className="flex justify-center gap-1 mt-3">
                {cases.map((_, i) => (
                    <div key={i} className={`h-1.5 w-1.5 rounded-full transition-all ${i === idx ? 'bg-[#1c80b2] w-3' : 'bg-gray-200'}`} />
                ))}
            </div>
        </div>
    );
};

export default Testimonials;
