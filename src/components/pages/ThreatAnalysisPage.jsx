import { useState, useMemo } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { useNetwork } from '../../context/NetworkContext';
import { GraphCrashProtector } from '../GraphCrashProtector';
import { generateThreatTrendData } from '../../utils/mockData';
import { 
  RefreshCw, 
  Flame, 
  AlertTriangle 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export const ThreatAnalysisPage = () => {
  const { blockedIPs, logActivity } = useSecurity();
  const { metrics, triggerAttackBurst } = useNetwork();
  
  // Custom generated local threat trend state
  const [dataDays, setDataDays] = useState(7);
  const [trendData, setTrendData] = useState(() => generateThreatTrendData(7));

  const regenerateTrendData = (daysCount) => {
    const freshData = generateThreatTrendData(daysCount);
    setTrendData(freshData);
    logActivity(`Regenerated threat statistics timeline for ${daysCount} periods`, 'System', 'medium');
  };

  const handleDayChange = (e) => {
    const val = Number(e.target.value);
    setDataDays(val);
    regenerateTrendData(val);
  };

  // Geo threat data compiled deterministically based on trendData length to ensure pure render paths
  const geoData = useMemo(() => {
    const count = trendData.length;
    return [
      { name: 'Russian Federation (RU)', value: ((count * 17) % 30) + 35, color: '#ff3b30' },
      { name: 'China (CN)', value: ((count * 23) % 20) + 25, color: '#ffcc00' },
      { name: 'United States (US)', value: ((count * 29) % 15) + 15, color: '#00f0ff' },
      { name: 'Ukraine (UA)', value: ((count * 31) % 10) + 10, color: '#00ff7f' },
      { name: 'Other Subnets', value: ((count * 37) % 15) + 10, color: '#8b9bb4' }
    ];
  }, [trendData]);

  // Protocol / Attack type distribution data
  const attackTypesData = useMemo(() => [
    { type: 'Port Scans', count: metrics.lowCount * 4 + 120, fill: '#8b9bb4' },
    { type: 'DDoS SYN Flood', count: metrics.mediumCount * 3 + 85, fill: '#00f0ff' },
    { type: 'SQL Injection', count: metrics.highCount * 2 + 45, fill: '#ffcc00' },
    { type: 'RCE / Shellcode', count: metrics.criticalCount + 18, fill: '#ff3b30' }
  ], [metrics]);

  const handleSimulateBurst = () => {
    const res = triggerAttackBurst();
    if (res.success) {
      // Refresh current graph data to show immediate impact
      regenerateTrendData(dataDays);
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs select-none">
      
      {/* Simulation Controls & Injectors */}
      <div className="glass-panel p-5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
            SOC Analytical Sandbox
          </h4>
          <p className="text-[10px] text-cyber-textMuted">
            Configure telemetry filters and load stress testing indicators
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Days selector */}
          <div className="flex items-center gap-2 bg-cyber-dark/80 px-3 py-1.5 border border-cyber-border/40 rounded-lg">
            <span className="text-[10px] text-cyber-textMuted uppercase tracking-wider">
              Time Range:
            </span>
            <select
              value={dataDays}
              onChange={handleDayChange}
              className="bg-transparent text-white focus:outline-none border-b border-cyber-border cursor-pointer"
            >
              <option value={7} className="bg-cyber-dark">Last 7 Periods</option>
              <option value={15} className="bg-cyber-dark">Last 15 Periods</option>
              <option value={30} className="bg-cyber-dark">Last 30 Periods</option>
            </select>
          </div>

          {/* Random data generator trigger */}
          <button
            onClick={() => regenerateTrendData(dataDays)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyber-neonGreen/10 border border-cyber-neonGreen hover:bg-cyber-neonGreen/20 text-cyber-neonGreen rounded uppercase tracking-wider"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regen Mock Data</span>
          </button>

          {/* Rapid attack spike */}
          <button
            onClick={handleSimulateBurst}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyber-neonRed/10 border border-cyber-neonRed hover:bg-cyber-neonRed/20 text-cyber-neonRed rounded uppercase tracking-wider animate-pulse-slow"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Spike Threat Logs</span>
          </button>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Trend Area Chart */}
        <div className="glass-panel p-5 rounded-lg flex flex-col justify-between">
          <div>
            <h4 className="text-xs text-white uppercase font-bold tracking-wider mb-1">
              Active Intrusion Over time
            </h4>
            <p className="text-[9px] text-cyber-textMuted mb-4">
              Historical intrusion telemetry trends for the selected periods
            </p>
          </div>

          <div className="h-64 w-full">
            <GraphCrashProtector title="Intrusion Timeline">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffcc00" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ffcc00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 127, 0.05)" />
                  <XAxis dataKey="name" stroke="#8b9bb4" fontSize={9} />
                  <YAxis stroke="#8b9bb4" fontSize={9} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0a0f1e', 
                      borderColor: 'rgba(0, 255, 127, 0.3)', 
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono',
                      color: '#fff'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Port Scans Detected" 
                    stroke="#00f0ff" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorScans)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Blocked Requests" 
                    stroke="#ffcc00" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorBlocked)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </GraphCrashProtector>
          </div>
        </div>

        {/* Attack Type Distribution Bar Chart */}
        <div className="glass-panel p-5 rounded-lg flex flex-col justify-between">
          <div>
            <h4 className="text-xs text-white uppercase font-bold tracking-wider mb-1">
              Exploit Signature Distribution
            </h4>
            <p className="text-[9px] text-cyber-textMuted mb-4">
              Breakdown of exploits detected in live network payloads
            </p>
          </div>

          <div className="h-64 w-full">
            <GraphCrashProtector title="Exploit Signatures">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={attackTypesData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 127, 0.05)" />
                  <XAxis dataKey="type" stroke="#8b9bb4" fontSize={9} />
                  <YAxis stroke="#8b9bb4" fontSize={9} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0a0f1e', 
                      borderColor: 'rgba(0, 255, 127, 0.3)', 
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono',
                      color: '#fff'
                    }} 
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {attackTypesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </GraphCrashProtector>
          </div>
        </div>

      </div>

      {/* Geolocations & Incident Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Geo Distribution Pie Chart */}
        <div className="glass-panel p-5 rounded-lg lg:col-span-1">
          <h4 className="text-xs text-white uppercase font-bold tracking-wider mb-1">
            Origin Subnet Geo Registry
          </h4>
          <p className="text-[9px] text-cyber-textMuted mb-4">
            Incident origin allocation based on registry maps
          </p>

          <div className="h-44 w-full">
            <GraphCrashProtector title="Geo Location Registry">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0a0f1e', 
                      borderColor: 'rgba(0, 255, 127, 0.3)', 
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono',
                      color: '#fff'
                    }} 
                  />
                  <Pie
                    data={geoData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {geoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </GraphCrashProtector>
          </div>

          <div className="space-y-1.5 mt-2">
            {geoData.map((g, idx) => (
              <div key={idx} className="flex justify-between items-center text-[9px]">
                <span className="flex items-center gap-1.5 text-cyber-textMuted">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }}></span>
                  {g.name}
                </span>
                <span className="text-white font-bold">{g.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Exploit details sandbox */}
        <div className="glass-panel p-5 rounded-lg lg:col-span-2 flex flex-col justify-between">
          <div>
            <h4 className="text-xs text-white uppercase font-bold tracking-wider mb-1">
              Active Intrusion Response Metrics
            </h4>
            <p className="text-[9px] text-cyber-textMuted mb-4">
              Real-time threat status containment parameters
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-cyber-textMuted">Threat Containment Rate</span>
                  <span className="text-cyber-neonGreen font-bold">
                    {Math.round((blockedIPs.size / (metrics.criticalCount + metrics.highCount + 10)) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-cyber-dark border border-cyber-border/40 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyber-neonGreen rounded-full"
                    style={{ width: `${Math.min(100, Math.round((blockedIPs.size / (metrics.criticalCount + metrics.highCount + 10)) * 100))}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-cyber-textMuted">Alert Deflection Efficiency</span>
                  <span className="text-cyber-neonCyan font-bold">94.2%</span>
                </div>
                <div className="w-full bg-cyber-dark border border-cyber-border/40 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyber-neonCyan rounded-full"
                    style={{ width: '94.2%' }}
                  ></div>
                </div>
              </div>

              <div className="p-3 bg-cyber-dark/60 border border-cyber-border/20 rounded text-[10px] text-cyber-textMuted">
                <span className="font-bold block text-white uppercase mb-1">
                  Incident Response Summary:
                </span>
                Average Mean-Time-To-Detect (MTTD) is at <span className="text-cyber-neonGreen font-semibold">120ms</span>. Average Mean-Time-To-Resolve (MTTR) is <span className="text-cyber-neonGreen font-semibold">4.8 minutes</span> (primarily auto-blocked at edge firewall). Active filters block TCP scanning blocks from Russia and China registries based on confidence rules &gt; 80%.
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center bg-cyber-neonRed/5 p-2.5 border border-cyber-neonRed/20 rounded-lg">
            <span className="text-[9px] text-cyber-neonRed font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              Graph Crash Prevention Sandbox active.
            </span>
            <span className="text-[9px] text-cyber-textMuted">Hover over charts to force rendering exceptions.</span>
          </div>
        </div>

      </div>

    </div>
  );
};
export default ThreatAnalysisPage;
