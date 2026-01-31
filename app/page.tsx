'use client'

import { useEffect, useRef, useState } from 'react'
import './terminal.css'

const API_URL = '' // Use relative URLs to call Next.js API routes

export default function Terminal() {
  const [input, setInput] = useState('')
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListeningForWakeWord, setIsListeningForWakeWord] = useState(false)
  const [currentPersonality, setCurrentPersonality] = useState('auto')
  const [healthScore, setHealthScore] = useState('-')
  const [status, setStatus] = useState({
    k8s: '-',
    pods: '-',
    cpu: '-',
    tailscale: '-',
    proxmox: '-'
  })
  
  const terminalBodyRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const personalityIndex = useRef(0)
  const personalities = ['auto', 'professional', 'helpful', 'funny']
  
  // Wake words
  const wakeWords = ['hey stewie', 'stewie', 'hey stewart', 'stewart']
  const sleepWords = ['quit', 'exit', 'sleep', 'stop listening']

  useEffect(() => {
    loadStatus()
    const interval = setInterval(loadStatus, 60000)
    
    // Initialize speech recognition
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim().toLowerCase()
        console.log('Heard:', transcript)
        
        // Check for wake word when in sleep mode
        if (isListeningForWakeWord) {
          const heardWakeWord = wakeWords.some(word => transcript.includes(word))
          if (heardWakeWord) {
            addLine('👂 Wake word detected!', 'system')
            addLine('', 'normal')
            startVoiceMode()
            return
          }
          // Keep listening for wake word
          setTimeout(() => {
            try { recognitionRef.current?.start() } catch(e) {}
          }, 300)
          return
        }
        
        // Check for sleep words when in active mode
        const heardSleepWord = sleepWords.some(word => transcript.includes(word))
        if (heardSleepWord) {
          stopVoiceMode()
          addLine('💤 Going to sleep. Say "Hey Stewie" to wake me.', 'system')
          addLine('', 'normal')
          startWakeWordListening()
          return
        }
        
        addLine(transcript, 'prompt')
        askQuestion(transcript)
      }

      recognitionRef.current.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.error('Voice error:', event.error)
        }
        if ((isVoiceMode || isListeningForWakeWord) && !isSpeaking) {
          setTimeout(() => {
            try { recognitionRef.current?.start() } catch(e) {}
          }, 500)
        }
      }

      recognitionRef.current.onend = () => {
        if ((isVoiceMode || isListeningForWakeWord) && !isSpeaking) {
          setTimeout(() => {
            try { recognitionRef.current?.start() } catch(e) {}
          }, 300)
        }
      }
    }
    
    // Auto-start wake word listening on page load
    if (recognitionRef.current) {
      addLine('👂 Listening for "Hey Stewie" to wake...', 'system')
      addLine('', 'normal')
      setIsListeningForWakeWord(true)
      setTimeout(() => {
        try { recognitionRef.current?.start() } catch(e) {}
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isVoiceMode, isSpeaking, isListeningForWakeWord])

  const addLine = (text: string, type: string = 'normal') => {
    if (!terminalBodyRef.current) return
    
    const line = document.createElement('div')
    line.className = 'terminal-line'
    
    if (type === 'prompt') {
      line.innerHTML = `<span class="prompt">you@stewie ~$</span> <span class="user-input">${text}</span>`
    } else if (type === 'response') {
      line.innerHTML = `<span class="ai-response">${text}</span>`
    } else if (type === 'system') {
      line.innerHTML = `<span class="system-msg">${text}</span>`
    } else if (type === 'error') {
      line.innerHTML = `<span class="error-msg">${text}</span>`
    } else {
      line.textContent = text
    }
    
    terminalBodyRef.current.appendChild(line)
    terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight
  }

  const loadStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/status`)
      const data = await response.json()
      
      setStatus({
        k8s: data.cluster.node_count || '0',
        pods: data.cluster.pods?.running || '0',
        cpu: data.cluster.cpu_usage ? data.cluster.cpu_usage + '%' : '-',
        tailscale: data.cluster.tailscale ? `${data.cluster.tailscale.online}/${data.cluster.tailscale.total}` : '-',
        proxmox: data.cluster.proxmox?.vms ? `${data.cluster.proxmox.vms.running} VMs` : '-'
      })
    } catch (error) {
      console.error('Failed to load status:', error)
    }
    
    try {
      const response = await fetch(`${API_URL}/api/personality`)
      const data = await response.json()
      setCurrentPersonality(data.current)
    } catch (error) {
      console.error('Failed to load personality:', error)
    }
    
    try {
      const response = await fetch(`${API_URL}/api/health-report`)
      const data = await response.json()
      setHealthScore(`${data.health_score}/100 ${data.emoji}`)
    } catch (error) {
      console.error('Failed to load health score:', error)
    }
  }

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      
      document.querySelectorAll('audio').forEach(audio => {
        audio.pause()
        audio.currentTime = 0
      })
      
      if (isVoiceMode) {
        setTimeout(() => {
          try { recognitionRef.current?.start() } catch(e) {}
        }, 300)
      }
    }
  }

  const useBrowserTTS = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    
    const femaleVoice = voices.find(voice => 
      voice.name.includes('Samantha') ||
      voice.name.includes('Ava') ||
      voice.name.includes('Victoria') ||
      voice.name.includes('Female')
    )
    
    if (femaleVoice) utterance.voice = femaleVoice
    
    utterance.rate = 1.05
    utterance.pitch = 0.95
    utterance.volume = 0.95
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => {
      setIsSpeaking(false)
      if (isVoiceMode) {
        setTimeout(() => {
          try { recognitionRef.current?.start() } catch(e) {}
        }, 1000)
      }
    }
    utterance.onerror = () => {
      setIsSpeaking(false)
      if (isVoiceMode) {
        setTimeout(() => {
          try { recognitionRef.current?.start() } catch(e) {}
        }, 1000)
      }
    }
    
    window.speechSynthesis.speak(utterance)
  }

  const askQuestion = async (question: string) => {
    if (!question) return

    stopSpeaking()
    
    if (isVoiceMode) {
      try { recognitionRef.current?.stop() } catch(e) {}
    }

    addLine('⏳ Thinking...', 'system')

    try {
      const response = await fetch(`${API_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })

      const data = await response.json()
      
      const lines = terminalBodyRef.current?.querySelectorAll('.terminal-line')
      const lastLine = lines?.[lines.length - 1]
      if (lastLine?.textContent?.includes('Thinking')) {
        lastLine.remove()
      }
      
      if (response.ok) {
        addLine(data.answer, 'response')
        
        if (data.personality) {
          setCurrentPersonality(data.personality)
        }
        
        addLine('', 'normal')
        
        // Start speaking immediately
        setIsSpeaking(true)
        const answerText = data.answer
        
        fetch(`${API_URL}/api/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: answerText })
        })
        .then(res => res.json())
        .then(ttsData => {
          if (ttsData.provider === 'elevenlabs' && ttsData.audio) {
            const audio = new Audio('data:audio/mp3;base64,' + ttsData.audio)
            
            audio.onended = () => {
              setIsSpeaking(false)
              if (isVoiceMode) {
                setTimeout(() => {
                  try { recognitionRef.current?.start() } catch(e) {}
                }, 1000)
              }
            }
            
            audio.onerror = () => {
              console.log('ElevenLabs audio error, falling back to browser')
              useBrowserTTS(answerText)
            }
            
            audio.play()
          } else {
            useBrowserTTS(answerText)
          }
        })
        .catch(error => {
          console.log('TTS API error, using browser TTS:', error)
          useBrowserTTS(answerText)
        })
        
        loadStatus()
      } else {
        addLine(`❌ Error: ${data.error}`, 'error')
        addLine('', 'normal')
        setIsSpeaking(false)
        if (isVoiceMode) {
          setTimeout(() => {
            try { recognitionRef.current?.start() } catch(e) {}
          }, 1000)
        }
      }
    } catch (error) {
      addLine('❌ Could not connect to server', 'error')
      addLine('', 'normal')
      setIsSpeaking(false)
      if (isVoiceMode) {
        setTimeout(() => {
          try { recognitionRef.current?.start() } catch(e) {}
        }, 1000)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      addLine(input, 'prompt')
      askQuestion(input)
      setInput('')
    }
  }

  const toggleVoiceMode = () => {
    if (!recognitionRef.current) {
      addLine('Voice recognition not supported in this browser', 'error')
      return
    }

    if (isVoiceMode) {
      stopVoiceMode()
    } else {
      startVoiceMode()
    }
  }

  const startVoiceMode = () => {
    setIsVoiceMode(true)
    setIsListeningForWakeWord(false)
    addLine('🎤 Voice mode activated - listening continuously...', 'system')
    addLine('Say "quit" or "exit" to sleep', 'system')
    addLine('', 'normal')
    try {
      recognitionRef.current?.start()
    } catch(e) {
      console.error('Failed to start recognition:', e)
    }
  }

  const stopVoiceMode = () => {
    setIsVoiceMode(false)
    setIsListeningForWakeWord(false)
    try {
      recognitionRef.current?.stop()
    } catch (e) {}
  }

  const startWakeWordListening = () => {
    setIsListeningForWakeWord(true)
    setIsVoiceMode(false)
    try {
      recognitionRef.current?.start()
    } catch(e) {
      console.error('Failed to start wake word listening:', e)
    }
  }

  const cyclePersonality = async () => {
    personalityIndex.current = (personalityIndex.current + 1) % personalities.length
    const newMode = personalities[personalityIndex.current]
    
    try {
      const response = await fetch(`${API_URL}/api/personality`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode })
      })
      
      const data = await response.json()
      if (data.success) {
        setCurrentPersonality(newMode)
        addLine(`🎭 Personality: ${newMode} - ${data.description}`, 'system')
        addLine('', 'normal')
      }
    } catch (error) {
      console.error('Failed to change personality:', error)
    }
  }

  const analyzeCluster = async () => {
    addLine('🧠 Analyzing cluster health...', 'system')
    
    try {
      const response = await fetch(`${API_URL}/api/health-report`)
      const data = await response.json()
      
      const lines = terminalBodyRef.current?.querySelectorAll('.terminal-line')
      const lastLine = lines?.[lines.length - 1]
      if (lastLine?.textContent?.includes('Analyzing')) {
        lastLine.remove()
      }
      
      addLine(`Cluster Health: ${data.health_score}/100 ${data.emoji} (${data.status})`, 'response')
      addLine('', 'normal')
      
      if (data.warnings?.length > 0) {
        addLine('⚠️ Warnings:', 'response')
        data.warnings.forEach((w: string) => addLine(`  • ${w}`, 'response'))
        addLine('', 'normal')
      }
      
      if (data.insights?.length > 0) {
        addLine('📊 Insights:', 'response')
        data.insights.forEach((i: string) => addLine(`  • ${i}`, 'response'))
        addLine('', 'normal')
      }
      
      if (data.recommendations?.length > 0) {
        addLine('💡 Recommendations:', 'response')
        data.recommendations.forEach((r: string) => addLine(`  • ${r}`, 'response'))
        addLine('', 'normal')
      }
      
      setHealthScore(`${data.health_score}/100 ${data.emoji}`)
    } catch (error) {
      addLine('❌ Failed to get health analysis', 'error')
      addLine('', 'normal')
    }
  }

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="terminal-button btn-close"></div>
        <div className="terminal-button btn-minimize"></div>
        <div className="terminal-button btn-maximize"></div>
        <div className="terminal-title">stewie@terminal — zsh — 80×24</div>
      </div>

      <div className="status-bar">
        <div className="status-item">
          <span><div className="status-dot"></div> K8s: <span>{status.k8s}</span></span>
          <span>Pods: <span>{status.pods}</span></span>
          <span>CPU: <span>{status.cpu}</span></span>
          <span>Health: <span>{healthScore}</span></span>
        </div>
        <div className="status-item">
          <span>Personality: <span>{currentPersonality}</span></span>
          <span>Tailscale: <span>{status.tailscale}</span></span>
          <span>Proxmox: <span>{status.proxmox}</span></span>
        </div>
      </div>

      <div className="terminal-body" ref={terminalBodyRef}>
        <div className="terminal-line system-msg">Stewie AI Terminal v2.0 - Enhanced Intelligence</div>
        <div className="terminal-line system-msg">🧠 I'm actively monitoring your cluster and can speak multiple languages</div>
        <div className="terminal-line system-msg">💡 Commands: "set personality [mode]" | "analyze cluster" | "what do you think?"</div>
        <div className="terminal-line system-msg">🎤 Voice: Say "Hey Stewie" to wake | "quit/exit" to sleep</div>
        <div className="terminal-line">&nbsp;</div>
      </div>

      <form className="terminal-input-container" onSubmit={handleSubmit}>
        <span className="input-prompt">stewie@ai ~</span>
        <span className="input-prompt">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ask me anything in any language..."
          autoFocus
        />
        {isSpeaking && (
          <button type="button" className="stop-btn active" onClick={stopSpeaking}>
            ⏹ Stop
          </button>
        )}
        <button type="button" className="personality-btn" onClick={analyzeCluster}>
          🧠 Analyze
        </button>
        <button type="button" className="personality-btn" onClick={cyclePersonality}>
          🎭 Mode
        </button>
        <button
          type="button"
          className={`voice-btn ${isVoiceMode ? 'active' : ''} ${isListeningForWakeWord ? 'sleeping' : ''}`}
          onClick={toggleVoiceMode}
        >
          {isVoiceMode ? '🔴 Stop' : isListeningForWakeWord ? '💤 Sleeping' : '🎤 Voice'}
        </button>
      </form>
    </div>
  )
}
