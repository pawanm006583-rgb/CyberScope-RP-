import { useState } from 'react';
import { useSecurity } from '../context/SecurityContext';
import { useNetwork } from '../context/NetworkContext';
import { 
  Bell, 
  User, 
  Flame, 
  Check 
} from 'lucide-react';

export const Topbar = ({ activeTab }) => {
  const { 
    currentUser, 
    setCurrentUser, 
    users, 
    threatScore 
  } = useSecurity();

  const { 
    alerts, 
    triggerAttackBurst 
  } = useNetwork();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Derive risk state
  const getRiskCategory = (score) => {
    if (score < 30) return { label: 'LOW', color: 'text-cyber-neonGreen border-cyber-neonGreen bg-cyber-neonGreen/10', glow: 'neon-glow-green' };
    if (score < 60) return { label: 'MEDIUM', color: 'text-cyber-neonCyan border-cyber-neonCyan bg-cyber-neonCyan/10', glow: 'neon-glow-cyan' };
    if (score < 85) return { label: 'HIGH', color: 'text-cyber-neonYellow border-cyber-neonYellow bg-cyber-neonYellow/10', glow: 'neon-glow-yellow' };
    return { label: 'CRITICAL', color: 'text-cyber-neonRed border-cyber-neonRed bg-cyber-neonRed/10', glow: 'neon-glow-red' };
  };

  const risk = getRiskCategory(threatScore);
  const unreadAlerts = alerts.filter(a => a.status === 'New');
  const criticalNotifications = unreadAlerts.filter(a => a.severity === 'critical' || a.severity === 'high');

  const handleSimulateAttack = () => {
    const res = triggerAttackBurst();
    if (!res.success) {
      alert(res.error || "Execution denied.");
    }
  };

  const formatTitle = (tab) => {
    return tab.split('-').map(word => word.toUpperCase()).join(' ');
  };

  return (
    <header className="h-20 bg-cyber-dark/80 backdrop-blur-md border-b border-cyber-border px-8 flex items-center justify-between select-none relative z-40">
      {/* Title */}
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold font-mono tracking-wider text-white m-0">
          &gt; {formatTitle(activeTab)}
        </h2>
      </div>

      {/* Action Center / Indicators */}
      <div className="flex items-center gap-6">
        
        {/* Threat Score Tracker */}
        <div className="flex items-center gap-3 bg-cyber-dark/40 border border-cyber-border/40 px-4 py-1.5 rounded-lg">
          <span className="text-[10px] text-cyber-textMuted font-mono uppercase tracking-wider">
            THREAT SCORE:
          </span>
          <span className={`text-base font-extrabold font-mono ${risk.glow}`}>
            {threatScore}
          </span>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border rounded uppercase ${risk.color}`}>
            {risk.label}
          </span>
        </div>

        {/* Rapid Sim Attack Trigger */}
        <button
          onClick={handleSimulateAttack}
          className="flex items-center gap-2 px-4 py-2 bg-cyber-neonRed/10 hover:bg-cyber-neonRed/20 border border-cyber-neonRed text-cyber-neonRed text-xs font-mono rounded uppercase tracking-wider transition-all duration-150 animate-pulse-slow"
          title="Injects 200 attack packets and alerts instantly"
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Simulate Attack Burst</span>
        </button>

        {/* Notifications Icon & Panel */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserDropdown(false);
            }}
            className="p-2 hover:bg-white/5 border border-cyber-border/30 rounded-lg text-cyber-textMuted hover:text-white transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-cyber-neonRed text-white text-[10px] font-mono flex items-center justify-center font-bold">
                {unreadAlerts.length > 99 ? '99+' : unreadAlerts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 glass-panel border border-cyber-border rounded-lg shadow-2xl p-4 z-50">
              <div className="flex justify-between items-center pb-3 border-b border-cyber-border/40 mb-3">
                <span className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
                  ACTIVE ALERT PIPELINE
                </span>
                <span className="text-[10px] font-mono bg-cyber-neonRed/20 text-cyber-neonRed px-1.5 py-0.5 rounded border border-cyber-neonRed/40">
                  {criticalNotifications.length} CRIT
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                {criticalNotifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-cyber-textMuted font-mono">
                    <Check className="w-6 h-6 text-cyber-neonGreen mx-auto mb-2" />
                    <span>No critical triage alerts</span>
                  </div>
                ) : (
                  criticalNotifications.slice(0, 5).map(alert => (
                    <div 
                      key={alert.id} 
                      className="p-2 bg-cyber-dark/80 rounded border-l-2 border-l-cyber-neonRed border border-cyber-border/20 text-[10px] font-mono"
                    >
                      <div className="flex justify-between font-semibold text-white">
                        <span className="truncate">{alert.signature}</span>
                        <span className="text-cyber-neonRed text-[9px]">CRIT</span>
                      </div>
                      <div className="text-cyber-textMuted flex justify-between mt-1">
                        <span>SRC: {alert.sourceIp}</span>
                        <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-cyber-border/40 mt-3 pt-2 text-center">
                <p className="text-[10px] text-cyber-textMuted font-mono">
                  Showing top 5 unresolved priority threats.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* User Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/5 border border-cyber-border/30 rounded-lg text-cyber-textMuted hover:text-white transition-all font-mono text-xs"
          >
            <User className="w-4 h-4" />
            <span className="max-w-[100px] truncate">{currentUser.name}</span>
            <span className="text-[9px] px-1 bg-cyber-neonGreen/10 border border-cyber-neonGreen/30 text-cyber-neonGreen rounded">
              {currentUser.role}
            </span>
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-3 w-56 glass-panel border border-cyber-border rounded-lg shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-cyber-border/40 mb-2">
                <span className="text-[9px] font-mono text-cyber-textMuted uppercase block tracking-wider">
                  Select User Context
                </span>
                <span className="text-xs font-mono text-white">
                  Simulate SOC Permissions
                </span>
              </div>
              <div className="space-y-1">
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded font-mono text-xs text-left transition-colors ${
                      currentUser.id === u.id
                        ? 'bg-cyber-neonGreen/10 text-cyber-neonGreen border border-cyber-neonGreen/20'
                        : 'text-cyber-textMuted hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <p className="font-semibold truncate">{u.name}</p>
                      <p className="text-[9px] text-cyber-textMuted uppercase">{u.role}</p>
                    </div>
                    {currentUser.id === u.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
export default Topbar;
