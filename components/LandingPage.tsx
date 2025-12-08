import React, { useEffect, useRef, useState } from 'react';
import './LandingPage.css';
import { Logo } from './Logo';

interface LandingPageProps {
    onLoginClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
    const [messages, setMessages] = useState<{ text: string; type: 'user' | 'ai'; html?: boolean }[]>([]);
    const cursorGlowRef = useRef<HTMLDivElement>(null);
    const cursorDotRef = useRef<HTMLDivElement>(null);
    const phoneRef = useRef<HTMLDivElement>(null);

    // --- CURSOR & INTERACTION ---
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (cursorDotRef.current) {
                cursorDotRef.current.style.left = e.clientX + 'px';
                cursorDotRef.current.style.top = e.clientY + 'px';
            }

            // Delay for glow effect
            setTimeout(() => {
                if (cursorGlowRef.current) {
                    cursorGlowRef.current.style.left = e.clientX + 'px';
                    cursorGlowRef.current.style.top = e.clientY + 'px';
                }
            }, 50);

            // Phone Tilt
            if (phoneRef.current) {
                const xAxis = (window.innerWidth / 2 - e.pageX) / 40;
                const yAxis = (window.innerHeight / 2 - e.pageY) / 40;
                phoneRef.current.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
            }
        };

        document.addEventListener('mousemove', handleMouseMove);

        // Magnetic Links
        const handleMouseEnter = () => {
            if (cursorGlowRef.current) {
                cursorGlowRef.current.style.width = '60px';
                cursorGlowRef.current.style.height = '60px';
                cursorGlowRef.current.style.background = 'transparent';
                cursorGlowRef.current.style.borderColor = '#fff';
            }
        };

        const handleMouseLeave = () => {
            if (cursorGlowRef.current) {
                cursorGlowRef.current.style.width = '30px';
                cursorGlowRef.current.style.height = '30px';
                cursorGlowRef.current.style.background = 'rgba(255, 215, 0, 0.2)';
                cursorGlowRef.current.style.borderColor = '#FFD700';
            }
        };

        const links = document.querySelectorAll('a, button, .feature-card');
        links.forEach(link => {
            link.addEventListener('mouseenter', handleMouseEnter);
            link.addEventListener('mouseleave', handleMouseLeave);
        });

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            links.forEach(link => {
                link.removeEventListener('mouseenter', handleMouseEnter);
                link.removeEventListener('mouseleave', handleMouseLeave);
            });
        };
    }, []);

    // --- CHAT SIMULATION ---
    useEffect(() => {
        const chatSequence = [
            { text: "Comprei um Nike por 600 em 3x", type: "user", delay: 800 },
            { text: "<strong>Salvo!</strong> 👟 R$ 200/mês.<br>A primeira parcela vence em Junho.", type: "ai", delay: 2500, html: true },
            { text: "Posso jantar fora hoje?", type: "user", delay: 4500 },
            { text: "Se for até R$ 80, sim. Acima disso compromete sua meta de viagem.", type: "ai", delay: 6500 }
        ];

        let timeouts: NodeJS.Timeout[] = [];

        chatSequence.forEach((msg: any) => {
            const timeout = setTimeout(() => {
                setMessages(prev => [...prev, msg]);
            }, msg.delay);
            timeouts.push(timeout);
        });

        return () => timeouts.forEach(clearTimeout);
    }, []);

    // --- SCROLL REVEAL ---
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 }); // Low threshold for better mobile detection

        const revealedElements = document.querySelectorAll('.reveal');
        revealedElements.forEach(el => observer.observe(el));

        // Fallback: Make everything visible after 1s just in case
        const timeout = setTimeout(() => {
            document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
        }, 1000);

        return () => {
            observer.disconnect();
            clearTimeout(timeout);
        };
    }, []);

    return (
        <div className="landing-page">
            <div className="bg-grid"></div>
            <div id="cursor-glow" ref={cursorGlowRef}></div>
            <div id="cursor-dot" ref={cursorDotRef}></div>

            <header className="landing-header">
                <Logo />
                <nav className="landing-nav">
                    <a href="#features">Recursos</a>
                    <a href="#pricing">Preços</a>
                    <button
                        onClick={onLoginClick}
                        className="text-sm font-medium transition-colors"
                        style={{ color: 'var(--gold-primary)', background: 'none', border: 'none' }}
                    >
                        Login
                    </button>
                </nav>
            </header>

            <section className="hero">
                <h1 className="reveal active"> {/* Hero always visible initially to prevent blank screen */}
                    Suas finanças,<br />
                    <span className="gradient-text">sem esforço.</span>
                </h1>
                <p className="subtitle reveal active">
                    O primeiro assistente que organiza sua vida financeira através de conversas naturais.
                    Você fala, o Midas cuida do resto.
                </p>

                <div className="phone-mockup reveal active" id="phoneTilt" ref={phoneRef}>
                    <div className="island"></div>
                    <div className="screen-content" id="chatScreen">
                        {messages.map((msg, idx) => {
                            if (msg.html) {
                                return (
                                    <div
                                        key={idx}
                                        className={`bubble ${msg.type}`}
                                        dangerouslySetInnerHTML={{ __html: msg.text }}
                                    />
                                );
                            }
                            return (
                                <div key={idx} className={`bubble ${msg.type}`}>
                                    {msg.text}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <div className="marquee-container">
                <div className="marquee-content">
                    <span>INTELIGÊNCIA ARTIFICIAL</span>
                    <span>•</span>
                    <span>GESTÃO FINANCEIRA</span>
                    <span>•</span>
                    <span>SEM PLANILHAS</span>
                    <span>•</span>
                    <span>CONTROLE DE GASTOS</span>
                    <span>•</span>
                    <span>PARCELAMENTO AUTOMÁTICO</span>
                    <span>•</span>
                    <span>WEALTH MANAGEMENT</span>
                    <span>•</span>
                    <span>INTELIGÊNCIA ARTIFICIAL</span>
                    <span>•</span>
                    <span>GESTÃO FINANCEIRA</span>
                    <span>•</span>
                </div>
            </div>

            <section id="features" className="features-section">
                <div className="section-header">
                    <h2>Poder de verdade.</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Tecnologia avançada envelopada em simplicidade.</p>
                </div>

                <div className="grid-cards">
                    <div className="feature-card">
                        <div className="feature-icon">🎙️</div>
                        <h3>Voice-to-Finance</h3>
                        <p style={{ color: '#aaa' }}>O motor de IA entende gírias, datas relativas ("semana que vem") e contextos complexos de áudio.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🛍️</div>
                        <h3>Parcelas Inteligentes</h3>
                        <p style={{ color: '#aaa' }}>Comprou em 10x? O Midas projeta seu fluxo de caixa futuro automaticamente.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🛡️</div>
                        <h3>Guardião de Metas</h3>
                        <p style={{ color: '#aaa' }}>Ele analisa seus hábitos e avisa gentilmente quando você está prestes a sair da linha.</p>
                    </div>
                </div>
            </section>

            <section id="pricing" className="pricing-section">
                <div className="section-header">
                    <h2>Acesso Total.</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Comece a controlar sua vida financeira hoje.</p>
                </div>

                <div className="pricing-card">
                    <div style={{
                        position: 'absolute',
                        top: '-15px',
                        right: '50%',
                        transform: 'translateX(50%)',
                        background: 'var(--gold-primary)',
                        color: 'black',
                        padding: '5px 15px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                    }}>
                        1 MÊS GRÁTIS
                    </div>

                    <h3 style={{ fontSize: '1.2rem', color: '#fff', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0' }}>Plano Único</h3>
                    <div className="price-tag">
                        19,90 <span className="price-period">/mês</span>
                    </div>

                    <ul className="check-list">
                        <li><span className="check-icon">✓</span> <strong>Organização Financeira Completa</strong></li>
                        <li><span className="check-icon">✓</span> Dashboards Interativos</li>
                        <li><span className="check-icon">✓</span> Gestão de Metas e Orçamentos</li>
                        <li><span className="check-icon">✓</span> Transações via Áudio Ilimitadas</li>
                        <li><span className="check-icon">✓</span> Assistente IA <br></br>(Converse sobre suas finanças)</li>
                        <li><span className="check-icon">✓</span> Gestão de faturas com parcelas Inteligentes</li>
                    </ul>

                    <button
                        onClick={onLoginClick}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: 'var(--gold-primary)',
                            color: 'black',
                            fontWeight: 'bold',
                            borderRadius: '12px',
                            border: 'none',
                            marginTop: '1rem',
                            fontSize: '1rem'
                        }}
                    >
                        Começar Teste Grátis
                    </button>
                    <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>Sem compromisso. Cancele quando quiser.</p>
                </div>
            </section>

            <footer className="landing-footer">
                <h2 style={{ marginBottom: '2rem' }}>Comece a usar o Midas.</h2>
                <button
                    onClick={onLoginClick}
                    style={{
                        padding: '15px 40px',
                        background: 'var(--gold-primary)',
                        color: 'black',
                        fontWeight: 'bold',
                        borderRadius: '30px',
                        textDecoration: 'none',
                        border: 'none',
                        fontSize: '1rem'
                    }}
                >
                    Comece já
                </button>

                <div className="techne-badge">
                    Desenvolvido pela Téchne Solutions
                </div>
            </footer>
        </div>
    );
};
