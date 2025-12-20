import Link from 'next/link';
import { Header } from '@/components/Header';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-bg-primary to-bg-secondary">
      <Header />

      {/* Hero Section */}
      <section className="px-6 py-20 max-w-6xl mx-auto text-center">
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm">
          Safety-First Git Recovery
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          Never Lose Your Work to
          <span className="block bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
            Git Disasters
          </span>
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-10">
          AI-powered recovery from merge conflicts, detached HEAD states, and stuck rebases.
          Every solution is reversible by design.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/auth/signup"
            className="px-8 py-3 rounded-lg bg-accent-green text-white font-medium hover:bg-accent-green/90 transition-colors shadow-lg shadow-accent-green/20"
          >
            Get Started Free
          </Link>
          <a
            href="#features"
            className="px-8 py-3 rounded-lg border border-border-color text-text-primary hover:bg-bg-tertiary transition-colors"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Terminal Demo */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <div className="rounded-lg overflow-hidden border border-border-color bg-bg-secondary shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-3 bg-bg-tertiary border-b border-border-color">
            <span className="w-3 h-3 rounded-full bg-accent-red"></span>
            <span className="w-3 h-3 rounded-full bg-accent-yellow"></span>
            <span className="w-3 h-3 rounded-full bg-accent-green"></span>
            <span className="ml-4 text-sm text-text-muted">terminal</span>
          </div>
          <pre className="p-6 text-sm overflow-x-auto text-text-secondary">
<code>{`$ git merge feature-branch
CONFLICT (content): Merge conflict in src/app.ts
Automatic merge failed; fix conflicts.

$ gitguard snapshot > snapshot.json
Snapshot captured

# Upload to GitGuard for AI-guided recovery`}</code>
          </pre>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 bg-bg-secondary border-y border-border-color">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Recover from Any Git Crisis</h2>
          <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
            Powered by SpoonOS Agent Framework for intelligent, safe recovery
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Merge Conflicts', desc: 'Visual diff view with AI explanations for each conflict block.', color: 'accent-yellow' },
              { title: 'Detached HEAD', desc: 'Navigate commit history and recover without losing work.', color: 'accent-blue' },
              { title: 'Rebase Recovery', desc: 'Step-by-step guidance to complete or abort stuck rebases.', color: 'accent-purple' },
              { title: 'Always Reversible', desc: 'Every recovery plan includes undo commands.', color: 'accent-green' },
            ].map((feature) => (
              <div key={feature.title} className="p-6 rounded-lg bg-bg-primary border border-border-color hover:border-accent-blue/50 transition-colors group">
                <h3 className={`font-semibold text-${feature.color} mb-2`}>{feature.title}</h3>
                <p className="text-sm text-text-secondary">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-6 py-20 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
        <p className="text-text-secondary text-center mb-12">Three simple steps to recover from any git situation</p>
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {[
            { step: '1', title: 'Capture', desc: 'Run gitguard snapshot in your repo to capture the current state' },
            { step: '2', title: 'Upload', desc: 'Upload the snapshot for AI-powered analysis and diagnosis' },
            { step: '3', title: 'Recover', desc: 'Follow the guided recovery plan with full undo support' },
          ].map((item, i) => (
            <div key={item.step} className="flex-1 text-center relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple text-white flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg">
                {item.step}
              </div>
              <h3 className="font-semibold mb-2 text-lg">{item.title}</h3>
              <p className="text-sm text-text-secondary">{item.desc}</p>
              {i < 2 && (
                <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-accent-blue/50 to-transparent"></div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SpoonOS Section */}
      <section className="px-6 py-16 bg-bg-tertiary/50 border-y border-border-color">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-3 py-1 mb-4 rounded-full bg-accent-purple/20 text-accent-purple text-sm font-medium">
            Powered by SpoonOS
          </div>
          <h2 className="text-2xl font-bold mb-4">Built on Agentic AI Framework</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            GitGuard uses the SpoonOS Agent Framework for transparent, traceable AI decision-making.
            View the complete thinking process of the AI through our SpoonOS Trace visualization.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 text-center bg-gradient-to-r from-accent-blue/10 to-accent-purple/10">
        <h2 className="text-3xl font-bold mb-4">Ready to Never Fear Git Again?</h2>
        <p className="text-text-secondary mb-8 max-w-xl mx-auto">
          Join developers who trust GitGuard for safe, AI-powered git recovery.
        </p>
        <Link
          href="/auth/signup"
          className="inline-block px-8 py-3 rounded-lg bg-accent-green text-white font-medium hover:bg-accent-green/90 transition-colors shadow-lg shadow-accent-green/20"
        >
          Create Free Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm text-text-muted border-t border-border-color">
        <p>GitGuard Agent - Safe Git Recovery powered by SpoonOS</p>
        <p className="mt-2">Scoop AI Hackathon: Seoul Bowl 2024</p>
      </footer>
    </main>
  );
}
