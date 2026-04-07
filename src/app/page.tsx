import Link from 'next/link';

const features = [
  {
    title: 'AI Chat Assistant',
    description: 'Describe what you want and our AI will build it for you. Edit, redesign, and create with natural language commands.',
    icon: '✦',
  },
  {
    title: 'Visual Editor',
    description: 'Drag-and-drop components, resize elements, and style everything visually with the powerful GrapesJS editor.',
    icon: '◈',
  },
  {
    title: 'One-Click Deploy',
    description: 'Deploy your website to Vercel instantly. Get a live URL in seconds with automatic SSL and CDN.',
    icon: '⟶',
  },
  {
    title: 'Version History',
    description: 'Every change is saved. Browse your history, compare versions, and restore any previous state with one click.',
    icon: '◎',
  },
  {
    title: 'Multi-Page Support',
    description: 'Build complete multi-page websites. Manage all pages from one place with shared styles and components.',
    icon: '▣',
  },
  {
    title: 'Custom Code',
    description: 'Drop into HTML, CSS, and JavaScript at any point. Full code editor with syntax highlighting built in.',
    icon: '{ }',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[hsl(0,0%,8%)] text-[hsl(0,0%,95%)]">
      {/* Navigation */}
      <nav className="border-b border-[hsl(0,0%,18%)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[hsl(221,83%,53%)] rounded-lg flex items-center justify-center text-white font-bold text-sm">
              W
            </div>
            <span className="font-semibold text-lg">WebBuilder</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-[hsl(0,0%,55%)] hover:text-[hsl(0,0%,95%)] transition-colors text-sm"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="bg-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,45%)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-24 pb-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[hsl(0,0%,11%)] border border-[hsl(0,0%,18%)] rounded-full px-4 py-1.5 text-sm text-[hsl(0,0%,55%)] mb-8">
            <span className="w-2 h-2 bg-[hsl(221,83%,53%)] rounded-full"></span>
            Now with AI-powered design assistance
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Build Stunning Websites{' '}
            <span className="text-[hsl(221,83%,53%)]">with AI</span>
          </h1>
          <p className="text-xl text-[hsl(0,0%,55%)] mb-10 max-w-2xl mx-auto leading-relaxed">
            The most powerful website builder for professionals. Visual editing, AI assistance,
            instant deployment — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="bg-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,45%)] text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/dashboard"
              className="border border-[hsl(0,0%,18%)] hover:border-[hsl(0,0%,30%)] text-[hsl(0,0%,95%)] px-8 py-4 rounded-lg text-lg font-medium transition-colors"
            >
              View Demo
            </Link>
          </div>
          <p className="text-sm text-[hsl(0,0%,40%)] mt-6">No credit card required. Free forever plan available.</p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 border-t border-[hsl(0,0%,18%)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to build the web
            </h2>
            <p className="text-[hsl(0,0%,55%)] text-lg max-w-xl mx-auto">
              Professional tools that were previously only available to expert developers.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-[hsl(0,0%,11%)] border border-[hsl(0,0%,18%)] rounded-xl p-6 hover:border-[hsl(0,0%,25%)] transition-colors"
              >
                <div className="text-2xl mb-4 text-[hsl(221,83%,53%)] font-mono">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-[hsl(0,0%,55%)] text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 border-t border-[hsl(0,0%,18%)]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to start building?
          </h2>
          <p className="text-[hsl(0,0%,55%)] text-lg mb-8">
            Join thousands of creators building beautiful websites with WebBuilder.
          </p>
          <Link
            href="/sign-up"
            className="inline-block bg-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,45%)] text-white px-10 py-4 rounded-lg text-lg font-medium transition-colors"
          >
            Start Building for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(0,0%,18%)] px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[hsl(221,83%,53%)] rounded flex items-center justify-center text-white font-bold text-xs">
              W
            </div>
            <span className="font-semibold">WebBuilder</span>
          </div>
          <p className="text-[hsl(0,0%,40%)] text-sm">
            &copy; {new Date().getFullYear()} WebBuilder. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-[hsl(0,0%,40%)]">
            <Link href="#" className="hover:text-[hsl(0,0%,95%)] transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-[hsl(0,0%,95%)] transition-colors">Terms</Link>
            <Link href="#" className="hover:text-[hsl(0,0%,95%)] transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
