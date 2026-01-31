import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useState } from 'react';

export function SuccessCases() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const testimonials = [
    {
      name: 'Maria Silva',
      location: 'São Paulo, SP',
      case: 'Empréstimo não contratado',
      amount: 'R$ 8.500',
      text: 'Descobri um empréstimo no meu nome que nunca fiz. A IndenizaAí me ajudou a provar e consegui a indenização em 3 meses!'
    },
    {
      name: 'João Santos',
      location: 'Rio de Janeiro, RJ',
      case: 'Tarifas bancárias indevidas',
      amount: 'R$ 3.200',
      text: 'Anos pagando taxas abusivas. Em 30 segundos descobri que tinha direito à devolução. Processo simples e resultado garantido!'
    },
    {
      name: 'Ana Costa',
      location: 'Belo Horizonte, MG',
      case: 'Voo atrasado 8 horas',
      amount: 'R$ 5.000',
      text: 'Nunca imaginei que poderia ser indenizada por atraso de voo. A plataforma mostrou meus direitos e me ajudou a receber!'
    },
    {
      name: 'Carlos Oliveira',
      location: 'Porto Alegre, RS',
      case: 'Score de crédito incorreto',
      amount: 'R$ 6.800',
      text: 'Meu score estava errado há anos. Com a análise da IA, provei o erro e recebi indenização por danos morais.'
    }
  ];

  const next = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section id="casos" className="w-full px-4 md:px-6 py-16 md:py-20 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-['Archivo'] font-bold text-center mb-3 text-[#0F172A]" style={{ fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-1px' }}>
          Casos de sucesso
        </h2>
        <p className="font-['Inter'] text-base md:text-lg text-center text-[#64748B] mb-12 md:mb-16 max-w-2xl mx-auto">
          Veja quanto nossos usuários já recuperaram
        </p>
        
        <div className="relative">
          <div className="bg-gradient-to-br from-[#1C80B2] to-[#165F8A] rounded-[24px] p-8 md:p-12 text-white" style={{ boxShadow: '0 20px 60px rgba(28, 128, 178, 0.25)' }}>
            <div className="flex items-start gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} fill="currentColor" className="text-[#A3C852] md:w-6 md:h-6" />
              ))}
            </div>
            
            <p className="font-['Inter'] text-lg md:text-xl mb-8 leading-relaxed">
              "{testimonials[currentIndex].text}"
            </p>
            
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="font-['Archivo'] text-xl md:text-2xl font-bold mb-2">{testimonials[currentIndex].name}</p>
                <p className="font-['Inter'] text-sm md:text-base text-blue-100">{testimonials[currentIndex].location}</p>
                <p className="font-['Inter'] text-sm md:text-base text-blue-100 mt-2">📋 {testimonials[currentIndex].case}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-[16px] p-5 md:p-6 border border-white/20">
                <p className="font-['Inter'] text-xs md:text-sm text-blue-100 mb-2">Valor recuperado</p>
                <p className="font-['Archivo'] text-3xl md:text-5xl font-bold text-[#A3C852]">{testimonials[currentIndex].amount}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="w-12 h-12 rounded-full bg-white hover:bg-[#E0ECF3] border-2 border-[#E2E8F0] flex items-center justify-center transition-all duration-300 hover:border-[#1C80B2] hover:shadow-md"
              aria-label="Depoimento anterior"
            >
              <ChevronLeft size={24} className="text-[#64748B]" />
            </button>
            
            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex ? 'bg-[#1C80B2] w-8' : 'bg-[#64748B] w-2 opacity-30'
                  }`}
                  aria-label={`Ir para depoimento ${index + 1}`}
                />
              ))}
            </div>
            
            <button
              onClick={next}
              className="w-12 h-12 rounded-full bg-white hover:bg-[#E0ECF3] border-2 border-[#E2E8F0] flex items-center justify-center transition-all duration-300 hover:border-[#1C80B2] hover:shadow-md"
              aria-label="Próximo depoimento"
            >
              <ChevronRight size={24} className="text-[#64748B]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
