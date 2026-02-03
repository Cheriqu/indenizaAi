import logoImage from "@/assets/logo.png";
import wavesBackground from "@/assets/background-waves.png";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, RefreshCcw, Lock } from "lucide-react";
import { Footer } from "@/app/components/Footer";

export default function About() {
    return (
        <div className="min-h-screen w-full bg-[#E5EEF2] relative overflow-hidden font-archivo flex flex-col">

            {/* Header/Logo */}
            <header className="pt-8 pb-4 px-4 md:px-8 flex justify-between items-center relative z-20 max-w-7xl mx-auto w-full">
                <Link to="/" className="text-[#1c80b2] hover:bg-white/50 p-2 rounded-full transition-colors">
                    <ArrowLeft className="size-6" />
                </Link>
                <Link to="/">
                    <img
                        src={logoImage}
                        alt="IndenizaAi"
                        className="h-10 md:h-12 w-auto object-contain cursor-pointer transition-transform hover:scale-105"
                    />
                </Link>
                <div className="w-10"></div> {/* Spacer for center alignment */}
            </header>

            {/* Background Waves */}
            <div className="absolute top-0 left-0 w-full h-[600px] pointer-events-none overflow-hidden mix-blend-multiply opacity-40 -mt-20">
                <img src={wavesBackground} alt="" className="w-full h-full object-cover scale-150 origin-top" />
            </div>

            <main className="flex-grow container mx-auto px-4 py-8 relative z-10 max-w-4xl">

                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-[#1c80b2] mb-8 text-center">Sobre a Plataforma</h1>

                    {/* Disclaimer */}
                    <section className="mb-10">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="bg-blue-50 p-3 rounded-xl hidden md:block">
                                <ShieldCheck className="size-6 text-[#1c80b2]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[#0f172a] mb-3">Como Funciona</h2>
                                <p className="text-gray-600 leading-relaxed text-justify">
                                    O IndenizaAi é uma plataforma de tecnologia voltada para a análise jurimétrica preliminar de casos cotidianos. Utilizamos inteligência artificial para comparar relatos de usuários com bases de dados públicas de tribunais, oferecendo uma estimativa estatística de probabilidade e valores.
                                    <br /><br />
                                    <strong>Importante:</strong> Não somos um escritório de advocacia e não prestamos consultoria jurídica. As informações fornecidas são meramente informativas e baseadas em dados históricos, não garantindo resultado futuro. A decisão de buscar reparação judicial é exclusiva do usuário, que deve sempre consultar um profissional habilitado (advogado) para orientação técnica específica. O IndenizaAi se exime de qualquer responsabilidade sobre o desfecho de processos judiciais ou extrajudiciais iniciados com base em nossas análises.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Reembolso */}
                    <section className="mb-10">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="bg-green-50 p-3 rounded-xl hidden md:block">
                                <RefreshCcw className="size-6 text-[#1c80b2]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[#0f172a] mb-3">Política de Reembolso</h2>
                                <p className="text-gray-600 leading-relaxed text-justify">
                                    Prezamos pela transparência e satisfação total de nossos usuários. Caso você não fique satisfeito com o relatório gerado ou sinta que a análise não atendeu às suas expectativas, garantimos o seu direito ao reembolso.
                                    <br /><br />
                                    Você pode solicitar a devolução integral do valor pago em até 7 dias, através de qualquer um dos nossos canais de atendimento (e-mail ou Instagram). Nos comprometemos a realizar o estorno financeiro em até <strong>3 dias úteis</strong> após a solicitação, sem burocracia.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Divider */}
                    <hr className="my-10 border-gray-100" />

                    {/* LGPD */}
                    <section>
                        <div className="flex items-center gap-2 mb-6">
                            <Lock className="size-5 text-gray-400" />
                            <h2 className="text-lg font-bold text-gray-400 uppercase tracking-widest">Aviso de Privacidade e LGPD</h2>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6 md:p-8 text-xs text-gray-500 leading-relaxed border border-gray-100 text-justify">
                            <h3 className="font-bold text-gray-700 mb-2 uppercase">Última atualização: Fevereiro de 2026</h3>
                            <p className="mb-4">
                                O INDENIZA AI reitera seu compromisso com a privacidade e a segurança dos dados de seus usuários durante todo o processo de interação com os nossos produtos/serviços e, por este motivo, elaborou o presente Aviso de Privacidade com o objetivo de informar, de maneira transparentes, como tratamos seus dados pessoais.
                            </p>

                            <h4 className="font-bold text-gray-700 mt-4 mb-2">1. DEFINIÇÕES</h4>
                            <p className="mb-2">
                                "DADOS PESSOAIS": qualquer informação relativa a uma pessoa natural identificada ou identificável. "TRATAMENTO": qualquer operação, inclusive por meios automatizados ou não automatizados, tais como a coleta, o registro, a organização, a conservação, a eliminação ou a destruição. "LGPD": Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
                            </p>

                            <h4 className="font-bold text-gray-700 mt-4 mb-2">2. TIPOS DE DADOS PESSOAIS QUE TRATAMOS</h4>
                            <p className="mb-2">
                                Coletamos informações que você nos fornece voluntariamente para a execução do serviço de análise, tais como: nome, e-mail, telefone (WhatsApp), cidade e o relato do problema. Esses dados são essenciais para a geração do relatório personalizado e contato com advogados parceiros, caso expressamente autorizado por você.
                            </p>

                            <h4 className="font-bold text-gray-700 mt-4 mb-2">3. COMO E POR QUE TRATAMOS SEUS DADOS</h4>
                            <p className="mb-2">
                                Tratamos seus dados pessoais para executar o serviço contratado (análise jurimétrica) e, mediante seu consentimento (checkbox "Aceita Advogado"), para conectá-lo a parceiros jurídicos. A base legal para o tratamento é a Execução de Contrato e o Consentimento do titular.
                            </p>

                            <h4 className="font-bold text-gray-700 mt-4 mb-2">4. ARMAZENAMENTO E SEGURANÇA</h4>
                            <p className="mb-2">
                                Adotamos medidas técnicas para garantir que todas as informações coletadas sejam armazenadas com segurança. Seus dados pessoais serão eliminados quando perderem a utilidade para os fins que foram coletados ou mediante solicitação de exclusão.
                            </p>

                            <h4 className="font-bold text-gray-700 mt-4 mb-2">5. SEUS DIREITOS</h4>
                            <p className="mb-2">
                                Você pode solicitar a confirmação da existência de tratamento, o acesso aos dados, a correção de dados incompletos ou a eliminação dos dados pessoais a qualquer momento através de nossos canais de atendimento.
                            </p>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
