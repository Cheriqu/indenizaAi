import { Instagram } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
    return (
        <footer className="bg-[#1e293b] py-8 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-[#94a3b8]">

                {/* Instagram */}
                <a
                    href="https://www.instagram.com/indeniza.ia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-white transition-colors duration-300 group"
                >
                    <div className="p-2 bg-white/5 rounded-full group-hover:bg-[#E1306C]/20 transition-colors">
                        <Instagram size={18} className="text-[#94a3b8] group-hover:text-[#E1306C]" />
                    </div>
                    <span>@indeniza.ia</span>
                </a>

                <span className="hidden md:block text-gray-700">•</span>

                {/* Sobre Nós */}
                <Link to="/about" className="hover:text-white transition-colors duration-300">
                    Sobre Nós
                </Link>

                <span className="hidden md:block text-gray-700">•</span>

                {/* Copyright */}
                <p>© 2026 IndenizaAí - Todos os direitos reservados</p>
            </div>
        </footer>
    );
}
