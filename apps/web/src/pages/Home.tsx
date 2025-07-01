import React from 'react'
import { ChevronRight, CheckCircle, Github, Zap, Clock, Bot } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Morning Story</span>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Never scramble for
            <span className="text-blue-600"> standup updates</span> again
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Auto-generate intelligent daily standups from your GitHub activity. 
            One click, perfect updates, every time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              to="/login"
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg"
            >
              Start Free Trial
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
            <p className="text-sm text-gray-500">No credit card • 5-second setup</p>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Save 15 minutes daily</h3>
            <p className="text-gray-600">Stop digging through commits and PRs. We do it for you.</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-powered insights</h3>
            <p className="text-gray-600">Smart summaries that highlight what matters to your team.</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Github className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">GitHub integration</h3>
            <p className="text-gray-600">Connects instantly with your existing workflow.</p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">1</div>
              <h3 className="text-lg font-semibold mb-2">Connect GitHub</h3>
              <p className="text-gray-600">One-click OAuth connection to your repositories</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">2</div>
              <h3 className="text-lg font-semibold mb-2">AI analyzes activity</h3>
              <p className="text-gray-600">Smart parsing of commits, PRs, and issues</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">3</div>
              <h3 className="text-lg font-semibold mb-2">Perfect standup ready</h3>
              <p className="text-gray-600">Copy-paste formatted updates for your team</p>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">Trusted by developers at</p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <span className="text-2xl font-bold text-gray-400">GitHub</span>
            <span className="text-2xl font-bold text-gray-400">Vercel</span>
            <span className="text-2xl font-bold text-gray-400">Stripe</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 Morning Story. Open source standup automation.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}