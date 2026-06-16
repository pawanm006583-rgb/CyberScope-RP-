import { useState } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { useSecurity } from '../../context/SecurityContext';
import { 
  Play, 
  Pause, 
  ShieldCheck, 
  ShieldX, 
  AlertOctagon, 
  Terminal, 
  Eye 
} from 'lucide-react';

export const NetworkFeedPage = () => {
  const { 
    packets, 
    isSimulating, 
    setIsSimulating, 
    simSpeed, 
    setSimSpeed 
  } = useNetwork();
  
  const { 
    blockedIPs, 
    toggleIPBlock 
  } = useSecurity();

  const [filterProto, setFilterProto] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchIP, setSearchIP] = useState('');
  const [selectedPacket, setSelectedPacket] = useState(null);

  // Auto-scroll logic: since the newest packets are prepended to the top of the array,
  // we do not need to scroll down. The newest packets always appear at index 0.
  // We can add a flashing indicator or brief fade-in animation for new items.

  // Filtered Packets list
  const filteredPackets = packets.filter(pkt => {
    const matchesProto = filterProto === 'All' || pkt.protocol === filterProto;
    
    const matchesStatus = 
      filterStatus === 'All' || 
      (filterStatus === 'suspicious' && pkt.threatStatus === 'suspicious') ||
      (filterStatus === 'clean' && pkt.threatStatus === 'clean') ||
      (filterStatus === 'blocked' && pkt.threatStatus === 'blocked');

    const matchesSearch = 
      searchIP.trim() === '' || 
      pkt.sourceIp.includes(searchIP) || 
      pkt.destIp.includes(searchIP) ||
      pkt.signature.toLowerCase().includes(searchIP.toLowerCase());

    return matchesProto && matchesStatus && matchesSearch;
  });

  const handleToggleBlock = (ip, reason) => {
    const res = toggleIPBlock(ip, reason);
    if (!res.success) {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs select-none">
      
      {/* Simulation Controls & Filters Header */}
      <div className="glass-panel p-5 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Play Pause and Speed Slider */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-cyber-dark/80 px-3 py-1.5 border border-cyber-border/40 rounded-lg">
            <span className="text-[10px] text-cyber-textMuted uppercase tracking-wider mr-1">
              Simulation:
            </span>
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`p-1.5 rounded transition-all duration-150 ${
                isSimulating 
                  ? 'bg-cyber-neonGreen/10 text-cyber-neonGreen border border-cyber-neonGreen/45 hover:bg-cyber-neonGreen/20' 
                  : 'bg-cyber-neonRed/10 text-cyber-neonRed border border-cyber-neonRed/45 hover:bg-cyber-neonRed/20'
              }`}
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <span className="text-[10px] uppercase font-bold text-white">
              {isSimulating ? 'RUNNING' : 'PAUSED'}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-cyber-dark/80 px-3 py-1.5 border border-cyber-border/40 rounded-lg">
            <span className="text-[10px] text-cyber-textMuted uppercase tracking-wider">
              Interval:
            </span>
            <select
              value={simSpeed}
              onChange={(e) => setSimSpeed(Number(e.target.value))}
              className="bg-transparent text-white focus:outline-none border-b border-cyber-border font-mono cursor-pointer"
            >
              <option value={2000} className="bg-cyber-dark">2.0s (Slow)</option>
              <option value={1000} className="bg-cyber-dark">1.0s (Normal)</option>
              <option value={500} className="bg-cyber-dark">0.5s (Fast)</option>
              <option value={200} className="bg-cyber-dark">0.2s (Intense)</option>
            </select>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* IP search */}
          <input
            type="text"
            placeholder="SEARCH IP / SIGNATURE..."
            value={searchIP}
            onChange={(e) => setSearchIP(e.target.value)}
            className="w-full sm:w-48 bg-cyber-dark/80 border border-cyber-border/40 hover:border-cyber-border/80 focus:border-cyber-neonGreen focus:outline-none px-3 py-1.5 rounded-lg text-white font-mono placeholder:text-cyber-textMuted"
          />

          {/* Protocol dropdown */}
          <select
            value={filterProto}
            onChange={(e) => setFilterProto(e.target.value)}
            className="bg-cyber-dark border border-cyber-border/40 px-3 py-1.5 rounded-lg text-cyber-textMuted hover:text-white cursor-pointer focus:outline-none font-mono"
          >
            <option value="All">All Protocols</option>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="ICMP">ICMP</option>
            <option value="HTTP">HTTP</option>
            <option value="HTTPS">HTTPS</option>
            <option value="SSH">SSH</option>
            <option value="DNS">DNS</option>
          </select>

          {/* Status dropdown */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-cyber-dark border border-cyber-border/40 px-3 py-1.5 rounded-lg text-cyber-textMuted hover:text-white cursor-pointer focus:outline-none font-mono"
          >
            <option value="All">All Statuses</option>
            <option value="clean">Clean Traffic</option>
            <option value="suspicious">Suspicious</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

      </div>

      {/* Main Grid: Packet table & Packet Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Packet Feed list (Left/Main) */}
        <div className="glass-panel rounded-lg overflow-hidden xl:col-span-2">
          
          {/* Header row */}
          <div className="bg-cyber-dark/80 px-4 py-3 border-b border-cyber-border flex justify-between items-center text-[10px] text-cyber-textMuted font-bold uppercase tracking-wider">
            <span>Live Feed Log ({filteredPackets.length} Active Records)</span>
            <span>Gateway Interface: ETH0</span>
          </div>

          {/* Table */}
          <div className="overflow-y-auto max-h-[550px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cyber-dark/30 text-cyber-textMuted border-b border-cyber-border/20 text-[9px] uppercase tracking-widest font-mono">
                  <th className="p-3 font-semibold">Proto</th>
                  <th className="p-3 font-semibold">Source IP</th>
                  <th className="p-3 font-semibold">Dest IP</th>
                  <th className="p-3 font-semibold">Signature / Incident</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredPackets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20 text-cyber-textMuted">
                      &gt; TELEMETRY EMPTY: Awaiting matching ingress packets...
                    </td>
                  </tr>
                ) : (
                  filteredPackets.map(pkt => {
                    const isSuspicious = pkt.threatStatus === 'suspicious';
                    const isBlocked = pkt.threatStatus === 'blocked';
                    const isSelected = selectedPacket?.id === pkt.id;

                    let rowClass = 'hover:bg-white/5 border-b border-cyber-border/10 cursor-pointer transition-colors';
                    if (isSelected) {
                      rowClass = 'bg-cyber-neonGreen/10 border-b border-cyber-border/30 text-cyber-neonGreen cursor-pointer';
                    } else if (isSuspicious) {
                      rowClass = 'bg-cyber-neonRed/5 hover:bg-cyber-neonRed/10 border-b border-cyber-neonRed/20 text-cyber-neonRed cursor-pointer';
                    } else if (isBlocked) {
                      rowClass = 'bg-neutral-950/40 text-neutral-500 border-b border-cyber-border/5 cursor-pointer';
                    }

                    return (
                      <tr 
                        key={pkt.id} 
                        className={rowClass}
                        onClick={() => setSelectedPacket(pkt)}
                      >
                        <td className="p-3">
                          <span className={`px-1.5 py-0.5 rounded font-bold text-[8px] uppercase ${
                            pkt.protocol === 'TCP' ? 'bg-blue-950/40 text-blue-400 border border-blue-800/40' :
                            pkt.protocol === 'UDP' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/40' :
                            pkt.protocol === 'HTTP' ? 'bg-green-950/40 text-green-400 border border-green-800/40' :
                            'bg-slate-900/40 text-slate-400 border border-slate-700/40'
                          }`}>
                            {pkt.protocol}
                          </span>
                        </td>
                        <td className="p-3 font-semibold">{pkt.sourceIp}</td>
                        <td className="p-3 text-cyber-textMuted">{pkt.destIp}</td>
                        <td className="p-3 max-w-[200px] truncate font-light">
                          {pkt.signature}
                        </td>
                        <td className="p-3">
                          <span className={`flex items-center gap-1 font-bold ${
                            isBlocked ? 'text-neutral-500' :
                            isSuspicious ? 'text-cyber-neonRed' : 'text-cyber-neonGreen'
                          }`}>
                            {isBlocked ? <ShieldX className="w-3.5 h-3.5" /> :
                             isSuspicious ? <AlertOctagon className="w-3.5 h-3.5" /> : 
                             <ShieldCheck className="w-3.5 h-3.5" />}
                            <span className="uppercase text-[9px]">{pkt.threatStatus}</span>
                          </span>
                        </td>
                        <td className="p-3 text-right text-cyber-textMuted">
                          {new Date(pkt.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Packet Inspector (Right Side) */}
        <div className="glass-panel p-5 rounded-lg flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-cyber-border mb-4">
              <Terminal className="w-4 h-4 text-cyber-neonGreen" />
              <h4 className="text-xs text-white uppercase font-bold tracking-wider">
                Firewall Payload Inspector
              </h4>
            </div>

            {selectedPacket ? (
              <div className="space-y-4">
                {/* Connection metadata */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-cyber-dark/60 border border-cyber-border/20 rounded-lg">
                  <div>
                    <span className="text-[8px] text-cyber-textMuted block uppercase">SOURCE ADDRESS</span>
                    <span className="font-bold text-white text-[11px]">{selectedPacket.sourceIp}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-cyber-textMuted block uppercase">TARGET ADDR</span>
                    <span className="font-bold text-white text-[11px]">{selectedPacket.destIp}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-cyber-textMuted block uppercase">PROTOCOL</span>
                    <span className="font-mono text-cyber-neonCyan uppercase font-bold">{selectedPacket.protocol}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-cyber-textMuted block uppercase">FRAME LENGTH</span>
                    <span className="font-mono text-white">{selectedPacket.length} bytes</span>
                  </div>
                </div>

                {/* Threat description */}
                <div className={`p-3 rounded-lg border text-[10px] ${
                  selectedPacket.threatStatus === 'suspicious' 
                    ? 'bg-cyber-neonRed/10 border-cyber-neonRed/30 text-cyber-neonRed' 
                    : selectedPacket.threatStatus === 'blocked'
                    ? 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    : 'bg-cyber-neonGreen/10 border-cyber-neonGreen/20 text-cyber-neonGreen'
                }`}>
                  <span className="font-bold block uppercase tracking-wider mb-1">
                    Signature Rule Match:
                  </span>
                  {selectedPacket.signature}
                  {selectedPacket.threatStatus === 'suspicious' && (
                    <span className="block mt-2 font-bold text-[9px] uppercase">
                      Action Required: Firewall Isolation / IPS Rule Block
                    </span>
                  )}
                </div>

                {/* Raw Hex/Payload */}
                <div>
                  <span className="text-[9px] text-cyber-textMuted block uppercase mb-1 font-bold">
                    Raw Packet Data Payload:
                  </span>
                  <div className="p-3 bg-cyber-dark text-[10px] text-white font-mono rounded border border-cyber-border/20 max-h-48 overflow-y-auto break-all whitespace-pre-wrap leading-relaxed select-text select-all">
                    {selectedPacket.payload}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-cyber-textMuted">
                <Eye className="w-10 h-10 text-cyber-border/40 mb-3 animate-pulse" />
                <span className="text-[10px] uppercase tracking-wider font-mono">
                  Select a frame
                </span>
                <span className="text-[9px] text-cyber-textMuted/60 mt-1 max-w-[200px]">
                  Click on any connection packet row from ETH0 to analyze raw TCP/UDP hex header data.
                </span>
              </div>
            )}
          </div>

          {/* Action Footer (Block IP option) */}
          {selectedPacket && (
            <div className="pt-4 border-t border-cyber-border/30 mt-6 flex justify-between items-center">
              <div>
                <span className="text-[9px] text-cyber-textMuted block font-mono">IP BLACKLIST GATEWAY:</span>
                <span className="font-mono text-white text-[10px] font-bold">{selectedPacket.sourceIp}</span>
              </div>
              
              <button
                onClick={() => handleToggleBlock(
                  selectedPacket.sourceIp, 
                  `Identified payload matching signature: [${selectedPacket.signature}]`
                )}
                className={`px-4 py-2 text-xs font-mono rounded uppercase tracking-wider border transition-all duration-150 flex items-center gap-1.5 ${
                  blockedIPs.has(selectedPacket.sourceIp)
                    ? 'bg-cyber-neonGreen/10 hover:bg-cyber-neonGreen/20 border-cyber-neonGreen text-cyber-neonGreen'
                    : 'bg-cyber-neonRed/10 hover:bg-cyber-neonRed/20 border-cyber-neonRed text-cyber-neonRed'
                }`}
              >
                {blockedIPs.has(selectedPacket.sourceIp) ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Unblock IP</span>
                  </>
                ) : (
                  <>
                    <ShieldX className="w-3.5 h-3.5" />
                    <span>Block IP</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
export default NetworkFeedPage;
