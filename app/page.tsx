'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { Clock, RefreshCw, Eye, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up {
          opacity: 0;
          animation: fadeUp 0.45s ease forwards;
        }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.13s; }
        .fade-up-3 { animation-delay: 0.21s; }
        .fade-up-4 { animation-delay: 0.29s; }
        .fade-up-5 { animation-delay: 0.37s; }
        .fade-up-6 { animation-delay: 0.10s; }
        .fade-up-7 { animation-delay: 0.20s; }
        .fade-up-8 { animation-delay: 0.30s; }
        .fade-up-9 { animation-delay: 0.40s; }
      `}</style>

      <div className="min-h-full lg:min-h-screen bg-background text-foreground flex flex-col">
        <Navbar showLaunchButton={true} />

        {/* Hero — Full height only on Laptop (lg+) */}
        <section className="lg:min-h-[calc(100vh-57px)] flex items-center justify-center w-full px-6 sm:px-10 lg:px-20 py-12 lg:py-0 text-center">
          <div className="w-full max-w-4xl space-y-8 lg:space-y-10">
            <div className="space-y-4 lg:space-y-6 fade-up fade-up-1">
              <h1 className="text-4xl sm:text-5xl lg:text-[4.5rem] font-bold leading-[1.05] tracking-tight dark:text-white text-black text-balance">
                Inspect, Debug, Validate,{' '}
                <span className="text-muted-foreground font-medium">and Test APIs</span>
              </h1>
              <p className="text-base lg:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto text-balance">
                Professional HTTP inspection with developer-controlled API testing. Write assertions,
                validate responses, and organize test workflows with an elite interface.
              </p>
            </div>
            <div className="flex gap-3 justify-center flex-wrap fade-up fade-up-2">
              <Link href="/inspector">
                <Button
                  size="lg"
                  className="cursor-pointer h-11 lg:h-12 px-8 lg:px-10 text-sm lg:text-base font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98] shadow-sm"
                >
                  Launch Inspector
                </Button>
              </Link>
              <Link href="/docs" tabIndex={-1}>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 lg:h-12 px-8 lg:px-10 text-sm lg:text-base font-semibold border-border/40 bg-muted/5 cursor-default pointer-events-none select-none opacity-50"
                  tabIndex={-1}
                >
                  Documentation
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid — More detailed padding on Laptop */}
        <section id="features" className="w-full px-6 sm:px-10 lg:px-24 py-16 lg:py-24 border-t border-border/30 bg-muted/5">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12 lg:mb-16 fade-up fade-up-1 text-center lg:text-left">
              <h2 className="text-2xl lg:text-4xl font-bold mb-3 dark:text-white text-black tracking-tight">
                Core Features
              </h2>
              <p className="text-sm lg:text-lg text-muted-foreground">
                Professional HTTP inspection and intelligent test case generation.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border border-border/30 rounded-xl overflow-hidden shadow-sm bg-background">
              {features.map((feature, i) => (
                <div
                  key={feature.title}
                  className={[
                    'fade-up',
                    `fade-up-${i + 6}`,
                    'group p-6 lg:p-10 flex items-start gap-5',
                    'border-border/30 transition-colors duration-200',
                    'hover:bg-muted/30 cursor-default',
                    i % 2 === 0 ? 'sm:border-r' : '',
                    i < 2 ? 'border-b' : '',
                  ].join(' ')}
                >
                  <div className="mt-1 shrink-0 w-9 h-9 lg:w-11 lg:h-11 flex items-center justify-center rounded-lg bg-primary/10 border border-primary/20 transition-colors duration-200 group-hover:border-primary/40">
                    <feature.icon className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                  </div>
                  <div className="space-y-1 lg:space-y-2 min-w-0">
                    <h3 className="font-bold text-base lg:text-xl dark:text-white text-black leading-snug">
                      {feature.title}
                    </h3>
                    <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section className="w-full px-6 sm:px-10 lg:px-24 py-16 lg:py-24 border-t border-border/30">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12 fade-up fade-up-1">
              <h2 className="text-2xl lg:text-4xl font-bold mb-3 dark:text-white text-black tracking-tight text-center lg:text-left">
                Testing Workflow
              </h2>
              <p className="text-sm lg:text-lg text-muted-foreground text-center lg:text-left">
                Inspect, validate, and test your APIs with developer-controlled assertions.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-border/30 rounded-xl overflow-hidden bg-muted/5">
              {workflow.map((step, index) => (
                <div
                  key={step.title}
                  className={[
                    'fade-up',
                    `fade-up-${index + 6}`,
                    'p-6 lg:p-10',
                    index < workflow.length - 1 ? 'border-b sm:border-b-0 sm:border-r border-border/30' : '',
                  ].join(' ')}
                >
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center mb-5 lg:mb-6">
                    <span className="text-sm lg:text-base font-bold text-primary tabular-nums">{index + 1}</span>
                  </div>
                  <h3 className="font-bold text-base lg:text-xl mb-2 lg:mb-3 dark:text-white text-black">{step.title}</h3>
                  <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full px-6 sm:px-10 lg:px-24 py-10 border-t border-border/30 mt-auto">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs lg:text-sm text-muted-foreground/60 font-medium">
              Lightweight API debugging and testing utility.
            </p>
            <a
              href="https://github.com/VishalGhuge111/TestForge"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs lg:text-sm font-semibold text-muted-foreground/60 hover:text-primary transition-colors duration-150"
            >
              GitHub ↗
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}

const features = [
  { icon: Zap, title: 'Server-side Proxy', description: 'CORS-free requests with server-side safety and reliability.' },
  { icon: RefreshCw, title: 'Request Replay', description: 'Save and replay requests from history with a single click.' },
  { icon: Clock, title: 'Response Timing', description: 'Detailed metrics including DNS, TCP, and First Byte timing.' },
  { icon: Eye, title: 'Response Inspector', description: 'Powerful syntax-highlighted JSON viewer with deep search.' },
];

const workflow = [
  { title: 'Configure', description: 'Set your URL, method, headers, and auth. All-in-one intuitive interface.' },
  { title: 'Inspect', description: 'See response headers, body, timing, and size in professional detail.' },
  { title: 'Debug', description: 'Understand failures faster with smart error categorization and suggestions.' },
];

const inspectorItems = [
  'Server-side proxy for CORS-free requests',
  'Request replay and history (up to 30 requests)',
  'Response metadata and detailed timing',
  'Error categorization and suggestions',
];

const testingItems = [
  'Developer-controlled test assertions',
  'Status, headers, response time, body validation',
  'Save test cases and organize collections',
  'Environment variables and test workflows',
];