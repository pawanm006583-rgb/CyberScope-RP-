import { useState, useMemo } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { blacklistEngine } from '../../utils/mockData';
import { VirtualTable } from '../VirtualTable';
import { 
  Search, 
  ShieldAlert, 
  Trash2, 
  Plus, 
  Database,
  SlidersHorizontal
} from 'lucide-react';

export const BlacklistExplorerPage = () => {
  const { toggleIPBlock } = useSecurity();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [minConfidence, setMinConfidence] = useState(0);
  const [selectedIpRecord, setSelectedIpRecord] = useState(null);

  // New IP entry form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [newReason, setNewReason] = useState('Known C2 Controller Server');
  const [newCountry, setNewCountry] = useState('RU');

  // Filter 52,000 IPs using our engine.
  // Because it returns the list, we filter it efficiently.
  const searchResults = useMemo(() => {
    let list = blacklistEngine.search(searchQuery, statusFilter, minConfidence);
    if (countryFilter !== 'All') {
      list = list.filter(item => item.country === countryFilter);
    }
    return list;
  }, [searchQuery, statusFilter, countryFilter, minConfidence]);

  const handleToggleBlock = (ip, reason) => {
    const res = toggleIPBlock(ip, reason);
    if (res.success) {
      // If we are unblocking, also update our local selected record details
      if (selectedIpRecord && selectedIpRecord.ip === ip) {
        setSelectedIpRecord(null);
      }
    } else {
      alert(res.error);
    }
  };

  const handleAddNewIp = (e) => {
    e.preventDefault();
    if (!newIp.trim()) return;

    // Simple IP Regex Validation
    const ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipPattern.test(newIp.trim())) {
      alert('Please enter a valid IPv4 address.');
      return;
    }

    const res = toggleIPBlock(newIp.trim(), newReason);
    if (res.success) {
      // Prepend to engine blacklist for simulation
      blacklistEngine.list.unshift({
        id: Date.now(),
        ip: newIp.trim(),
        reason: newReason,
        country: newCountry,
        confidence: 99,
        status: 'Blocked',
        timestamp: new Date().toISOString()
      });
      
      setNewIp('');
      setShowAddForm(false);
      alert(`IP ${newIp} added to active firewall blacklist.`);
    } else {
      alert(res.error);
    }
  };

  // Render function for VirtualTable rows
  const renderRow = (item) => {
    const isSelected = selectedIpRecord?.ip === item.ip;

    return (
      <div
        key={item.ip}
        onClick={() => setSelectedIpRecord(item)}
        className={`flex items-center text-[11px] font-mono border-b border-cyber-border/10 cursor-pointer h-12 hover:bg-white/5 transition-colors ${
          isSelected 
            ? 'bg-cyber-neonGreen/10 border-b border-cyber-border/30 text-cyber-neonGreen' 
            : 'text-cyber-textMuted'
        }`}
      >
        <div className="w-16 px-4 truncate text-[9px] text-cyber-textMuted/60">
          #{item.id}
        </div>
        <div className="w-32 px-2 font-bold text-white truncate">
          {item.ip}
        </div>
        <div className="w-16 px-2 truncate text-center text-white">
          <span className="px-1.5 py-0.5 bg-cyber-dark border border-cyber-border/20 rounded">
            {item.country}
          </span>
        </div>
        <div className="flex-1 px-2 truncate text-left text-white font-light">
          {item.reason}
        </div>
        <div className="w-24 px-2 hidden sm:block">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[10px] w-6">{item.confidence}%</span>
            <div className="flex-1 bg-cyber-dark h-1.5 rounded-full overflow-hidden border border-cyber-border/25">
              <div 
                className={`h-full rounded-full ${
                  item.confidence > 85 ? 'bg-cyber-neonRed' : 'bg-cyber-neonYellow'
                }`}
                style={{ width: `${item.confidence}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="w-24 px-2 text-center">
          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
            item.status === 'Active Alert'
              ? 'bg-cyber-neonRed/10 border border-cyber-neonRed/30 text-cyber-neonRed'
              : 'bg-neutral-900 border border-neutral-700 text-neutral-400'
          }`}>
            {item.status}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-mono text-xs select-none">
      
      {/* Search and Filters panel */}
      <div className="glass-panel p-5 rounded-lg space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
              Global Threat Database Explorer
            </h4>
            <p className="text-[10px] text-cyber-textMuted">
              Inspect, query and inject IP firewall bans across 52,000+ C2 list mappings
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyber-neonGreen/10 border border-cyber-neonGreen hover:bg-cyber-neonGreen/20 text-cyber-neonGreen rounded uppercase tracking-wider transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Ban IP</span>
          </button>
        </div>

        {/* Add IP Form */}
        {showAddForm && (
          <form onSubmit={handleAddNewIp} className="p-4 bg-cyber-dark/60 border border-cyber-border/30 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[9px] text-cyber-textMuted block mb-1">IPV4 ADDRESS</label>
              <input
                type="text"
                placeholder="e.g. 195.201.21.34"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                className="w-full bg-cyber-dark border border-cyber-border/40 hover:border-cyber-border focus:border-cyber-neonGreen focus:outline-none px-3 py-1.5 rounded text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[9px] text-cyber-textMuted block mb-1">BAN REASON</label>
              <select
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                className="w-full bg-cyber-dark border border-cyber-border/40 px-3 py-1.5 rounded text-white font-mono cursor-pointer"
              >
                <option value="C2 Botnet Controller Node">C2 Botnet Controller Node</option>
                <option value="SSH Brute-Force Bot Node">SSH Brute-Force Bot Node</option>
                <option value="Web App Vulnerability Scanner">Web App Vulnerability Scanner</option>
                <option value="DDoS Attack Server Source">DDoS Attack Server Source</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] text-cyber-textMuted block mb-1">COUNTRY CODE</label>
              <select
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                className="w-full bg-cyber-dark border border-cyber-border/40 px-3 py-1.5 rounded text-white font-mono cursor-pointer"
              >
                <option value="RU">RU (Russia)</option>
                <option value="CN">CN (China)</option>
                <option value="US">US (United States)</option>
                <option value="UA">UA (Ukraine)</option>
                <option value="KP">KP (North Korea)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-1.5 bg-cyber-neonGreen text-cyber-dark hover:bg-cyber-neonGreen/80 font-bold uppercase rounded transition-colors"
              >
                Commit ban Rule
              </button>
            </div>
          </form>
        )}

        {/* Query options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-cyber-textMuted" />
            <input
              type="text"
              placeholder="QUERY IP / SIGNATURE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-cyber-dark/80 border border-cyber-border/40 hover:border-cyber-border/80 focus:border-cyber-neonGreen focus:outline-none pl-9 pr-3 py-2 rounded-lg text-white font-mono placeholder:text-cyber-textMuted"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-cyber-textMuted">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 bg-cyber-dark border border-cyber-border/40 px-3 py-2 rounded-lg text-cyber-textMuted hover:text-white cursor-pointer focus:outline-none font-mono"
            >
              <option value="All">All Items</option>
              <option value="Blocked">Blocked</option>
              <option value="Active Alert">Active Alert</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-cyber-textMuted">Geo:</span>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="flex-1 bg-cyber-dark border border-cyber-border/40 px-3 py-2 rounded-lg text-cyber-textMuted hover:text-white cursor-pointer focus:outline-none font-mono"
            >
              <option value="All">All Registries</option>
              <option value="RU">RU - Russia</option>
              <option value="CN">CN - China</option>
              <option value="US">US - USA</option>
              <option value="UA">UA - Ukraine</option>
              <option value="KP">KP - N. Korea</option>
              <option value="US">US - USA</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyber-textMuted" />
            <span className="text-cyber-textMuted text-[10px] whitespace-nowrap">Min Confidence:</span>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="range"
                min="0"
                max="95"
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                className="w-full accent-cyber-neonGreen bg-cyber-dark"
              />
              <span className="text-white font-bold w-8 text-right">{minConfidence}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database stats & Virtual Table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Table container (Left) */}
        <div className="glass-panel rounded-lg overflow-hidden xl:col-span-2">
          <div className="bg-cyber-dark/80 px-4 py-3 border-b border-cyber-border flex justify-between items-center text-[10px] text-cyber-textMuted font-bold uppercase">
            <span>DATABASE RESULT FEED: {searchResults.length.toLocaleString()} RECORDS MATCHED</span>
            <span>INDEX SIZE: 52,000 IPs</span>
          </div>

          {/* Virtual Scroll container */}
          <div className="p-2">
            <div className="flex items-center text-[9px] uppercase tracking-widest text-cyber-textMuted border-b border-cyber-border/20 py-2 font-bold px-4">
              <div className="w-16">ID</div>
              <div className="w-32">IP Address</div>
              <div className="w-16 text-center">Geo Registry</div>
              <div className="flex-1 text-left">Incident Signature</div>
              <div className="w-24 hidden sm:block">Confidence</div>
              <div className="w-24 text-center">Status</div>
            </div>

            <VirtualTable
              items={searchResults}
              rowHeight={48}
              viewportHeight={460}
              renderRow={renderRow}
            />
          </div>
        </div>

        {/* IP Node Inspector (Right) */}
        <div className="glass-panel p-5 rounded-lg flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-cyber-border mb-4">
              <Database className="w-4 h-4 text-cyber-neonGreen" />
              <h4 className="text-xs text-white uppercase font-bold tracking-wider">
                Threat intelligence Node Details
              </h4>
            </div>

            {selectedIpRecord ? (
              <div className="space-y-4">
                <div className="p-3 bg-cyber-dark border border-cyber-border/20 rounded-lg">
                  <span className="text-[8px] text-cyber-textMuted block uppercase">BLOCKED NODE IP</span>
                  <span className="text-lg font-mono font-extrabold text-white">{selectedIpRecord.ip}</span>
                </div>

                <div className="space-y-2.5 text-[10px]">
                  <div className="flex justify-between border-b border-cyber-border/15 pb-1">
                    <span className="text-cyber-textMuted">Confidence Rating:</span>
                    <span className="font-bold text-cyber-neonRed">{selectedIpRecord.confidence}% Verified</span>
                  </div>
                  <div className="flex justify-between border-b border-cyber-border/15 pb-1">
                    <span className="text-cyber-textMuted">Registry Country:</span>
                    <span className="font-bold text-white">{selectedIpRecord.country} Registry</span>
                  </div>
                  <div className="flex justify-between border-b border-cyber-border/15 pb-1">
                    <span className="text-cyber-textMuted">Incident Reason:</span>
                    <span className="font-bold text-white text-right max-w-[150px] truncate">{selectedIpRecord.reason}</span>
                  </div>
                  <div className="flex justify-between border-b border-cyber-border/15 pb-1">
                    <span className="text-cyber-textMuted">First Detection:</span>
                    <span className="font-mono text-cyber-textMuted">{new Date(selectedIpRecord.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="p-3 bg-cyber-neonRed/5 border border-cyber-neonRed/15 rounded text-[10px] leading-relaxed text-cyber-neonRed">
                  <span className="font-bold block uppercase mb-1">Threat Assessment:</span>
                  Node exhibits patterns matching botnet proxy networks or command hosts. Automatically added to global SOC deflection block rules.
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-cyber-textMuted">
                <ShieldAlert className="w-10 h-10 text-cyber-border/40 mb-3" />
                <span className="text-[10px] uppercase tracking-wider font-mono">
                  Select an IP Node
                </span>
                <span className="text-[9px] text-cyber-textMuted/60 mt-1 max-w-[200px]">
                  Click on any listed record from the database to examine host analytics and manage network access privileges.
                </span>
              </div>
            )}
          </div>

          {/* Action Footer */}
          {selectedIpRecord && (
            <div className="pt-4 border-t border-cyber-border/30 mt-6 flex justify-between items-center">
              <div>
                <span className="text-[8px] text-cyber-textMuted block">PRIVILEGE ACTION:</span>
                <span className="text-[10px] font-bold text-white uppercase">{selectedIpRecord.status}</span>
              </div>

              <button
                onClick={() => handleToggleBlock(
                  selectedIpRecord.ip, 
                  `Removed IP Node rule from blacklisted directory.`
                )}
                className="px-4 py-2 bg-cyber-neonRed/10 hover:bg-cyber-neonRed/20 border border-cyber-neonRed text-cyber-neonRed text-xs font-mono rounded uppercase tracking-wider transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Ban</span>
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
export default BlacklistExplorerPage;
