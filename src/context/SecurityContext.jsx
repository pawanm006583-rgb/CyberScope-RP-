/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

const SecurityContext = createContext();

// Initial system roles with their permission maps
const INITIAL_ROLES = {
  Admin: {
    view_dashboard: true,
    block_ip: true,
    manage_users: true,
    edit_settings: true,
    run_regex_search: true,
    export_data: true,
    trigger_alert: true,
  },
  'Security Analyst': {
    view_dashboard: true,
    block_ip: true,
    manage_users: false,
    edit_settings: false,
    run_regex_search: true,
    export_data: true,
    trigger_alert: true,
  },
  Viewer: {
    view_dashboard: true,
    block_ip: false,
    manage_users: false,
    edit_settings: false,
    run_regex_search: false,
    export_data: false,
    trigger_alert: false,
  }
};

// Initial system users
const INITIAL_USERS = [
  { id: 'u1', name: 'Elena Rostova', role: 'Admin', email: 'e.rostova@cyberscope.io', status: 'Active', avatar: 'ER', lastUpdated: new Date(Date.now() - 3600000 * 24).toISOString() },
  { id: 'u2', name: 'Marcus Sterling', role: 'Security Analyst', email: 'm.sterling@cyberscope.io', status: 'Active', avatar: 'MS', lastUpdated: new Date(Date.now() - 3600000 * 12).toISOString() },
  { id: 'u3', name: 'Sarah Vance', role: 'Viewer', email: 's.vance@cyberscope.io', status: 'Active', avatar: 'SV', lastUpdated: new Date(Date.now() - 3600000 * 48).toISOString() },
  { id: 'u4', name: 'Tariq Al-Jamil', role: 'Security Analyst', email: 't.jamil@cyberscope.io', status: 'Suspended', avatar: 'TJ', lastUpdated: new Date(Date.now() - 3600000 * 6).toISOString() }
];

// Initial system logs (moved outside to prevent rendering impurity)
const INITIAL_LOGS = [
  { id: 1, timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), user: 'System', action: 'SOC System Initialization Completed', severity: 'low' },
  { id: 2, timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), user: 'Elena Rostova', action: 'System Threat Level Checked: Normal', severity: 'low' },
  { id: 3, timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'Marcus Sterling', action: 'Updated Global IP Blacklist feed source', severity: 'medium' }
];

export const SecurityProvider = ({ children }) => {
  // Current active user for demo/testing permissions
  const [currentUser, setCurrentUser] = useState(INITIAL_USERS[0]);
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [activityLog, setActivityLog] = useState(INITIAL_LOGS);
  
  // IP Blacklist state
  const [blockedIPs, setBlockedIPs] = useState(new Set(['185.220.101.5', '45.146.165.37', '193.106.191.8']));

  // Threat score (dynamic 0-100)
  const [threatScore, setThreatScore] = useState(42);

  // Undo history stack
  const [historyStack, setHistoryStack] = useState([]);

  // Log an event to the activity log
  const logActivity = (action, user = currentUser.name, severity = 'low') => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      user,
      action,
      severity
    };
    setActivityLog(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100 entries
  };

  // Helper to save state before modifying (for Undo)
  const saveStateForUndo = (customState = null) => {
    const stateToSave = customState || {
      roles: JSON.parse(JSON.stringify(roles)),
      users: JSON.parse(JSON.stringify(users)),
      blockedIPs: new Set(blockedIPs)
    };
    setHistoryStack(prev => [...prev, stateToSave].slice(-20)); // Limit to last 20 operations
  };

  // Undo the last permission or user state change
  const undoLastChange = () => {
    if (historyStack.length === 0) {
      logActivity('Attempted Undo, but no history was available', 'System', 'medium');
      return false;
    }
    const previous = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, -1));
    
    setRoles(previous.roles);
    setUsers(previous.users);
    setBlockedIPs(previous.blockedIPs);

    // Recalculate threat score synchronously
    let base = 35;
    base -= Math.min(previous.blockedIPs.size * 2, 10);
    const noise = Math.floor(Math.sin(Date.now() / 10000) * 5);
    setThreatScore(Math.max(10, Math.min(100, base + noise + 10)));

    logActivity('Reverted last administrative modification (Undo Successful)', currentUser.name, 'medium');
    return true;
  };

  // Check if current user has a specific permission
  const hasPermission = (permission) => {
    const userRole = currentUser.role;
    return roles[userRole]?.[permission] || false;
  };

  // Modify permissions of a specific role
  const updateRolePermission = (roleName, permission, value) => {
    if (!hasPermission('manage_users')) {
      logActivity(`Unauthorized attempt to change permissions by ${currentUser.name}`, 'Security Sentinel', 'high');
      return { success: false, error: 'Permission Denied: Admin role required.' };
    }

    saveStateForUndo();
    setRoles(prev => {
      const updated = {
        ...prev,
        [roleName]: {
          ...prev[roleName],
          [permission]: value
        }
      };
      return updated;
    });

    logActivity(`Role "${roleName}" permission "${permission}" set to ${value ? 'ENABLED' : 'DISABLED'}`);
    return { success: true };
  };

  // Update a user's role or status
  const updateUserRole = (userId, newRole) => {
    if (!hasPermission('manage_users')) {
      logActivity(`Unauthorized attempt to update user role by ${currentUser.name}`, 'Security Sentinel', 'high');
      return { success: false, error: 'Permission Denied: Admin role required.' };
    }

    saveStateForUndo();
    let oldRole = '';
    let userName = '';
    
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        oldRole = u.role;
        userName = u.name;
        const updatedUser = { ...u, role: newRole, lastUpdated: new Date().toISOString() };
        // If updating currently logged in user, refresh context
        if (currentUser.id === userId) {
          setCurrentUser(updatedUser);
        }
        return updatedUser;
      }
      return u;
    }));

    logActivity(`User "${userName}" role updated from "${oldRole}" to "${newRole}"`);
    return { success: true };
  };

  // Add a new user
  const addUser = (name, role, email) => {
    if (!hasPermission('manage_users')) {
      return { success: false, error: 'Permission Denied' };
    }

    saveStateForUndo();
    const newUser = {
      id: `u${Date.now()}`,
      name,
      role,
      email,
      status: 'Active',
      avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      lastUpdated: new Date().toISOString()
    };

    setUsers(prev => [...prev, newUser]);
    logActivity(`New user "${name}" added as "${role}"`);
    return { success: true };
  };

  // Delete/Suspend a user
  const removeUser = (userId) => {
    if (!hasPermission('manage_users')) {
      return { success: false, error: 'Permission Denied' };
    }

    saveStateForUndo();
    let userName = '';
    setUsers(prev => {
      const user = prev.find(u => u.id === userId);
      if (user) userName = user.name;
      return prev.filter(u => u.id !== userId);
    });

    logActivity(`User "${userName}" removed from system access`, currentUser.name, 'medium');
    return { success: true };
  };

  // Toggle IP block
  const toggleIPBlock = (ipAddress, reason = 'Administrative Action') => {
    if (!hasPermission('block_ip')) {
      logActivity(`Unauthorized attempt to toggle block status of IP ${ipAddress}`, 'Security Sentinel', 'high');
      return { success: false, error: 'Permission Denied: Threat response permissions required.' };
    }

    saveStateForUndo();
    const isBlocked = blockedIPs.has(ipAddress);
    const updatedBlocked = new Set(blockedIPs);
    if (isBlocked) {
      updatedBlocked.delete(ipAddress);
    } else {
      updatedBlocked.add(ipAddress);
    }
    setBlockedIPs(updatedBlocked);

    // Recalculate threat score synchronously
    let base = 35;
    base -= Math.min(updatedBlocked.size * 2, 10);
    const noise = Math.floor(Math.sin(Date.now() / 10000) * 5);
    setThreatScore(Math.max(10, Math.min(100, base + noise + 10)));

    if (isBlocked) {
      logActivity(`IP address ${ipAddress} unblocked (Authorized)`, currentUser.name, 'medium');
    } else {
      logActivity(`IP address ${ipAddress} blocked: ${reason}`, currentUser.name, 'high');
    }

    return { success: true };
  };

  return (
    <SecurityContext.Provider value={{
      currentUser,
      setCurrentUser,
      roles,
      users,
      blockedIPs,
      activityLog,
      threatScore,
      setThreatScore,
      hasPermission,
      updateRolePermission,
      updateUserRole,
      addUser,
      removeUser,
      toggleIPBlock,
      undoLastChange,
      canUndo: historyStack.length > 0,
      logActivity
    }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
