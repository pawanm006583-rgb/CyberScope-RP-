/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { generatePacket, generateInitialPackets } from '../utils/mockData';
import { useSecurity } from './SecurityContext';

const NetworkContext = createContext();

// Static initial seed packets, alerts and metrics generated outside render to avoid purity & cascading state errors
const INITIAL_PACKET_LIST = generateInitialPackets(40);

const INITIAL_ALERT_LIST = (() => {
  const list = [];
  INITIAL_PACKET_LIST.forEach((p, idx) => {
    if (p.threatStatus === 'suspicious') {
      list.push({
        id: `alert-${idx}-${p.id}`,
        timestamp: p.timestamp,
        sourceIp: p.sourceIp,
        destIp: p.destIp,
        protocol: p.protocol,
        signature: p.signature,
        severity: p.severity,
        packetId: p.id,
        status: idx % 4 === 0 ? 'Acknowledged' : idx % 5 === 0 ? 'False Positive' : 'New',
        payload: p.payload
      });
    }
  });
  return list;
})();

const INITIAL_METRICS = (() => {
  let critical = 0, high = 0, medium = 0, low = 0, clean = 0;
  INITIAL_PACKET_LIST.forEach(p => {
    if (p.threatStatus === 'clean') clean++;
    else {
      if (p.severity === 'critical') critical++;
      else if (p.severity === 'high') high++;
      else if (p.severity === 'medium') medium++;
      else low++;
    }
  });
  return {
    totalProcessed: INITIAL_PACKET_LIST.length,
    criticalCount: critical,
    highCount: high,
    mediumCount: medium,
    lowCount: low,
    cleanCount: clean
  };
})();

export const NetworkProvider = ({ children }) => {
  const { blockedIPs, logActivity, hasPermission, setThreatScore } = useSecurity();
  
  // Packets state - keep up to 150 packets in memory
  const [packets, setPackets] = useState(INITIAL_PACKET_LIST);
  
  // Alert queue state - alerts that require triage/acknowledgment
  const [alerts, setAlerts] = useState(INITIAL_ALERT_LIST);
  
  // Simulation speed (ms per packet). Default 1000ms.
  const [simSpeed, setSimSpeed] = useState(1000);
  const [isSimulating, setIsSimulating] = useState(true);
  
  // Track metrics
  const [metrics, setMetrics] = useState(INITIAL_METRICS);

  const simIntervalRef = useRef(null);

  // Process a new single packet
  const processNewPacket = useCallback((newPacket) => {
    // If the source IP of the packet is in blockedIPs list, mark it as blocked/dropped automatically
    const isBlocked = blockedIPs.has(newPacket.sourceIp);
    
    let processedPacket = { ...newPacket };
    if (isBlocked) {
      processedPacket.threatStatus = 'blocked';
      processedPacket.signature = `BLOCKED TRAFFIC - ${newPacket.signature}`;
    }

    setPackets(prev => {
      const updated = [processedPacket, ...prev];
      return updated.slice(0, 150); // Hard limit to prevent DOM bloat
    });

    // Update metrics
    setMetrics(prev => {
      let isCritical = processedPacket.severity === 'critical';
      let isHigh = processedPacket.severity === 'high';
      let isMedium = processedPacket.severity === 'medium';
      let isLow = processedPacket.severity === 'low';
      let isClean = processedPacket.threatStatus === 'clean';

      return {
        totalProcessed: prev.totalProcessed + 1,
        criticalCount: prev.criticalCount + (isCritical && !isBlocked ? 1 : 0),
        highCount: prev.highCount + (isHigh && !isBlocked ? 1 : 0),
        mediumCount: prev.mediumCount + (isMedium && !isBlocked ? 1 : 0),
        lowCount: prev.lowCount + (isLow && !isBlocked ? 1 : 0),
        cleanCount: prev.cleanCount + (isClean || isBlocked ? 1 : 0),
      };
    });

    // If suspicious and not already blocked, push to Alert Queue
    if (processedPacket.threatStatus === 'suspicious' && !isBlocked) {
      const newAlert = {
        id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: processedPacket.timestamp,
        sourceIp: processedPacket.sourceIp,
        destIp: processedPacket.destIp,
        protocol: processedPacket.protocol,
        signature: processedPacket.signature,
        severity: processedPacket.severity,
        packetId: processedPacket.id,
        status: 'New',
        payload: processedPacket.payload
      };

      setAlerts(prev => [newAlert, ...prev].slice(0, 200)); // Limit active alerts queue
    }
  }, [blockedIPs]);

  // Run the live simulator
  useEffect(() => {
    if (isSimulating) {
      simIntervalRef.current = setInterval(() => {
        const p = generatePacket();
        processNewPacket(p);
      }, simSpeed);
    } else {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    }

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isSimulating, simSpeed, processNewPacket]);

  // Action: Trigger massive DDOS Attack / Alert burst (Simulate large volumes)
  // Generates 250+ packets in under 1 second, queues 40+ alerts, and shows queue capacity.
  const triggerAttackBurst = () => {
    if (!hasPermission('trigger_alert')) {
      logActivity('Attempted to trigger attack simulation but permission was denied', 'System', 'high');
      return { success: false, error: 'Access Denied: Permissions required to run simulation tests.' };
    }

    setIsSimulating(false); // Pause default ticker momentarily
    logActivity('MASSIVE EXTERNAL THREAT BURST INITIATED (SIMULATION)', 'System', 'critical');
    
    // Generate packets rapidly
    const burstPackets = [];
    const burstAlerts = [];
    const baseTime = Date.now();

    for (let i = 0; i < 200; i++) {
      // Rapid random packets
      const isSuspicious = Math.random() < 0.6; // High percentage of attacks
      const srcIp = isSuspicious ? generateRandomIP(true) : generateRandomIP(false);
      
      let protocol = 'TCP';
      let payload = 'SYN Flood payload size=0';
      let signature = 'TCP SYN Flood DoS Attack';
      let severity = 'high';
      let threatStatus = 'suspicious';

      if (i % 5 === 0) {
        protocol = 'UDP';
        payload = 'UDP Traffic burst on random high port';
        signature = 'UDP Flood Traffic';
        severity = 'medium';
      } else if (i % 8 === 0) {
        protocol = 'HTTP';
        payload = 'GET /wp-login.php HTTP/1.1 - Bot Agent brute force';
        signature = 'Brute Force login attempt';
        severity = 'critical';
      }

      const isBlocked = blockedIPs.has(srcIp);
      if (isBlocked) {
        threatStatus = 'blocked';
        signature = `BLOCKED TRAFFIC - ${signature}`;
      }

      const p = {
        id: baseTime + i,
        timestamp: new Date(baseTime + i).toISOString(),
        sourceIp: srcIp,
        destIp: '10.0.11.45',
        protocol,
        payload,
        signature,
        threatStatus,
        severity,
        length: 64
      };
      
      burstPackets.push(p);

      if (threatStatus === 'suspicious' && !isBlocked) {
        burstAlerts.push({
          id: `alert-burst-${baseTime}-${i}`,
          timestamp: p.timestamp,
          sourceIp: p.sourceIp,
          destIp: p.destIp,
          protocol: p.protocol,
          signature: p.signature,
          severity: p.severity,
          packetId: p.id,
          status: 'New',
          payload: p.payload
        });
      }
    }

    // Prepend all packets and alerts at once (batch update)
    setPackets(prev => [...burstPackets.reverse(), ...prev].slice(0, 200));
    setAlerts(prev => [...burstAlerts.reverse(), ...prev].slice(0, 300));
    
    // Adjust metrics at once
    setMetrics(prev => {
      let crit = burstAlerts.filter(a => a.severity === 'critical').length;
      let hi = burstAlerts.filter(a => a.severity === 'high').length;
      let med = burstAlerts.filter(a => a.severity === 'medium').length;
      let lo = burstAlerts.filter(a => a.severity === 'low').length;
      let clean = burstPackets.length - burstAlerts.length;

      return {
        totalProcessed: prev.totalProcessed + burstPackets.length,
        criticalCount: prev.criticalCount + crit,
        highCount: prev.highCount + hi,
        mediumCount: prev.mediumCount + med,
        lowCount: prev.lowCount + lo,
        cleanCount: prev.cleanCount + clean
      };
    });

    // Momentarily raise the threat score to critical level
    setThreatScore(98);

    // Resume simulation after a small delay
    setTimeout(() => {
      setIsSimulating(true);
    }, 1500);

    return { success: true, count: burstPackets.length, alertsCount: burstAlerts.length };
  };

  // Manage alert state
  const acknowledgeAlert = (alertId) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'Acknowledged' } : a));
    logActivity(`Acknowledged security alert ${alertId.substring(0, 15)}...`);
  };

  const resolveAlert = (alertId, resolution = 'Acknowledged') => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: resolution } : a));
    logActivity(`Resolved security alert ${alertId.substring(0, 15)}... as ${resolution}`);
  };

  const clearAlerts = () => {
    setAlerts([]);
    logActivity('Cleared all alerts from the operations queue', 'System', 'medium');
  };

  return (
    <NetworkContext.Provider value={{
      packets,
      alerts,
      metrics,
      simSpeed,
      setSimSpeed,
      isSimulating,
      setIsSimulating,
      triggerAttackBurst,
      acknowledgeAlert,
      resolveAlert,
      clearAlerts
    }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

// Quick helper to generate a random IP subnet
function generateRandomIP(isSuspicious) {
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
}
