import React from 'react';
import { AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';

class GraphErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, recovered: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Graph Crash Protector intercepted error:", error, errorInfo);
  }

  handleRecover = () => {
    this.setState({ hasError: false, recovered: true });
    // Clear recovered notification after 3 seconds
    setTimeout(() => {
      this.setState({ recovered: false });
    }, 3000);
    if (this.props.onRecover) {
      this.props.onRecover();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 min-h-[260px] glass-panel-red rounded-lg border-dashed text-center font-mono">
          <AlertTriangle className="w-10 h-10 text-cyber-neonRed mb-3 animate-pulse" />
          <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-2">
            Graph Execution Failure
          </h4>
          <p className="text-xs text-cyber-textMuted max-w-xs mb-4">
            A rendering exception occurred in the Recharts canvas engine. Crash prevention activated.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={this.handleRecover}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-cyber-neonGreen/10 hover:bg-cyber-neonGreen/20 border border-cyber-neonGreen text-cyber-neonGreen text-xs rounded uppercase tracking-wider transition-colors duration-150"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Hot Patch & Recover
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full">
        {this.state.recovered && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-3 py-1 bg-cyber-dark border border-cyber-neonGreen text-cyber-neonGreen text-xs font-mono rounded-full animate-bounce">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Graph Recovered Successfully</span>
          </div>
        )}
        {this.props.children}
      </div>
    );
  }
}

// Wrapper component that also lets us simulate a crash for presentation purposes
export const GraphCrashProtector = ({ children, onRecover }) => {
  const [crashSimulated, setCrashSimulated] = React.useState(false);

  const handleCrashSimulation = () => {
    setCrashSimulated(true);
  };

  const handleRecovery = () => {
    setCrashSimulated(false);
    if (onRecover) onRecover();
  };

  if (crashSimulated) {
    // Throw error in render to trigger the boundary
    throw new Error("Simulated chart crash in Recharts canvas rendering.");
  }

  return (
    <GraphErrorBoundary onRecover={handleRecovery}>
      <div className="relative group w-full h-full">
        {/* Sim crash button visible on hover */}
        <button
          onClick={handleCrashSimulation}
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 z-10 px-2 py-0.5 bg-cyber-neonRed/10 border border-cyber-neonRed/30 text-cyber-neonRed text-[9px] font-mono rounded hover:bg-cyber-neonRed/35 transition-all duration-200"
          title="Simulate a Recharts render crash to test recovery"
        >
          FORCE CRASH
        </button>
        {children}
      </div>
    </GraphErrorBoundary>
  );
};
export default GraphCrashProtector;
