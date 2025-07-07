/**
 * Connection manager for handling WebSocket connections and reconnection logic
 */

import { withRetry, shouldRetryNetworkError } from './errorHandling'

export interface ConnectionManagerOptions {
  url: string
  reconnectDelay: number
  maxReconnectAttempts: number
  heartbeatInterval: number
  connectionTimeout: number
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface ConnectionStatus {
  state: ConnectionState
  lastConnected?: Date
  lastError?: string
  reconnectAttempts: number
}

export class ConnectionManager {
  private options: ConnectionManagerOptions
  private status: ConnectionStatus = {
    state: 'disconnected',
    reconnectAttempts: 0
  }
  private listeners: Set<(status: ConnectionStatus) => void> = new Set()
  private heartbeatTimer?: NodeJS.Timeout | undefined
  private reconnectTimer?: NodeJS.Timeout | undefined
  private isDestroyed = false

  constructor(options: Partial<ConnectionManagerOptions> = {}) {
    this.options = {
      url: 'wss://sync.automerge.org',
      reconnectDelay: 1000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      connectionTimeout: 10000,
      ...options
    }
  }

  public getStatus(): ConnectionStatus {
    return { ...this.status }
  }

  public addListener(listener: (status: ConnectionStatus) => void): void {
    this.listeners.add(listener)
  }

  public removeListener(listener: (status: ConnectionStatus) => void): void {
    this.listeners.delete(listener)
  }

  public async connect(): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('Connection manager has been destroyed')
    }

    this.updateStatus({ state: 'connecting' })

    try {
      await withRetry(
        async () => {
          // Simulate connection attempt
          await this.attemptConnection()
        },
        {
          maxAttempts: this.options.maxReconnectAttempts,
          delay: this.options.reconnectDelay,
          shouldRetry: shouldRetryNetworkError
        }
      )

      this.updateStatus({
        state: 'connected',
        lastConnected: new Date(),
        reconnectAttempts: 0
      })

      this.startHeartbeat()
    } catch (error) {
      this.updateStatus({
        state: 'error',
        lastError: error instanceof Error ? error.message : 'Connection failed'
      })
      this.scheduleReconnect()
    }
  }

  public disconnect(): void {
    this.clearTimers()
    this.updateStatus({ state: 'disconnected' })
  }

  public destroy(): void {
    this.isDestroyed = true
    this.disconnect()
    this.listeners.clear()
  }

  private async attemptConnection(): Promise<void> {
    // This is a simplified connection attempt
    // In a real implementation, this would create and manage the actual WebSocket connection
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'))
      }, this.options.connectionTimeout)

      // Simulate network conditions
      const random = Math.random()
      if (random < 0.1) {
        clearTimeout(timeout)
        reject(new Error('Network error'))
      } else {
        clearTimeout(timeout)
        resolve()
      }
    })
  }

  private updateStatus(updates: Partial<ConnectionStatus>): void {
    this.status = { ...this.status, ...updates }
    this.notifyListeners()
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getStatus())
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error in connection status listener:', error)
      }
    })
  }

  private startHeartbeat(): void {
    this.clearHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      this.checkConnection()
    }, this.options.heartbeatInterval)
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = undefined
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }
  }

  private clearTimers(): void {
    this.clearHeartbeat()
    this.clearReconnectTimer()
  }

  private async checkConnection(): Promise<void> {
    try {
      // Simulate heartbeat check
      await this.attemptConnection()
    } catch (error) {
      this.updateStatus({
        state: 'error',
        lastError: error instanceof Error ? error.message : 'Heartbeat failed'
      })
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    if (this.isDestroyed || this.status.reconnectAttempts >= this.options.maxReconnectAttempts) {
      return
    }

    this.clearReconnectTimer()
    
    const delay = this.options.reconnectDelay * Math.pow(2, this.status.reconnectAttempts)
    
    this.reconnectTimer = setTimeout(() => {
      this.status.reconnectAttempts++
      this.connect()
    }, delay)
  }
}

// Global connection manager instance
let globalConnectionManager: ConnectionManager | null = null

export function getConnectionManager(options?: Partial<ConnectionManagerOptions>): ConnectionManager {
  if (!globalConnectionManager) {
    globalConnectionManager = new ConnectionManager(options)
  }
  return globalConnectionManager
}

export function destroyConnectionManager(): void {
  if (globalConnectionManager) {
    globalConnectionManager.destroy()
    globalConnectionManager = null
  }
}