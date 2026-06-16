import { useState, useMemo, Fragment } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { useSecurity } from '../../context/SecurityContext';
import { 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Cpu,
  ShieldX,
  History,
  Trash2,
  Play,
  Sliders,
  Database
} from 'lucide-react';

// Static payloads corpus containing specific packets requested by the user
const STATIC_CORPUS_PACKETS = [
  {
    id: 10001,
    timestamp: new Date(Date.now() - 60000 * 5).toISOString(),
    sourceIp: "192.168.1.105",
    destIp: "10.0.11.45",
    protocol: "HTTP",
    payload: "POST /auth/login - payload='admin_login_success' user='elena'",
    signature: "Administrative Console Access Authentication Event",
    threatStatus: "clean",
    severity: "none"
  },
  {
    id: 10002,
    timestamp: new Date(Date.now() - 60000 * 10).toISOString(),
    sourceIp: "185.220.101.5",
    destIp: "10.0.11.45",
    protocol: "HTTP",
    payload: "GET /admin123/config.php?read=true - Host validation request",
    signature: "Sensitive Directory Access Attempt",
    threatStatus: "suspicious",
    severity: "medium"
  },
  {
    id: 10003,
    timestamp: new Date(Date.now() - 60000 * 15).toISOString(),
    sourceIp: "10.0.1.200",
    destIp: "10.0.11.45",
    protocol: "HTTP",
    payload: "POST /api/v1/users/reset - body='password_reset_request&email=sarah.vance@cyberscope.io'",
    signature: "Credential Vault Administration Access Action",
    threatStatus: "clean",
    severity: "none"
  },
  {
    id: 10004,
    timestamp: new Date(Date.now() - 60000 * 20).toISOString(),
    sourceIp: "45.146.165.37",
    destIp: "10.0.11.45",
    protocol: "SSH",
    payload: "SSH-2.0-OpenSSH_8.2p1 - error: failed_login_attempt for user administrator",
    signature: "Brute Force SSH Session Attempt",
    threatStatus: "suspicious",
    severity: "high"
  },
  {
    id: 10005,
    timestamp: new Date(Date.now() - 60000 * 25).toISOString(),
    sourceIp: "193.106.191.8",
    destIp: "10.0.11.45",
    protocol: "TCP",
    payload: "TCP SYN Packet payload size=104 - alert: unauthorized_access to segment DMZ_PORTAL",
    signature: "Unauthorized Network Segment Ingress Attempt",
    threatStatus: "suspicious",
    severity: "high"
  },
  {
    id: 10006,
    timestamp: new Date(Date.now() - 60000 * 30).toISOString(),
    sourceIp: "91.240.4.12",
    destIp: "10.0.11.45",
    protocol: "HTTP",
    payload: "POST /search.php?q=1' UNION SELECT NULL, username, password FROM users -- sql_injection_detected",
    signature: "SQL Injection Database Vulnerability Scan Attempt",
    threatStatus: "suspicious",
    severity: "critical"
  },
  {
    id: 10007,
    timestamp: new Date(Date.now() - 60000 * 45).toISOString(),
    sourceIp: "192.168.1.110",
    destIp: "10.0.11.45",
    protocol: "HTTP",
    payload: "GET /index.html HTTP/1.1 - User Agent: Mozilla/5.0",
    signature: "Standard Web Traffic Asset Request",
    threatStatus: "clean",
    severity: "none"
  }
];

export const SecuritySearchPage = () => {
  const { packets } = useNetwork();
  const { hasPermission } = useSecurity();

  // Search input state
  const [regexQuery, setRegexQuery] = useState('(?i)admin|failed|password|sql');
  // Trigger options state
  const [realTime, setRealTime] = useState(true);
  const [searchSource, setSearchSource] = useState('live'); // 'live' or 'static'
  const [searchField, setSearchField] = useState('payload'); // 'payload', 'sourceIp', 'signature'
  const [filterProto, setFilterProto] = useState('All');
  const [matchCase, setMatchCase] = useState(false);

  // State triggered upon scan click (used when realTime is false)
  const [triggerQuery, setTriggerQuery] = useState('(?i)admin|failed|password|sql');
  const [triggerMatchCase, setTriggerMatchCase] = useState(false);

  // Row expand state
  const [expandedPacketId, setExpandedPacketId] = useState(null);

  // Search history state (persisted locally during session)
  const [searchHistory, setSearchHistory] = useState([
    'admin.*',
    '.*login.*',
    'password.*',
    'sql.*'
  ]);

  // Actual parameters to search with based on whether realTime is enabled
  const activeQuery = realTime ? regexQuery : triggerQuery;
  const activeMatchCase = realTime ? matchCase : triggerMatchCase;

  // Safe regex compile logic (useMemo prevents crash, handles user compile error alerts)
  const regexObject = useMemo(() => {
    if (!activeQuery.trim()) {
      return { regex: null, error: null };
    }

    try {
      let cleanQuery = activeQuery;
      let flags = activeMatchCase ? 'g' : 'gi';
      
      // Support inline (?i) flag removal for custom js engine compatibility
      if (activeQuery.startsWith('(?i)')) {
        cleanQuery = activeQuery.substring(4);
        flags = 'gi';
      }

      const regex = new RegExp(cleanQuery, flags);
      return { regex, error: null };
    } catch (err) {
      return { regex: null, error: err.message };
    }
  }, [activeQuery, activeMatchCase]);

  // Select packets dataset based on source toggled
  const currentDataset = useMemo(() => {
    return searchSource === 'live' ? packets : STATIC_CORPUS_PACKETS;
  }, [searchSource, packets]);

  // Perform search calculations
  const matchedPackets = useMemo(() => {
    if (regexObject.error || !regexObject.regex) {
      // If error or empty query, show all database entries
      return regexObject.error ? [] : currentDataset;
    }

    // Create a new regex instance without global flag for safe testing
    const testRegex = new RegExp(regexObject.regex.source, regexObject.regex.flags.replace('g', ''));

    return currentDataset.filter(pkt => {
      // Protocol Filter
      if (filterProto !== 'All' && pkt.protocol !== filterProto) {
        return false;
      }

      // Target field matching
      const targetText = pkt[searchField] || '';
      return testRegex.test(targetText);
    });
  }, [currentDataset, regexObject, searchField, filterProto]);

  // Highlight Text Helper (splits string and wraps matches in neon glowing tags)
  const highlightMatch = (text, regex) => {
    if (!regex || !text) return text;
    
    try {
      const parts = [];
      let lastIndex = 0;
      let match;

      // Duplicate regex to avoid modifying global state or infinite loops (especially with global flags)
      const searchRegex = new RegExp(regex.source, regex.flags);
      let iterations = 0;

      while ((match = searchRegex.exec(text)) !== null && iterations < 100) {
        iterations++;
        const matchIndex = match.index;
        const matchedText = match[0];

        if (matchedText.length === 0) {
          searchRegex.lastIndex++;
          continue;
        }

        // Add text before match
        if (matchIndex > lastIndex) {
          parts.push(text.substring(lastIndex, matchIndex));
        }

        // Add highlighted match
        parts.push(
          <span 
            key={`${matchIndex}-${iterations}`} 
            className="bg-cyber-neonRed/30 border border-cyber-neonRed/60 text-cyber-neonRed font-semibold px-0.5 rounded animate-pulse"
          >
            {matchedText}
          </span>
        );

        lastIndex = searchRegex.lastIndex;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }

      return parts.length > 0 ? parts : text;
    } catch {
      return text;
    }
  };

  const hasSearchPermission = hasPermission('run_regex_search');

  // Trigger search action manual execution
  const executeManualSearch = () => {
    setTriggerQuery(regexQuery);
    setTriggerMatchCase(matchCase);
    
    // Add to history list if it's new
    if (regexQuery.trim() && !searchHistory.includes(regexQuery.trim())) {
      setSearchHistory(prev => [regexQuery.trim(), ...prev].slice(0, 10));
    }
  };

  // Click history tag shortcut
  const handleHistoryClick = (query) => {
    setRegexQuery(query);
    if (!realTime) {
      setTriggerQuery(query);
      setTriggerMatchCase(matchCase);
    } else {
      // Add to history automatically if needed
      if (!searchHistory.includes(query)) {
        setSearchHistory(prev => [query, ...prev].slice(0, 10));
      }
    }
  };

  // Clear search input
  const clearQuery = () => {
    setRegexQuery('');
    if (!realTime) {
      setTriggerQuery('');
    }
  };

  // Clear history tags
  const clearHistory = () => {
    setSearchHistory([]);
  };

  // Add specific preset template search
  const setQuickSearch = (query, field = 'payload') => {
    setRegexQuery(query);
    setSearchField(field);
    if (!realTime) {
      setTriggerQuery(query);
    }
    // Automatically add template to search history
    if (!searchHistory.includes(query)) {
      setSearchHistory(prev => [query, ...prev].slice(0, 10));
    }
  };

  // Check live validation error for currently typed query
  const typingRegexObject = useMemo(() => {
    if (!regexQuery.trim()) {
      return { error: null };
    }
    try {
      let cleanQuery = regexQuery;
      let flags = matchCase ? 'g' : 'gi';
      if (regexQuery.startsWith('(?i)')) {
        cleanQuery = regexQuery.substring(4);
        flags = 'gi';
      }
      new RegExp(cleanQuery, flags);
      return { error: null };
    } catch (err) {
      return { error: err.message };
    }
  }, [regexQuery, matchCase]);

  return (
    <div className="space-y-6 font-mono text-xs select-none">
      
      {/* Search Input and Configuration Panel */}
      <div className="glass-panel p-5 rounded-lg space-y-4">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
            Payload Signature Search (PCRE Regular Expression Engine)
          </h4>
          <p className="text-[10px] text-cyber-textMuted">
            Perform regex pattern match scans on active Ethernet frame headers and payloads
          </p>
        </div>

        {/* Input box */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 w-4.5 h-4.5 text-cyber-textMuted" />
              <input
                type="text"
                placeholder="ENTER PCRE REGULAR EXPRESSION PATTERN (e.g. (?i)admin|select|failed)..."
                value={regexQuery}
                disabled={!hasSearchPermission}
                onChange={(e) => setRegexQuery(e.target.value)}
                className="w-full bg-cyber-dark border border-cyber-border/40 hover:border-cyber-border focus:border-cyber-neonGreen focus:outline-none pl-10 pr-10 py-3 rounded-lg text-white font-mono placeholder:text-cyber-textMuted font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              />
              {regexQuery && (
                <button
                  onClick={clearQuery}
                  className="absolute right-3 top-3 px-1.5 py-1 text-[9px] bg-cyber-dark hover:text-white border border-cyber-border/20 text-cyber-textMuted hover:border-cyber-border rounded"
                  title="Clear Input Query"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Run Search Manual Button */}
            {!realTime && (
              <button
                onClick={executeManualSearch}
                disabled={!hasSearchPermission || !!typingRegexObject.error}
                className="px-5 bg-cyber-neonCyan hover:bg-cyber-neonCyan/80 text-cyber-dark font-bold uppercase rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-cyber-neonCyan/10 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 fill-cyber-dark" />
                <span>Scan</span>
              </button>
            )}
          </div>

          {/* Validation indicators (Friendly user error displays) */}
          {regexQuery.trim() && (
            <div className="flex items-center gap-2">
              {typingRegexObject.error ? (
                <div className="flex items-center gap-2 text-cyber-neonRed bg-cyber-neonRed/10 border border-cyber-neonRed/20 p-2.5 rounded-lg w-full">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse" />
                  <div>
                    <span className="font-bold uppercase block text-[10px] mb-0.5">Regex Syntax Compilation Failed:</span>
                    <code className="text-[9px] text-white break-all">{typingRegexObject.error}</code>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-cyber-neonGreen bg-cyber-neonGreen/10 border border-cyber-neonGreen/20 px-3 py-1.5 rounded-lg text-[10px]">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Pattern validated successfully. Engine armed. {realTime ? "Streaming real-time results." : "Click 'Scan' to compile."}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configurations grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 border-t border-cyber-border/10">
          
          {/* Search Targets */}
          <div className="space-y-2">
            <h5 className="text-[9px] text-cyber-neonGreen uppercase font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Search Filters
            </h5>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-cyber-textMuted text-[10px]">Target:</span>
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                  className="flex-1 bg-cyber-dark border border-cyber-border/40 px-2 py-1 rounded text-white focus:outline-none cursor-pointer"
                >
                  <option value="payload">Raw Payload</option>
                  <option value="sourceIp">Source IP</option>
                  <option value="signature">Alert Rule</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-cyber-textMuted text-[10px]">Proto:</span>
                <select
                  value={filterProto}
                  onChange={(e) => setFilterProto(e.target.value)}
                  className="flex-1 bg-cyber-dark border border-cyber-border/40 px-2 py-1 rounded text-white focus:outline-none cursor-pointer"
                >
                  <option value="All">All</option>
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                  <option value="HTTP">HTTP</option>
                  <option value="SSH">SSH</option>
                </select>
              </div>
            </div>
          </div>

          {/* Database Source selection */}
          <div className="space-y-2">
            <h5 className="text-[9px] text-cyber-neonCyan uppercase font-bold flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              Source Corpus
            </h5>
            <div className="flex gap-2">
              <button
                onClick={() => setSearchSource('live')}
                className={`flex-1 py-1 px-2 border rounded font-bold uppercase transition-all ${
                  searchSource === 'live'
                    ? 'bg-cyber-neonCyan/10 border-cyber-neonCyan text-cyber-neonCyan shadow-md shadow-cyber-neonCyan/5'
                    : 'bg-cyber-dark border-cyber-border/30 text-cyber-textMuted hover:border-cyber-border'
                }`}
              >
                Live Packet Stream
              </button>
              <button
                onClick={() => setSearchSource('static')}
                className={`flex-1 py-1 px-2 border rounded font-bold uppercase transition-all ${
                  searchSource === 'static'
                    ? 'bg-cyber-neonCyan/10 border-cyber-neonCyan text-cyber-neonCyan shadow-md shadow-cyber-neonCyan/5'
                    : 'bg-cyber-dark border-cyber-border/30 text-cyber-textMuted hover:border-cyber-border'
                }`}
              >
                Static Threats Corpus
              </button>
            </div>
          </div>

          {/* Logic toggles */}
          <div className="flex flex-col justify-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-cyber-textMuted hover:text-white">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="rounded bg-cyber-dark border-cyber-border text-cyber-neonGreen focus:ring-0 cursor-pointer"
              />
              <span className="text-[10px]">Case Sensitive Matching</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-cyber-textMuted hover:text-white">
              <input
                type="checkbox"
                checked={realTime}
                onChange={(e) => setRealTime(e.target.checked)}
                className="rounded bg-cyber-dark border-cyber-border text-cyber-neonGreen focus:ring-0 cursor-pointer"
              />
              <span className="text-[10px]">Real-Time Scan (Compile on keystroke)</span>
            </label>
          </div>

        </div>
      </div>

      {/* Preset Library & Search History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Preset Library */}
        <div className="glass-panel p-4 rounded-lg space-y-3">
          <h5 className="text-[10px] text-cyber-textMuted uppercase font-bold tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyber-neonGreen" />
            Pre-Compiled Threat Signatures
          </h5>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setQuickSearch("(?i)admin|or\\s+'1'='1'|select", 'payload')}
              className="px-2.5 py-1.5 bg-cyber-dark border border-cyber-border/40 hover:border-cyber-neonGreen text-white rounded font-mono text-[9px] transition-all"
            >
              SQL Injection Filter
            </button>
            <button
              onClick={() => setQuickSearch("<script>|javascript:|alert\\(", 'payload')}
              className="px-2.5 py-1.5 bg-cyber-dark border border-cyber-border/40 hover:border-cyber-neonGreen text-white rounded font-mono text-[9px] transition-all"
            >
              XSS Attack Filter
            </button>
            <button
              onClick={() => setQuickSearch("\\\\x90\\\\x90|\\\\x41\\\\x41", 'payload')}
              className="px-2.5 py-1.5 bg-cyber-dark border border-cyber-border/40 hover:border-cyber-neonGreen text-white rounded font-mono text-[9px] transition-all"
            >
              Buffer NOP Sled
            </button>
            <button
              onClick={() => setQuickSearch("admin.*|failed_login|password.*", 'payload')}
              className="px-2.5 py-1.5 bg-cyber-dark border border-cyber-border/40 hover:border-cyber-neonGreen text-white rounded font-mono text-[9px] transition-all"
            >
              Auth Failure Scan
            </button>
          </div>
        </div>

        {/* Search Query History */}
        <div className="glass-panel p-4 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <h5 className="text-[10px] text-cyber-textMuted uppercase font-bold tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-cyber-neonCyan" />
              Query Audit History
            </h5>
            {searchHistory.length > 0 && (
              <button 
                onClick={clearHistory}
                className="text-cyber-neonRed hover:underline flex items-center gap-0.5 text-[8px] uppercase font-bold"
              >
                <Trash2 className="w-2.5 h-2.5" />
                Clear Logs
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-12 overflow-y-auto pr-1">
            {searchHistory.length === 0 ? (
              <span className="text-[9px] text-cyber-textMuted italic">No search log history recorded in this session.</span>
            ) : (
              searchHistory.map((hist, idx) => (
                <button
                  key={`${hist}-${idx}`}
                  onClick={() => handleHistoryClick(hist)}
                  className="px-2 py-0.5 bg-cyber-dark border border-cyber-border/20 text-cyber-neonCyan hover:border-cyber-neonCyan hover:bg-cyber-neonCyan/5 rounded text-[9px] font-semibold transition-all max-w-[150px] truncate"
                  title={`Click to load: "${hist}"`}
                >
                  {hist}
                </button>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Match Results list */}
      <div className="glass-panel rounded-lg overflow-hidden">
        
        <div className="bg-cyber-dark/80 px-4 py-3 border-b border-cyber-border flex justify-between items-center text-[10px] text-cyber-textMuted font-bold uppercase">
          <span className="text-white">
            Matches Identified: <span className="text-cyber-neonCyan font-bold neon-glow-cyan text-xs">{matchedPackets.length}</span>
          </span>
          <span className="text-[9px]">
            Engine Scope: {searchSource === 'live' ? "Live Telemetry Feed" : "Static Threats DB"}
          </span>
        </div>

        {/* Results table */}
        <div className="max-h-[480px] overflow-y-auto">
          {!hasSearchPermission ? (
            <div className="flex flex-col items-center justify-center py-20 text-cyber-neonRed font-mono">
              <ShieldX className="w-12 h-12 mb-3 animate-pulse" />
              <span className="font-bold text-sm uppercase">Access Denied</span>
              <span className="text-[10px] text-cyber-textMuted mt-1">
                Your current operator role privileges (Viewer) deny payload regex search access.
              </span>
            </div>
          ) : matchedPackets.length === 0 ? (
            <div className="text-center py-20 text-cyber-textMuted">
              &gt; SCAN COMPLETED: 0 frames match the current regex query.
            </div>
          ) : (
            <div className="overflow-x-auto p-2">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-cyber-border/20 text-cyber-textMuted text-[9px] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">Packet ID</th>
                    <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                    <th className="py-2.5 px-4 font-semibold">Source IP</th>
                    <th className="py-2.5 px-4 font-semibold">Protocol</th>
                    <th className="py-2.5 px-4 font-semibold">Threat Level</th>
                    <th className="py-2.5 px-4 font-semibold">Matched Content (Payload)</th>
                  </tr>
                </thead>
                <tbody>
                  {matchedPackets.map(pkt => {
                    const isThreat = pkt.severity === 'critical' || pkt.severity === 'high' || pkt.threatStatus === 'suspicious';
                    const isExpanded = expandedPacketId === pkt.id;
                    
                    return (
                      <Fragment key={pkt.id}>
                        <tr 
                          onClick={() => setExpandedPacketId(prev => prev === pkt.id ? null : pkt.id)}
                          className={`border-b border-cyber-border/10 hover:bg-white/5 transition-colors cursor-pointer ${
                            isExpanded ? 'bg-cyber-neonCyan/5' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-bold text-cyber-neonCyan">#{pkt.id}</td>
                          <td className="py-3 px-4 text-cyber-textMuted">{new Date(pkt.timestamp).toLocaleTimeString()}</td>
                          <td className="py-3 px-4 font-semibold text-slate-200">
                            {highlightMatch(pkt.sourceIp, searchField === 'sourceIp' ? regexObject.regex : null)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-1.5 py-0.5 bg-cyber-dark border border-cyber-border/30 rounded text-[9px] font-bold text-cyber-neonCyan">
                              {pkt.protocol}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                              isThreat
                                ? 'bg-cyber-neonRed/10 border-cyber-neonRed/30 text-cyber-neonRed shadow-md shadow-cyber-neonRed/5'
                                : 'bg-cyber-neonGreen/10 border-cyber-neonGreen/20 text-cyber-neonGreen'
                            }`}>
                              {pkt.severity !== 'none' ? pkt.severity : pkt.threatStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono max-w-xs md:max-w-md lg:max-w-lg truncate">
                            <div className="bg-cyber-dark/40 border border-cyber-border/10 p-1.5 rounded text-[10px] overflow-hidden text-ellipsis whitespace-nowrap">
                              {highlightMatch(pkt.payload, searchField === 'payload' ? regexObject.regex : null)}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-cyber-dark/30 border-b border-cyber-border/10 animate-in slide-in-from-top duration-200">
                            <td colSpan={6} className="py-3 px-4">
                              <div className="space-y-2">
                                <div className="text-[10px] text-cyber-textMuted">
                                  <span className="text-white font-bold">Rule Signature: </span>
                                  {highlightMatch(pkt.signature, searchField === 'signature' ? regexObject.regex : null)}
                                </div>
                                <div>
                                  <span className="text-[9px] text-cyber-textMuted block uppercase mb-1 font-bold">Full Payload Data:</span>
                                  <div className="bg-cyber-dark/80 border border-cyber-border/15 p-2.5 rounded text-[10px] font-mono whitespace-pre-wrap break-all leading-relaxed select-text shadow-inner">
                                    {highlightMatch(pkt.payload, searchField === 'payload' ? regexObject.regex : null)}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default SecuritySearchPage;
