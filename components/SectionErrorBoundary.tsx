"use client"
import React from 'react'

interface SectionErrorBoundaryProps {
  label: string
  children: React.ReactNode
}

interface SectionErrorBoundaryState { hasError: boolean; message?: string }

class SectionErrorBoundaryInner extends React.Component<SectionErrorBoundaryProps, SectionErrorBoundaryState> {
  state: SectionErrorBoundaryState = { hasError: false }
  static getDerivedStateFromError(error: unknown): SectionErrorBoundaryState {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) }
  }
  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[SectionErrorBoundary]', this.props.label, error, info.componentStack)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-8 mx-auto max-w-3xl border border-red-300 bg-red-50 rounded-md text-sm text-red-800">
          <strong className="block mb-1">Section failed to load:</strong>
          <div>{this.props.label}</div>
          {this.state.message && <div className="mt-2 opacity-80">{this.state.message}</div>}
        </div>
      )
    }
    return this.props.children
  }
}

export const SectionErrorBoundary = SectionErrorBoundaryInner
export default SectionErrorBoundaryInner
