import { 
  Shield, 
  LayoutDashboard, 
  Activity, 
  BarChart2, 
  ShieldAlert, 
  Key, 
  Search, 
  Settings 
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { currentUser } = useSecurity();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'network-feed', label: 'Network Feed', icon: Activity },
    { id: 'threat-analysis', label: 'Threat Analysis', icon: BarChart2 },
    { id: 'blacklist', label: 'Blacklist Explorer', icon: ShieldAlert },
    { id: 'access-control', label: 'Access Control', icon: Key },
    { id: 'security-search', label: 'Security Search', icon: Search },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-cyber-dark/95 border-r border-cyber-border min-h-screen flex flex-col justify-between select-none">
      <div>
        {/* Brand/Header */}
        <div className="p-6 border-b border-cyber-border/80 flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-cyber-neonGreen/30 blur-sm rounded-lg animate-pulse"></div>
            <Shield className="w-8 h-8 text-cyber-neonGreen relative z-10 animate-pulse-slow" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-wider text-white font-mono m-0 flex items-center gap-1">
              CYBER<span className="text-cyber-neonGreen">SCOPE</span>
            </h1>
            <span className="text-[9px] text-cyber-textMuted font-mono block tracking-widest uppercase">
              SOC Security Console
            </span>
          </div>
        </div>

        {/* System Terminal Header Info */}
        <div className="px-6 py-3 bg-cyber-dark/40 border-b border-cyber-border/30 font-mono text-[10px] text-cyber-textMuted flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-neonGreen animate-ping"></span>
            SEC-SYS: ONLINE
          </span>
          <span>v2.8.4-BETA</span>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-xs uppercase tracking-wider transition-all duration-200 text-left ${
                  isActive 
                    ? 'glass-panel text-cyber-neonGreen border-l-4 border-l-cyber-neonGreen shadow-[0_0_15px_rgba(0,255,127,0.1)]' 
                    : 'text-cyber-textMuted hover:text-white hover:bg-white/5 border-l-4 border-l-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Operator Session status Card */}
      <div className="p-4 border-t border-cyber-border/50 bg-cyber-dark/60">
        <div className="p-3 rounded-lg bg-cyber-dark border border-cyber-border/40 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-cyber-neonGreen/10 border border-cyber-neonGreen/30 flex items-center justify-center font-mono font-bold text-cyber-neonGreen text-xs">
            {currentUser.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate font-mono">{currentUser.name}</p>
            <p className="text-[10px] text-cyber-neonGreen font-mono uppercase tracking-wider truncate">
              {currentUser.role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
