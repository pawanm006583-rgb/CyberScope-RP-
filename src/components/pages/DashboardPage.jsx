import { useMemo } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { useNetwork } from '../../context/NetworkContext';
import { GraphCrashProtector } from '../GraphCrashProtector';
import { generateThreatTrendData } from '../../utils/mockData';
import { 
  ShieldAlert, 
  Activity, 
  Database, 
  Radio, 
  Clock 
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
  Cell
} from 'recharts';

export const DashboardPage = () => {
  const { threatScore, blockedIPs, activityLog } = useSecurity();
  const { packets, alerts, metrics } = useNetwork();

  // Load a fixed dataset of threat trends
  const trendData = useMemo(() => generateThreatTrendData(7), []);

  // Calculate severity stats for BarChart
  const severityChartData = [
    { name: 'Critical', count: metrics.criticalCount, color: '#ff3b30' },
    { name: 'High', count: metrics.highCount, color: '#ffcc00' },
    { name: 'Medium', count: metrics.mediumCount, color: '#00f0ff' },
    { name: 'Low', count: metrics.lowCount, color: '#8b9bb4' }
  ];

  // Derive risk badge info
  const getRiskDetails = (score) => {
    if (score < 30) return { label: 'Low Risk', color: 'text-cyber-neonGreen', bg: 'bg-cyber-neonGreen/10', border: 'border-cyber-neonGreen/30', desc: 'System telemetry shows nominal traffic patterns. No active intrusion vectors detected.' };
    if (score < 60) return { label: 'Moderate Risk', color: 'text-cyber-neonCyan', bg: 'bg-cyber-neonCyan/10', border: 'border-cyber-neonCyan/30', desc: 'Elevated scans detected. Standard security controls operational.' };
    if (score < 85) return { label: 'High Risk', color: 'text-cyber-neonYellow', bg: 'bg-cyber-neonYellow/10', border: 'border-cyber-neonYellow/30', desc: 'Active exploits identified. Analysts should actively triage the alert queue.' };
    return { label: 'Critical Threat', color: 'text-cyber-neonRed', bg: 'bg-cyber-neonRed/10', border: 'border-cyber-neonRed/40', desc: 'Intrusion attempts detected in progress. Emergency threat containment response recommended.' };
  };

  const risk = getRiskDetails(threatScore);

  return (
    <div className="space-y-6 select-none font-mono">
      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        
        {/* Total Packets Checked */}
        <div className="glass-panel p-5 rounded-lg border-l-4 border-l-cyber-neonGreen relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Radio className="w-16 h-16 text-cyber-neonGreen" />
          </div>
          <p className="text-[10px] text-cyber-textMuted uppercase tracking-wider">
            Total Telemetry Cleaned
          </p>
          <h3 className="text-2xl font-bold text-white mt-1 neon-glow-green">
            {metrics.totalProcessed.toLocaleString()}
          </h3>
          <p className="text-[9px] text-cyber-neonGreen flex items-center gap-1 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-neonGreen animate-ping"></span>
            Streaming packets actively
          </p>
        </div>

        {/* Triage Queue Alert Count */}
        <div className="glass-panel p-5 rounded-lg border-l-4 border-l-cyber-neonYellow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <ShieldAlert className="w-16 h-16 text-cyber-neonYellow" />
          </div>
          <p className="text-[10px] text-cyber-textMuted uppercase tracking-wider">
            Active Security Alerts
          </p>
          <h3 className="text-2xl font-bold text-white mt-1 text-cyber-neonYellow">
            {alerts.filter(a => a.status === 'New').length}
          </h3>
          <p className="text-[9px] text-cyber-textMuted mt-2">
            Pending Analyst review
          </p>
        </div>

        {/* Total Blocked IP Addresses */}
        <div className="glass-panel p-5 rounded-lg border-l-4 border-l-cyber-neonRed relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Database className="w-16 h-16 text-cyber-neonRed" />
          </div>
          <p className="text-[10px] text-cyber-textMuted uppercase tracking-wider">
            Active Blacklisted IPs
          </p>
          <h3 className="text-2xl font-bold text-white mt-1 text-cyber-neonRed">
            {blockedIPs.size.toLocaleString()}
          </h3>
          <p className="text-[9px] text-cyber-neonRed mt-2">
            Blocked at gateway boundary
          </p>
        </div>

        {/* Active Threats (Sum of High/Critical Alerts) */}
        <div className="glass-panel p-5 rounded-lg border-l-4 border-l-cyber-neonCyan relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Activity className="w-16 h-16 text-cyber-neonCyan" />
          </div>
          <p className="text-[10px] text-cyber-textMuted uppercase tracking-wider">
            Active threat vectors
          </p>
          <h3 className="text-2xl font-bold text-white mt-1 text-cyber-neonCyan">
            {alerts.filter(a => a.status === 'New' && (a.severity === 'high' || a.severity === 'critical')).length}
          </h3>
          <p className="text-[9px] text-cyber-textMuted mt-2">
            Uncontained high-risk triggers
          </p>
        </div>

      </div>

      {/* Instant Threat Score Gauge & Detailed Description */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Threat Score Panel */}
        <div className="glass-panel p-6 rounded-lg lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs text-white uppercase font-bold tracking-wider">
                Instant Threat Index
              </h4>
              <span className="text-[9px] text-cyber-textMuted font-mono">
                SEC-INDEX v1.0
              </span>
            </div>
            
            {/* Visual Dial (Simulated using CSS) */}
            <div className="my-6 flex flex-col items-center justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center rounded-full border border-cyber-border/40 bg-cyber-dark/80 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                {/* Score text inside */}
                <div className="text-center z-10">
                  <span className="text-4xl font-extrabold text-white">{threatScore}</span>
                  <span className="text-[10px] text-cyber-textMuted block font-mono">/ 100</span>
                </div>
                
                {/* Simulated pointer border circle */}
                <div 
                  className="absolute inset-2 rounded-full border-t-2 border-t-cyber-neonGreen border-r-2 border-r-cyber-neonGreen/30 border-b-2 border-b-cyber-neonGreen/10 border-l-2 border-l-cyber-neonGreen/50 animate-spin" 
                  style={{ animationDuration: '8s' }}
                ></div>
              </div>
            </div>

            {/* Progress Bar indicator */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-cyber-textMuted">Threat Level Severity</span>
                <span className={`font-bold ${risk.color}`}>{threatScore}%</span>
              </div>
              <div className="w-full bg-cyber-dark border border-cyber-border/40 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    threatScore < 30 ? 'bg-cyber-neonGreen' :
                    threatScore < 60 ? 'bg-cyber-neonCyan' :
                    threatScore < 85 ? 'bg-cyber-neonYellow' : 'bg-cyber-neonRed'
                  }`}
                  style={{ width: `${threatScore}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className={`mt-5 p-3.5 border rounded-lg ${risk.bg} ${risk.border} text-[10px] text-justify leading-relaxed`}>
            <span className="font-bold block uppercase tracking-wider mb-1">
              SYSTEM STATUS: {risk.label}
            </span>
            {risk.desc}
          </div>
        </div>

        {/* Trend Area Chart (Recharts) */}
        <div className="glass-panel p-6 rounded-lg lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-xs text-white uppercase font-bold tracking-wider">
                Threat Vector Timeline
              </h4>
              <span className="text-[9px] text-cyber-textMuted">
                Network packet and intrusion trends over 7 periods
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-cyber-textMuted">
              <span className="w-2 h-2 rounded-full bg-cyber-neonGreen"></span> Packets
              <span className="w-2 h-2 rounded-full bg-cyber-neonRed"></span> Alerts
            </div>
          </div>
          
          <div className="h-60 w-full">
            <GraphCrashProtector title="Threat Timeline">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPackets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff7f" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#00ff7f" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff3b30" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ff3b30" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 127, 0.05)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#8b9bb4" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={{ stroke: 'rgba(0, 255, 127, 0.15)' }} 
                  />
                  <YAxis 
                    stroke="#8b9bb4" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={{ stroke: 'rgba(0, 255, 127, 0.15)' }} 
                  />
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
                    dataKey="Total Packets" 
                    stroke="#00ff7f" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorPackets)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Critical Alerts" 
                    stroke="#ff3b30" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorAlerts)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </GraphCrashProtector>
          </div>
        </div>

      </div>

      {/* Live Feed Preview & Severity Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Network Feed (First 5 packets) */}
        <div className="glass-panel p-5 rounded-lg lg:col-span-2 flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="text-xs text-white uppercase font-bold tracking-wider mb-1">
              Gateway Packet Feed (Live)
            </h4>
            <p className="text-[9px] text-cyber-textMuted">
              Last 5 ingress/egress packets arriving at the edge firewall
            </p>
          </div>

          <div className="space-y-2 max-h-64 overflow-hidden">
            {packets.slice(0, 5).map(pkt => (
              <div 
                key={pkt.id}
                className={`p-2.5 rounded border text-[10px] flex items-center justify-between transition-all duration-300 ${
                  pkt.threatStatus === 'suspicious' 
                    ? 'bg-cyber-neonRed/5 border-cyber-neonRed/30 text-cyber-neonRed' 
                    : pkt.threatStatus === 'blocked'
                    ? 'bg-neutral-900 border-neutral-700 text-neutral-500'
                    : 'bg-cyber-dark/40 border-cyber-border/20 text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`px-1.5 py-0.5 rounded font-bold text-[8px] tracking-wide uppercase ${
                    pkt.protocol === 'TCP' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                    pkt.protocol === 'UDP' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                    pkt.protocol === 'HTTP' ? 'bg-green-950 text-green-400 border border-green-800' :
                    'bg-slate-900 text-slate-400 border border-slate-700'
                  }`}>
                    {pkt.protocol}
                  </span>
                  <div>
                    <span className="font-semibold block sm:inline">{pkt.sourceIp}</span>
                    <span className="text-cyber-textMuted mx-2 hidden sm:inline">&gt;</span>
                    <span className="text-cyber-textMuted font-light hidden sm:inline">{pkt.destIp}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-right">
                  <span className="truncate max-w-[150px] font-mono text-[9px] text-cyber-textMuted hidden md:inline">
                    {pkt.signature}
                  </span>
                  <span className="text-cyber-textMuted">
                    {new Date(pkt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 text-right">
            <span className="text-[9px] text-cyber-neonGreen hover:underline cursor-pointer">
              &gt; Open Network Feed for Full Analysis
            </span>
          </div>
        </div>

        {/* Severity Count Bar Chart */}
        <div className="glass-panel p-5 rounded-lg lg:col-span-1">
          <div className="mb-4">
            <h4 className="text-xs text-white uppercase font-bold tracking-wider mb-1">
              Alert Triage Profile
            </h4>
            <p className="text-[9px] text-cyber-textMuted font-mono">
              Aggregated severity categorization
            </p>
          </div>

          <div className="h-44 w-full">
            <GraphCrashProtector title="Severity Triage">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={severityChartData}
                  margin={{ top: 10, right: 10, left: -30, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 127, 0.05)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#8b9bb4" 
                    fontSize={9} 
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(0, 255, 127, 0.15)' }}
                  />
                  <YAxis 
                    stroke="#8b9bb4" 
                    fontSize={9} 
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(0, 255, 127, 0.15)' }}
                  />
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
                    {severityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </GraphCrashProtector>
          </div>

          {/* Detailed metrics count list */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-[10px]">
            <div className="flex justify-between border-b border-cyber-border/20 pb-1 text-cyber-neonRed font-bold">
              <span>Critical:</span> <span>{metrics.criticalCount}</span>
            </div>
            <div className="flex justify-between border-b border-cyber-border/20 pb-1 text-cyber-neonYellow font-bold">
              <span>High:</span> <span>{metrics.highCount}</span>
            </div>
            <div className="flex justify-between border-b border-cyber-border/20 pb-1 text-cyber-neonCyan font-bold">
              <span>Medium:</span> <span>{metrics.mediumCount}</span>
            </div>
            <div className="flex justify-between border-b border-cyber-border/20 pb-1 text-cyber-textMuted">
              <span>Low:</span> <span>{metrics.lowCount}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Activity Logs (System Events) */}
      <div className="glass-panel p-5 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyber-neonGreen" />
            <h4 className="text-xs text-white uppercase font-bold tracking-wider">
              System Audit log
            </h4>
          </div>
          <span className="text-[9px] text-cyber-textMuted font-mono">
            Latest {Math.min(activityLog.length, 4)} administrative event records
          </span>
        </div>

        <div className="space-y-2 text-[10px] font-mono">
          {activityLog.slice(0, 4).map(log => (
            <div 
              key={log.id} 
              className="flex justify-between items-center py-2 px-3 bg-cyber-dark/30 border border-cyber-border/10 rounded"
            >
              <div className="flex items-center gap-3">
                <span className={`text-[8px] uppercase px-1 py-0.5 rounded ${
                  log.severity === 'high' || log.severity === 'critical'
                    ? 'bg-cyber-neonRed/10 border border-cyber-neonRed/30 text-cyber-neonRed'
                    : log.severity === 'medium'
                    ? 'bg-cyber-neonYellow/10 border border-cyber-neonYellow/30 text-cyber-neonYellow'
                    : 'bg-cyber-neonGreen/10 border border-cyber-neonGreen/20 text-cyber-neonGreen'
                }`}>
                  {log.severity}
                </span>
                <span className="text-white font-medium">{log.action}</span>
              </div>

              <div className="text-cyber-textMuted text-right text-[9px] space-x-2">
                <span>BY: {log.user}</span>
                <span>@ {new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default DashboardPage;
