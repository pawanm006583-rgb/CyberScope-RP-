import { useState } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { useNetwork } from '../../context/NetworkContext';
import { 
  Sliders, 
  Bell, 
  Volume2, 
  RefreshCw, 
  Lock, 
  ShieldCheck, 
  Save 
} from 'lucide-react';

export const SettingsPage = () => {
  const { 
    currentUser, 
    hasPermission, 
    logActivity 
  } = useSecurity();

  const { 
    simSpeed, 
    setSimSpeed, 
    isSimulating, 
    setIsSimulating 
  } = useNetwork();

  // Local settings state
  const [threatSensitivity, setThreatSensitivity] = useState(80);
  const [maxPacketRetention, setMaxPacketRetention] = useState(150);
  const [enableSound, setEnableSound] = useState(false);
  const [enableVisualBanner, setEnableVisualBanner] = useState(true);
  const [dnsDeflector, setDnsDeflector] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const hasSettingsPermission = hasPermission('edit_settings');

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (!hasSettingsPermission) {
      alert('Access Denied: Administrative permissions required to write system settings.');
      return;
    }

    logActivity('Global firewall thresholds updated', currentUser.name, 'medium');
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  const handleSystemReset = () => {
    if (!hasSettingsPermission) {
      alert('Access Denied: Administrative permissions required.');
      return;
    }

    if (confirm("Reset firewall gateway rules and restore default settings? This cannot be undone.")) {
      // Restore defaults
      setThreatSensitivity(80);
      setMaxPacketRetention(150);
      setEnableSound(false);
      setEnableVisualBanner(true);
      setDnsDeflector(true);
      setSimSpeed(1000);
      setIsSimulating(true);

      logActivity('Firewall configurations restored to system default parameters', 'Security Sentinel', 'high');
      alert("Firewall settings re-seeded successfully.");
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs select-none">
      
      {/* Settings Panel & Lock Status */}
      <div className="glass-panel p-5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
            Global Security Configurations
          </h4>
          <p className="text-[10px] text-cyber-textMuted">
            Configure ingress threshold triggers, alerts, and sandbox engines
          </p>
        </div>

        <div>
          {hasSettingsPermission ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-cyber-neonGreen/10 border border-cyber-neonGreen text-cyber-neonGreen rounded uppercase text-[10px] font-bold">
              <ShieldCheck className="w-4 h-4" />
              Terminal Unlocked (Admin)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-cyber-neonRed/10 border border-cyber-neonRed text-cyber-neonRed rounded uppercase text-[10px] font-bold">
              <Lock className="w-4 h-4 animate-pulse" />
              Terminal Locked (Viewer/Analyst)
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Settings Form (Left/Center) */}
        <form onSubmit={handleSaveSettings} className="glass-panel p-5 rounded-lg lg:col-span-2 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-cyber-border/20">
            <Sliders className="w-4 h-4 text-cyber-neonGreen" />
            <h4 className="text-xs text-white uppercase font-bold tracking-wider">
              Firewall and Analytics Parameters
            </h4>
          </div>

          <div className="space-y-4">
            
            {/* Sensitivity Slider */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-cyber-textMuted font-bold">IDS Aggressiveness Sensitivity:</span>
                <span className="text-cyber-neonGreen font-extrabold">{threatSensitivity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={threatSensitivity}
                disabled={!hasSettingsPermission}
                onChange={(e) => setThreatSensitivity(Number(e.target.value))}
                className="w-full accent-cyber-neonGreen bg-cyber-dark disabled:opacity-40"
              />
              <span className="text-[9px] text-cyber-textMuted block mt-1">
                Higher sensitivity increases alerts frequency and automatically blocks suspect networks.
              </span>
            </div>

            {/* Ingress packet rate dropdown */}
            <div>
              <label className="text-cyber-textMuted block mb-1.5 font-bold">Ingress simulation rate limit:</label>
              <select
                value={simSpeed}
                disabled={!hasSettingsPermission}
                onChange={(e) => setSimSpeed(Number(e.target.value))}
                className="bg-cyber-dark border border-cyber-border/40 px-3 py-1.5 rounded-lg text-white font-mono cursor-pointer focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value={2000}>2.0s - Low Traffic Load</option>
                <option value={1000}>1.0s - Normal Telemetry</option>
                <option value={500}>0.5s - High Telemetry</option>
                <option value={200}>0.2s - Extreme Telemetry</option>
              </select>
            </div>

            {/* Retention Buffer size */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-cyber-textMuted font-bold">Active Packet Memory Buffer:</span>
                <span className="text-white font-bold">{maxPacketRetention} frames</span>
              </div>
              <input
                type="range"
                min="50"
                max="300"
                step="50"
                value={maxPacketRetention}
                disabled={!hasSettingsPermission}
                onChange={(e) => setMaxPacketRetention(Number(e.target.value))}
                className="w-full accent-cyber-neonGreen bg-cyber-dark disabled:opacity-40"
              />
              <span className="text-[9px] text-cyber-textMuted block mt-1">
                Maximum frames stored in RAM before queue recycling.
              </span>
            </div>

            {/* Checkbox Switches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <label className={`flex items-center gap-2.5 cursor-pointer text-cyber-textMuted hover:text-white ${!hasSettingsPermission ? 'opacity-40 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={dnsDeflector}
                  disabled={!hasSettingsPermission}
                  onChange={(e) => setDnsDeflector(e.target.checked)}
                  className="rounded bg-cyber-dark border-cyber-border text-cyber-neonGreen focus:ring-0"
                />
                <div>
                  <span className="block font-bold">C2 DNS Domain Deflector</span>
                  <span className="text-[9px] text-cyber-textMuted">Reroute blacklisted queries to sinkhole</span>
                </div>
              </label>

              <label className={`flex items-center gap-2.5 cursor-pointer text-cyber-textMuted hover:text-white ${!hasSettingsPermission ? 'opacity-40 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={isSimulating}
                  disabled={!hasSettingsPermission}
                  onChange={(e) => setIsSimulating(e.target.checked)}
                  className="rounded bg-cyber-dark border-cyber-border text-cyber-neonGreen focus:ring-0"
                />
                <div>
                  <span className="block font-bold">Edge Simulator active</span>
                  <span className="text-[9px] text-cyber-textMuted">Generate packets continuously</span>
                </div>
              </label>
            </div>

          </div>

          <div className="pt-4 border-t border-cyber-border/20 flex justify-between items-center">
            {isSaved && (
              <span className="text-cyber-neonGreen text-[10px] font-bold animate-bounce flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Firewall settings committed to node config.
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={!hasSettingsPermission}
                className="px-5 py-2 bg-cyber-neonGreen text-cyber-dark hover:bg-cyber-neonGreen/80 font-bold uppercase rounded transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>Save Config</span>
              </button>
            </div>
          </div>
        </form>

        {/* Security Notification policies and resets (Right) */}
        <div className="glass-panel p-5 rounded-lg flex flex-col justify-between min-h-[400px]">
          <div className="space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-cyber-border/20">
              <Bell className="w-4 h-4 text-cyber-neonGreen" />
              <h4 className="text-xs text-white uppercase font-bold tracking-wider">
                Audible and visual Alerts
              </h4>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2.5 cursor-pointer text-cyber-textMuted hover:text-white">
                <input
                  type="checkbox"
                  checked={enableVisualBanner}
                  onChange={(e) => setEnableVisualBanner(e.target.checked)}
                  className="rounded bg-cyber-dark border-cyber-border text-cyber-neonGreen focus:ring-0"
                />
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyber-neonGreen" />
                  <div>
                    <span className="block font-bold">Pop HUD banners on Threats</span>
                    <span className="text-[9px] text-cyber-textMuted">Visual warning indicators</span>
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-cyber-textMuted hover:text-white">
                <input
                  type="checkbox"
                  checked={enableSound}
                  onChange={(e) => setEnableSound(e.target.checked)}
                  className="rounded bg-cyber-dark border-cyber-border text-cyber-neonGreen focus:ring-0"
                />
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-cyber-neonGreen" />
                  <div>
                    <span className="block font-bold">Audible alarm alert</span>
                    <span className="text-[9px] text-cyber-textMuted">Synthesized beep tone on Critical IP trigger</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Hard restore button */}
          <div className="pt-4 border-t border-cyber-border/20 mt-6 space-y-2">
            <span className="text-[9px] text-cyber-textMuted block uppercase">CRITICAL SYSTEM MAINTENANCE:</span>
            <button
              onClick={handleSystemReset}
              disabled={!hasSettingsPermission}
              className="w-full py-2 bg-cyber-neonRed/10 border border-cyber-neonRed hover:bg-cyber-neonRed/20 text-cyber-neonRed font-bold uppercase rounded transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Full Factory Reset</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
export default SettingsPage;
