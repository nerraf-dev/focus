"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { authenticatedFetch } from '@/lib/api'
import type { Session } from '@/lib/types'

interface DatabaseTask {
  id: number;
  title: string;
  completed: boolean;
  description?: string;
}

interface TimerContextType {
  // Timer state
  mode: 'work' | 'break'
  secondsLeft: number
  isActive: boolean
  
  // Settings
  workDuration: number
  breakDuration: number
  
  // Task and session
  activeTask: DatabaseTask | null
  currentSession: Session | null
  
  // Actions
  startTimer: () => void
  stopTimer: () => void
  resetTimer: () => void
  skipToNext: () => void
  setActiveTask: (task: DatabaseTask | null) => void
  setWorkDuration: (duration: number) => void
  setBreakDuration: (duration: number) => void
}

const TimerContext = createContext<TimerContextType | undefined>(undefined)

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  
  // Timer state
  const [mode, setMode] = useState<'work' | 'break'>('work')
  const [isActive, setIsActive] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60) // Default 25 minutes
  
  // Settings (persisted in localStorage)
  const [workDuration, setWorkDurationState] = useState(25)
  const [breakDuration, setBreakDurationState] = useState(5)
  
  // Task and session state
  const [activeTask, setActiveTask] = useState<DatabaseTask | null>(null)
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  
  // Refs for cleanup
  const reminderTimeout = useRef<NodeJS.Timeout | null>(null)
  const isMounted = useRef(false)

  // Load persisted data on mount
  useEffect(() => {
    isMounted.current = true
    
    try {
      // Load settings
      const storedWorkDuration = localStorage.getItem('focusflow-timer-work-duration')
      const storedBreakDuration = localStorage.getItem('focusflow-timer-break-duration')
      const storedMode = localStorage.getItem('focusflow-timer-mode')
      const storedActiveTask = localStorage.getItem('focusflow-timer-active-task')
      const storedIsActive = localStorage.getItem('focusflow-timer-is-active')
      const storedSecondsLeft = localStorage.getItem('focusflow-timer-seconds-left')
      const storedLastUpdate = localStorage.getItem('focusflow-timer-last-update')
      
      if (storedWorkDuration) setWorkDurationState(JSON.parse(storedWorkDuration))
      if (storedBreakDuration) setBreakDurationState(JSON.parse(storedBreakDuration))
      
      if (storedMode) setMode(storedMode as 'work' | 'break')
      if (storedActiveTask) setActiveTask(JSON.parse(storedActiveTask))
      
      // Restore timer state if it was running
      if (storedIsActive === 'true' && storedSecondsLeft && storedLastUpdate) {
        const wasActive = true
        const savedSecondsLeft = JSON.parse(storedSecondsLeft)
        const lastUpdate = JSON.parse(storedLastUpdate)
        
        // Calculate elapsed time since last update
        const now = Date.now()
        const elapsedSeconds = Math.floor((now - lastUpdate) / 1000)
        const newSecondsLeft = Math.max(0, savedSecondsLeft - elapsedSeconds)
        
        setSecondsLeft(newSecondsLeft)
        
        if (newSecondsLeft > 0) {
          setIsActive(true)
          toast({
            title: 'Timer restored',
            description: `Continuing your ${storedMode} session`
          })
        } else {
          // Timer expired while away
          setIsActive(false)
          toast({
            title: 'Timer completed',
            description: `Your ${storedMode} session finished while you were away`
          })
        }
      } else {
        // Set default time based on mode
        const currentMode = (storedMode as 'work' | 'break') || 'work'
        const duration = currentMode === 'work' 
          ? (storedWorkDuration ? JSON.parse(storedWorkDuration) : 25)
          : (storedBreakDuration ? JSON.parse(storedBreakDuration) : 5)
        setSecondsLeft(duration * 60)
      }
    } catch (error) {
      console.error('Failed to load timer state from localStorage:', error)
      // Reset to defaults on error
      setSecondsLeft(25 * 60)
      setMode('work')
      setIsActive(false)
    }
    
    return () => {
      isMounted.current = false
    }
  }, [toast])

  // Persist state changes
  useEffect(() => {
    if (!isMounted.current) return
    
    localStorage.setItem('focusflow-timer-mode', mode)
    localStorage.setItem('focusflow-timer-is-active', isActive.toString())
    localStorage.setItem('focusflow-timer-seconds-left', JSON.stringify(secondsLeft))
    localStorage.setItem('focusflow-timer-last-update', JSON.stringify(Date.now()))
    
    if (activeTask) {
      localStorage.setItem('focusflow-timer-active-task', JSON.stringify(activeTask))
    } else {
      localStorage.removeItem('focusflow-timer-active-task')
    }
  }, [mode, isActive, secondsLeft, activeTask])

  // Main timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isActive && isMounted.current) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Timer completed
            setIsActive(false)
            
            if (mode === 'work') {
              // End work session
              if (currentSession) {
                endSession()
              }
              
              // Switch to break
              setMode('break')
              const newSecondsLeft = breakDuration * 60
              setSecondsLeft(newSecondsLeft)
              
              toast({
                title: 'Time for a break!',
                description: 'Great work session. Relax for a bit.'
              })
              
              showBrowserNotification(
                'Time for a break!',
                'Great work session. Relax for a bit.'
              )
              
              // Set reminder for break end
              if (reminderTimeout.current) clearTimeout(reminderTimeout.current)
              reminderTimeout.current = setTimeout(() => {
                toast({
                  title: 'Reminder',
                  description: "Break is over. Ready to get back to work?"
                })
                showBrowserNotification(
                  'Break is over!',
                  'Ready to get back to work?'
                )
              }, breakDuration * 60 * 1000 + 10000) // 10s after break ends
              
              return newSecondsLeft
            } else {
              // End break
              setMode('work')
              const newSecondsLeft = workDuration * 60
              setSecondsLeft(newSecondsLeft)
              
              toast({
                title: 'Back to work!',
                description: "Break's over. Let's get focused."
              })
              
              showBrowserNotification(
                'Back to work!',
                "Break's over. Let's get focused."
              )
              
              return newSecondsLeft
            }
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, mode, workDuration, breakDuration, currentSession])

  // Helper: show browser notification
  const showBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && document.visibilityState !== 'visible') {
      if (Notification.permission === 'granted') {
        new Notification(title, { body })
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification(title, { body })
          }
        })
      }
    }
  }

  // Start a new session when starting work timer
  const startSession = async (taskId: number) => {
    try {
      const response = await authenticatedFetch('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({ taskId })
      })
      if (response.ok) {
        const session = await response.json()
        setCurrentSession(session)
        return session
      } else {
        toast({ title: 'Failed to start session', variant: 'destructive' })
        return null
      }
    } catch (error) {
      console.error('Failed to start session:', error)
      toast({ title: 'Failed to start session', variant: 'destructive' })
      return null
    }
  }

  // End current session
  const endSession = async () => {
    if (!currentSession) return
    
    try {
      const totalSeconds = workDuration * 60
      const sessionDuration = totalSeconds - secondsLeft
      
      await authenticatedFetch(`/api/sessions/${currentSession.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          endedAt: new Date().toISOString(),
          duration: sessionDuration,
        }),
      })
      
      setCurrentSession(null)
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  }

  // Timer actions
  const startTimer = useCallback(async () => {
    if (mode === 'work' && !activeTask) {
      toast({
        title: 'No active task',
        description: 'Please select a task to start the timer.',
        variant: 'destructive'
      })
      return
    }
    
    if (mode === 'work' && activeTask && !currentSession) {
      const session = await startSession(activeTask.id)
      if (!session) return // Failed to start session
    }
    
    setIsActive(true)
  }, [mode, activeTask, currentSession, toast])

  const stopTimer = useCallback(async () => {
    setIsActive(false)
    
    if (mode === 'work' && currentSession) {
      await endSession()
    }
  }, [mode, currentSession])

  const resetTimer = useCallback(async () => {
    setIsActive(false)
    
    if (mode === 'work' && currentSession) {
      await endSession()
    }
    
    const duration = mode === 'work' ? workDuration : breakDuration
    setSecondsLeft(duration * 60)
    
    // Clear reminder timeout
    if (reminderTimeout.current) {
      clearTimeout(reminderTimeout.current)
      reminderTimeout.current = null
    }
  }, [mode, workDuration, breakDuration, currentSession])

  const skipToNext = useCallback(async () => {
    if (currentSession && mode === 'work') {
      await endSession()
    }
    
    const newMode = mode === 'work' ? 'break' : 'work'
    setMode(newMode)
    setIsActive(false)
    
    const duration = newMode === 'work' ? workDuration : breakDuration
    setSecondsLeft(duration * 60)
  }, [mode, workDuration, breakDuration, currentSession])

  const setWorkDuration = useCallback((duration: number) => {
    setWorkDurationState(duration)
    localStorage.setItem('focusflow-timer-work-duration', JSON.stringify(duration))
    
    // Update current timer if in work mode and not active
    if (mode === 'work' && !isActive) {
      setSecondsLeft(duration * 60)
    }
  }, [mode, isActive])

  const setBreakDuration = useCallback((duration: number) => {
    setBreakDurationState(duration)
    localStorage.setItem('focusflow-timer-break-duration', JSON.stringify(duration))
    
    // Update current timer if in break mode and not active
    if (mode === 'break' && !isActive) {
      setSecondsLeft(duration * 60)
    }
  }, [mode, isActive])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reminderTimeout.current) {
        clearTimeout(reminderTimeout.current)
      }
    }
  }, [])

  const value: TimerContextType = {
    mode,
    secondsLeft,
    isActive,
    workDuration,
    breakDuration,
    activeTask,
    currentSession,
    startTimer,
    stopTimer,
    resetTimer,
    skipToNext,
    setActiveTask,
    setWorkDuration,
    setBreakDuration,
  }

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  )
}

export const useTimer = () => {
  const context = useContext(TimerContext)
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider')
  }
  return context
}
