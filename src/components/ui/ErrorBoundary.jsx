import { Component } from 'react'
import ErrorState from './ErrorState'

/**
 * Catches React render crashes and shows a calm, mobile-friendly message
 * instead of a white screen or raw stack trace.
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    // Log for developers only — never surface to the UI
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error)
    }
  }

  reset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
          <ErrorState
            title="Something went wrong"
            description="This screen hit an unexpected problem. Your data is safe — tap try again, or go back and reopen the page."
            onRetry={() => {
              this.reset()
              if (this.props.onReset) this.props.onReset()
              else window.location.assign('/')
            }}
          />
        </div>
      )
    }
    return this.props.children
  }
}
