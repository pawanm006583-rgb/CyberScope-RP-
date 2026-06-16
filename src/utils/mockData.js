// Cybersecurity Mock Data Generator

// Protocols used in simulation
export const PROTOCOLS = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'SSH', 'DNS', 'FTP', 'SMTP', 'TLS'];

// Suspect payloads for Regex search testing
export const ATTACK_PAYLOADS = [
  { payload: "GET /admin/config.php?user=admin' OR '1'='1", signature: "SQL Injection Attack", threat: "critical" },
  { payload: "POST /upload.php Payload: \\x90\\x90\\x90\\x90\\xeb\\x1f\\x5e\\x89\\x76", signature: "NOP Sled Buffer Overflow Attempt", threat: "critical" },
  { payload: "GET /cgi-bin/status.cgi?cmd=rm%20-rf%20/", signature: "Remote Code Execution (RCE)", threat: "critical" },
  { payload: "CONNECT 10.0.0.1:22 SSH-2.0-OpenSSH_8.2p1 brute-force-guess", signature: "SSH Brute-Force Authentication Attempt", threat: "high" },
  { payload: "GET /?q=<script>alert(document.cookie)</script> HTTP/1.1", signature: "Cross-Site Scripting (XSS) Injection", threat: "high" },
  { payload: "DNS Query: v2-x0f9a72d.c2-server.botnet.ru TXT RECORD", signature: "DNS Tunneling Botnet Activity (C2)", threat: "high" },
  { payload: "SYN Packet Flood - Source Ports: [49221, 49222, 49223, 49224]", signature: "TCP SYN Flood DoS Attempt", threat: "high" },
  { payload: "GET /wp-content/plugins/wp-file-manager/readme.txt", signature: "WordPress Vulnerability Directory Scanning", threat: "medium" },
  { payload: "ICMP Echo Request (Ping) size=65507 (oversized)", signature: "Ping of Death Reconnaissance", threat: "medium" },
  { payload: "POST /api/v1/auth/login User: admin Pass: root123", signature: "Weak Credentials Brute Force Action", threat: "medium" },
  { payload: "GET /assets/logo.png Host: cyberscope.io", signature: "Standard HTTP GET Asset Request", threat: "none" },
  { payload: "TLS Client Hello - Version: 1.3 Cipher: TLS_AES_256_GCM_SHA384", signature: "Normal Encrypted HTTPS Connection", threat: "none" },
  { payload: "DNS Query: google.com Type: A", signature: "Standard Public DNS Resolution", threat: "none" },
  { payload: "SSH Session Disconnect - User: elena.rostova Connection closed", signature: "Authorized SSH Session Close", threat: "none" }
];

// Helper to generate a random IP address
export const generateRandomIP = (isSuspicious = false) => {
  if (isSuspicious) {
    const maliciousSubnets = ['185.220.', '45.146.', '193.106.', '82.102.', '91.240.'];
    const subnet = maliciousSubnets[Math.floor(Math.random() * maliciousSubnets.length)];
    return subnet + Math.floor(Math.random() * 254 + 1) + '.' + Math.floor(Math.random() * 254 + 1);
  }
  return (
    Math.floor(Math.random() * 223 + 1) + '.' +
    Math.floor(Math.random() * 255) + '.' +
    Math.floor(Math.random() * 255) + '.' +
    Math.floor(Math.random() * 254 + 1)
  );
};

// Generates an individual packet
export const generatePacket = (id = Date.now()) => {
  const isSuspicious = Math.random() < 0.25; // 25% chance of suspicious packet
  const payloadObj = ATTACK_PAYLOADS[Math.floor(Math.random() * ATTACK_PAYLOADS.length)];
  
  // Align suspicious threat status with payloadObj if payload is malicious
  let threatStatus = 'clean';
  let severity = 'low';
  if (isSuspicious && payloadObj.threat !== 'none') {
    threatStatus = 'suspicious';
    severity = payloadObj.threat;
  } else if (payloadObj.threat !== 'none') {
    threatStatus = 'suspicious';
    severity = payloadObj.threat;
  }

  const srcIp = isSuspicious ? generateRandomIP(true) : generateRandomIP(false);
  const destIp = '10.0.11.45'; // Our SOC local gateway target IP

  return {
    id,
    timestamp: new Date().toISOString(),
    sourceIp: srcIp,
    destIp: destIp,
    protocol: PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)],
    payload: payloadObj.payload,
    signature: payloadObj.threat !== 'none' ? payloadObj.signature : 'Standard Traffic Flow',
    threatStatus,
    severity,
    length: Math.floor(Math.random() * 1400) + 64
  };
};

// Generates an initial list of 30 packets for the history
export const generateInitialPackets = (count = 30) => {
  const list = [];
  const baseTime = Date.now();
  for (let i = 0; i < count; i++) {
    // Generate timestamps backward
    list.push(generatePacket(baseTime - i * 2000));
  }
  return list;
};

// Generate initial threat history graph data
export const generateThreatTrendData = (days = 7) => {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Add realistic numbers that follow a pattern with random fluctuations
    const total = Math.floor(Math.random() * 3000) + 4000;
    const blocked = Math.floor(total * (0.05 + Math.random() * 0.03));
    const critical = Math.floor(blocked * (0.15 + Math.random() * 0.1));
    const scans = Math.floor(total * (0.4 + Math.random() * 0.15));

    data.push({
      name: dateStr,
      'Total Packets': total,
      'Blocked Requests': blocked,
      'Critical Alerts': critical,
      'Port Scans Detected': scans
    });
  }
  return data;
};

// Generates 50,000+ Blacklisted IP Addresses
// To prevent performance bottlenecks, we generate this once in memory or lazily.
// Here we generate it in a dedicated class that runs efficiently.
export class BlacklistDataEngine {
  constructor() {
    this.list = [];
    this.reasons = [
      'C2 Botnet Controller Node',
      'Distributed Denial of Service (DDoS) Source',
      'Compromised IoT Node',
      'SSH Brute-Force Bot Node',
      'Spam/Phishing Email Relayer',
      'Known Ransomware Distribution Server',
      'Tor Exit Node (Malicious Associated)',
      'Web Application Vulnerability Scanner',
      'Cryptocurrency Miner Pool proxy',
      'Anonymous Proxy IP Address'
    ];
    this.countries = ['RU', 'CN', 'US', 'NL', 'UA', 'KP', 'BR', 'IR', 'RO', 'SG'];
    this.generateBlacklist(52000);
  }

  generateBlacklist(count) {
    console.time('Generate 50k IP Blacklist');
    const temp = new Array(count);
    // Fixed seed values to make it mock-realistic but fast
    for (let i = 0; i < count; i++) {
      // Create repeatable subnet groups
      const octet1 = (i % 200) + 15;
      const octet2 = ((i * 3) % 254) + 1;
      const octet3 = ((i * 7) % 254) + 1;
      const octet4 = (i % 254) + 1;
      const ip = `${octet1}.${octet2}.${octet3}.${octet4}`;

      const reason = this.reasons[i % this.reasons.length];
      const country = this.countries[i % this.countries.length];
      const confidence = 65 + (i % 35); // Confidence score 65-99%
      const status = i % 15 === 0 ? 'Active Alert' : 'Blocked';
      const timestamp = new Date(Date.now() - (i % 24) * 3600000 - (i % 60) * 60000).toISOString();

      temp[i] = {
        id: i + 1,
        ip,
        reason,
        country,
        confidence,
        status,
        timestamp
      };
    }
    this.list = temp;
    console.timeEnd('Generate 50k IP Blacklist');
  }

  // Optimized Search method
  search(query, statusFilter, minConfidence) {
    if (!query && statusFilter === 'All' && minConfidence === 0) {
      return this.list;
    }

    const lowerQuery = query.toLowerCase().trim();
    const matchesQuery = (item) => {
      if (!lowerQuery) return true;
      return (
        item.ip.includes(lowerQuery) ||
        item.reason.toLowerCase().includes(lowerQuery) ||
        item.country.toLowerCase().includes(lowerQuery)
      );
    };

    const matchesStatus = (item) => {
      if (statusFilter === 'All') return true;
      return item.status === statusFilter;
    };

    const matchesConfidence = (item) => {
      return item.confidence >= minConfidence;
    };

    return this.list.filter(item => matchesQuery(item) && matchesStatus(item) && matchesConfidence(item));
  }
}

// Instantiate singleton
export const blacklistEngine = new BlacklistDataEngine();
