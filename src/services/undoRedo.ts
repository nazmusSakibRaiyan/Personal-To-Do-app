import { Task } from '../types'

export interface UndoRedoState {
  past: Task[][]
  present: Task[]
  future: Task[][]
}

class UndoRedoManager {
  private state: UndoRedoState = {
    past: [],
    present: [],
    future: [],
  }

  private maxHistory = 50 // Keep max 50 states

  initialize(tasks: Task[]): void {
    this.state = {
      past: [],
      present: JSON.parse(JSON.stringify(tasks)),
      future: [],
    }
  }

  push(tasks: Task[]): void {
    // Deep copy to avoid reference issues
    const copy = JSON.parse(JSON.stringify(tasks))
    
    // Clear future when new action is performed
    this.state.future = []
    
    // Add current state to past
    this.state.past.push(this.state.present)
    
    // Limit history size
    if (this.state.past.length > this.maxHistory) {
      this.state.past.shift()
    }
    
    this.state.present = copy
  }

  undo(): Task[] | null {
    if (this.state.past.length === 0) {
      return null
    }

    const previous = this.state.past.pop()
    if (previous) {
      this.state.future.unshift(this.state.present)
      this.state.present = previous
      return JSON.parse(JSON.stringify(this.state.present))
    }

    return null
  }

  redo(): Task[] | null {
    if (this.state.future.length === 0) {
      return null
    }

    const next = this.state.future.shift()
    if (next) {
      this.state.past.push(this.state.present)
      this.state.present = next
      return JSON.parse(JSON.stringify(this.state.present))
    }

    return null
  }

  canUndo(): boolean {
    return this.state.past.length > 0
  }

  canRedo(): boolean {
    return this.state.future.length > 0
  }

  getState(): UndoRedoState {
    return this.state
  }

  clear(): void {
    this.state = {
      past: [],
      present: [],
      future: [],
    }
  }
}

export const undoRedoManager = new UndoRedoManager()
