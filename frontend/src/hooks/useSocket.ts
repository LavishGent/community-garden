import { useEffect, useRef, useState } from "react"

export interface Plot {
   id: string
   crop: string
   growth: number
   hydration: number
   weeds: number
   occupied: boolean
   health: number
   version: number
}

export interface Garden {
   plots: Record<string, Plot>
   score: number
}

const RECONNECT_BASE_MS = 1000
const RECONNECT_MAX_MS = 30000

export function useSocket(url: string) {
   const [garden, setGarden] = useState<Garden | null>(null)
   const [connected, setConnected] = useState(false)
   const [errorMsg, setErrorMsg] = useState<string | null>(null)
   const wsRef = useRef<WebSocket | null>(null)
   const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
   const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
   const attemptRef = useRef(0)
   const unmountedRef = useRef(false)

   const showError = (msg: string) => {
      setErrorMsg(msg)
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
      errorTimerRef.current = setTimeout(() => setErrorMsg(null), 3000)
   }

   useEffect(() => {
      unmountedRef.current = false

      const connect = () => {
         if (unmountedRef.current) return

         const ws = new WebSocket(url)
         wsRef.current = ws

         ws.onopen = () => {
            attemptRef.current = 0
            setConnected(true)
         }

         ws.onclose = () => {
            setConnected(false)
            setGarden(null)
            if (unmountedRef.current) return
            const delay = Math.min(RECONNECT_BASE_MS * 2 ** attemptRef.current, RECONNECT_MAX_MS)
            attemptRef.current++
            reconnectTimerRef.current = setTimeout(connect, delay)
         }

         ws.onmessage = (event) => {
            const msg = JSON.parse(event.data)
            if (msg.type === 'STATE') {
               setGarden(msg.garden)
            } else if (msg.type === 'ERROR') {
               showError(msg.message)
            }
         }
      }

      connect()

      return () => {
         unmountedRef.current = true
         if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
         wsRef.current?.close()
      }
   }, [url])

   const send = (message: object) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
         wsRef.current.send(JSON.stringify(message))
      }
   }

   return { garden, connected, errorMsg, send }
}