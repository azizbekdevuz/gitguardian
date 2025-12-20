'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, CheckCircle, Zap, Clock } from 'lucide-react'
import { analyzeRepository } from './lib/api'

export default function HomePage() {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.name.endsWith('.json')) {
      setSelectedFile(file)
    } else {
      alert('Please select a .json file')
      setSelectedFile(null)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    
    const file = event.dataTransfer.files?.[0]
    if (file && file.name.endsWith('.json')) {
      setSelectedFile(file)
    } else {
      alert('Please select a .json file')
      setSelectedFile(null)
    }
  }

  const handleBrowseClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    document.getElementById('fileInput')?.click()
  }

  const handleAnalyze = async () => {
    if (!selectedFile) {
      alert('Please select a snapshot file first')
      return
    }

    setIsAnalyzing(true)

    try {
      // Send file to Spring Boot backend
      const result = await analyzeRepository(selectedFile)
      
      // Store result so results page can access it
      sessionStorage.setItem('analysisResult', JSON.stringify(result))
      
      // Navigate to results page
      router.push('/results')
      
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to analyze repository. Please make sure your Spring Boot backend is running on port 8080.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="pt-20 pb-16 text-center px-6">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Safe Git Recovery, Step-by-Step
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
          Prevent destructive git commands with AI-powered analysis. Upload your
          repository snapshot and get a safe, verified recovery plan.
        </p>
      </header>

      {/* Main Upload Section */}
      <main className="max-w-6xl mx-auto px-6 pb-15">
        <div className="bg-zinc-900 rounded-3xl p-8 md:p-12 mb-16">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-2xl p-16 md:p-24 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-gray-500 bg-zinc-800'
                : 'border-gray-700 bg-transparent hover:border-gray-600'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <input
              id="fileInput"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {/* Upload Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-zinc-800 rounded-full flex items-center justify-center">
              <Upload className="w-10 h-10 text-gray-400" />
            </div>
            
            <h3 className="text-xl md:text-2xl font-semibold mb-3">
              Drop your snapshot.json here
            </h3>
            <p className="text-gray-500 mb-6">or click to browse files</p>
            
            {selectedFile && (
              <p className="text-green-400 mb-6">Selected: {selectedFile.name}</p>
            )}
            
            <button
              onClick={handleBrowseClick}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-8 py-3 rounded-lg transition-colors"
            >
              Browse Files
            </button>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !selectedFile}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-semibold py-5 rounded-xl transition-colors text-lg mt-8"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Repository'}
          </button>

          {/* Privacy Notice */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Your snapshot data is analyzed locally. We never store your git data on our servers.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Safe Commands */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-zinc-900 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Safe Commands</h3>
            <p className="text-gray-400 leading-relaxed">
              Every step is verified before execution
            </p>
          </div>

          {/* AI-Powered */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-zinc-900 rounded-2xl flex items-center justify-center">
              <Zap className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3">AI-Powered</h3>
            <p className="text-gray-400 leading-relaxed">
              Intelligent analysis of your repo state
            </p>
          </div>

          {/* Step-by-Step */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-zinc-900 rounded-2xl flex items-center justify-center">
              <Clock className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Step-by-Step</h3>
            <p className="text-gray-400 leading-relaxed">
              Clear guidance through the recovery
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
