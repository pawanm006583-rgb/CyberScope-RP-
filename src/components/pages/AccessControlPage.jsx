import { useState, useMemo, useRef } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { 
  Key, 
  Users, 
  RotateCcw, 
  UserPlus, 
  ShieldCheck, 
  UserMinus, 
  Terminal, 
  History,
  CheckCircle,
  XCircle,
  Shield,
  ArrowRight,
  X,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

// Static permission keys & labels defined outside the component to avoid memoization and dependency issues
const PERMISSION_KEYS = [
  { key: 'view_dashboard', label: 'View Dashboard Metrics' },
  { key: 'block_ip', label: 'Firewall IP Blacklisting' },
  { key: 'manage_users', label: 'Security Admin Control (Manage Users/Roles)' },
  { key: 'edit_settings', label: 'Configure System Thresholds' },
  { key: 'run_regex_search', label: 'Search Raw Telemetry Payloads' },
  { key: 'export_data', label: 'Export Security Reports' },
  { key: 'trigger_alert', label: 'Simulate Live Fire Intrusion Bursts' },
];

const PERMISSION_LABELS = PERMISSION_KEYS.reduce((map, p) => {
  map[p.key] = p.label;
  return map;
}, {});

export const AccessControlPage = () => {
  const { 
    currentUser, 
    roles, 
    users, 
    activityLog, 
    hasPermission, 
    updateRolePermission, 
    updateUserRole, 
    addUser, 
    removeUser, 
    undoLastChange, 
    canUndo 
  } = useSecurity();

  // Local notifications state
  const [notifications, setNotifications] = useState([]);
  const toastIdRef = useRef(0);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    toastIdRef.current += 1;
    const id = toastIdRef.current;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // New user form state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Viewer');

  // Rule Change Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardUser, setWizardUser] = useState(null);
  const [wizardNewRole, setWizardNewRole] = useState('');
  
  // Confirmation Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => u.role === 'Admin' && u.status !== 'Suspended').length;
    const analysts = users.filter(u => u.role === 'Security Analyst' && u.status !== 'Suspended').length;
    const viewers = users.filter(u => u.role === 'Viewer' && u.status !== 'Suspended').length;
    return { total, admins, analysts, viewers };
  }, [users]);

  // Filters audit log specifically for permissions and role edits
  const permissionHistory = useMemo(() => {
    return activityLog.filter(log => {
      const act = log.action.toLowerCase();
      return (
        act.includes('role') || 
        act.includes('permission') || 
        act.includes('added') || 
        act.includes('removed') || 
        act.includes('undo') ||
        act.includes('privilege') ||
        act.includes('system')
      );
    });
  }, [activityLog]);

  // Compute permission delta between old role and new target role
  const permissionDelta = useMemo(() => {
    if (!wizardUser || !wizardNewRole) return { gains: [], losses: [] };
    const oldRole = wizardUser.role;
    const newRole = wizardNewRole;
    
    if (oldRole === newRole) return { gains: [], losses: [] };

    const oldPerms = roles[oldRole] || {};
    const newPerms = roles[newRole] || {};

    const gains = [];
    const losses = [];

    Object.keys(newPerms).forEach(key => {
      if (newPerms[key] && !oldPerms[key]) {
        gains.push(PERMISSION_LABELS[key] || key);
      } else if (!newPerms[key] && oldPerms[key]) {
        losses.push(PERMISSION_LABELS[key] || key);
      }
    });

    return { gains, losses };
  }, [wizardUser, wizardNewRole, roles]);

  const handleTogglePermission = (roleName, permission, currentValue) => {
    const res = updateRolePermission(roleName, permission, !currentValue);
    if (res && !res.success) {
      showToast(res.error || "Matrix adjustment denied.", 'error');
    } else {
      showToast(`Permission '${permission}' toggled for ${roleName}.`, 'success');
    }
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      showToast('Name and Email are required.', 'error');
      return;
    }

    const res = addUser(newUserName.trim(), newUserRole, newUserEmail.trim());
    if (res && !res.success) {
      showToast(res.error || "Privilege violation: Admin required.", 'error');
    } else {
      showToast(`Operator '${newUserName}' successfully added to SOC directory.`, 'success');
      setNewUserName('');
      setNewUserEmail('');
      setShowAddUser(false);
    }
  };

  const handleRemoveUser = (userId, name) => {
    const res = removeUser(userId);
    if (res && !res.success) {
      showToast(res.error || "Privilege violation: Admin required.", 'error');
    } else {
      showToast(`Operator '${name}' permissions suspended.`, 'success');
    }
  };

  const handleUndo = () => {
    const success = undoLastChange();
    if (success) {
      showToast("Last privilege modification undone.", "success");
    } else {
      showToast("No operations in stack history to rollback.", "error");
    }
  };

  // Start wizard for a selected user
  const initiateRoleChange = (user) => {
    setWizardUser(user);
    setWizardNewRole(user.role);
    setWizardStep(2);
    showToast(`Wizard armed: Modifying role for ${user.name}`, 'info');
  };

  // Wizard Confirmation
  const confirmWizardChange = () => {
    if (!wizardUser || !wizardNewRole) return;
    
    // Admin validation
    if (!hasPermission('manage_users')) {
      showToast("Permission Denied: Admin role required.", "error");
      setShowConfirmModal(false);
      return;
    }

    const res = updateUserRole(wizardUser.id, wizardNewRole);
    if (res && res.success) {
      showToast(`Privilege set compiled. ${wizardUser.name} role is now ${wizardNewRole}.`, 'success');
      // Reset wizard
      setWizardUser(null);
      setWizardNewRole('');
      setWizardStep(1);
    } else {
      showToast(res.error || "Update operation failed.", 'error');
    }
    setShowConfirmModal(false);
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'NEVER';
    const d = new Date(isoString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  return (
    <div className="space-y-6 font-mono text-xs select-none relative">
      
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`p-3 rounded border shadow-lg flex items-center gap-2 transform translate-y-0 transition-all duration-300 pointer-events-auto ${
              n.type === 'success' 
                ? 'bg-cyber-dark border-cyber-neonGreen text-cyber-neonGreen shadow-cyber-neonGreen/10' 
                : n.type === 'error'
                ? 'bg-cyber-dark border-cyber-neonRed text-cyber-neonRed shadow-cyber-neonRed/10'
                : 'bg-cyber-dark border-cyber-neonCyan text-cyber-neonCyan shadow-cyber-neonCyan/10'
            }`}
          >
            {n.type === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0 animate-bounce" />
            ) : n.type === 'error' ? (
              <XCircle className="w-4 h-4 flex-shrink-0 animate-pulse" />
            ) : (
              <Terminal className="w-4 h-4 flex-shrink-0 animate-pulse" />
            )}
            <span className="font-semibold text-[10px] uppercase">{n.message}</span>
          </div>
        ))}
      </div>

      {/* Security Override Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="glass-panel border-2 border-cyber-neonRed p-6 rounded-lg max-w-md w-full mx-4 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-2 text-cyber-neonRed border-b border-cyber-neonRed/20 pb-3">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Matrix Authorization Override Required
              </h3>
            </div>
            
            <div className="space-y-3 leading-relaxed text-[11px] text-slate-300">
              <p>
                You are executing an administrative command to override access rules for operator:
              </p>
              <div className="p-3 bg-cyber-dark border border-cyber-border/20 rounded">
                <p><span className="text-cyber-neonGreen">OPERATOR:</span> {wizardUser?.name}</p>
                <p><span className="text-cyber-neonGreen">EMAIL:</span> {wizardUser?.email}</p>
                <p className="mt-1">
                  <span className="text-cyber-neonRed">ROLE UPDATE:</span> {wizardUser?.role} <span className="text-cyber-neonCyan">&gt;&gt;</span> {wizardNewRole}
                </p>
              </div>
              <p className="text-[10px] text-cyber-textMuted">
                Warning: Modifying authorization levels updates network routing policies instantly. This action is signed and compiled to the global SOC immutable logs.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-cyber-border/15">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-cyber-border text-white hover:bg-white/5 rounded font-bold uppercase tracking-wider transition-colors"
              >
                Abort Override
              </button>
              <button
                onClick={confirmWizardChange}
                className="px-4 py-2 bg-cyber-neonRed text-black hover:bg-cyber-neonRed/80 rounded font-bold uppercase tracking-wider transition-colors shadow-lg shadow-cyber-neonRed/25"
              >
                Confirm System Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-lg flex flex-col justify-between space-y-2 relative overflow-hidden group hover:border-cyber-neonGreen/35 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-neonGreen/5 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
          <div className="flex justify-between items-center text-cyber-textMuted">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Operators</span>
            <Users className="w-4 h-4 text-cyber-neonGreen" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{stats.total}</span>
            <span className="text-[9px] text-cyber-neonGreen">ACTIVE LIST</span>
          </div>
          <div className="h-1 bg-cyber-dark border border-cyber-border/10 rounded-full overflow-hidden">
            <div className="h-full bg-cyber-neonGreen w-full shadow-lg shadow-cyber-neonGreen/50" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-lg flex flex-col justify-between space-y-2 relative overflow-hidden group hover:border-cyber-neonRed/35 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-neonRed/5 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
          <div className="flex justify-between items-center text-cyber-textMuted">
            <span className="text-[10px] uppercase font-bold tracking-wider">Active Admins</span>
            <Shield className="w-4 h-4 text-cyber-neonRed" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{stats.admins}</span>
            <span className="text-[9px] text-cyber-neonRed">FULL AUTHORITY</span>
          </div>
          <div className="h-1 bg-cyber-dark border border-cyber-border/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyber-neonRed shadow-lg shadow-cyber-neonRed/50 transition-all duration-500" 
              style={{ width: `${stats.total > 0 ? (stats.admins / stats.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-lg flex flex-col justify-between space-y-2 relative overflow-hidden group hover:border-cyber-neonCyan/35 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-neonCyan/5 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
          <div className="flex justify-between items-center text-cyber-textMuted">
            <span className="text-[10px] uppercase font-bold tracking-wider">Security Analysts</span>
            <Terminal className="w-4 h-4 text-cyber-neonCyan" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{stats.analysts}</span>
            <span className="text-[9px] text-cyber-neonCyan">TRIAGE LEVEL</span>
          </div>
          <div className="h-1 bg-cyber-dark border border-cyber-border/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyber-neonCyan shadow-lg shadow-cyber-neonCyan/50 transition-all duration-500" 
              style={{ width: `${stats.total > 0 ? (stats.analysts / stats.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-lg flex flex-col justify-between space-y-2 relative overflow-hidden group hover:border-cyber-neonYellow/35 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-neonYellow/5 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
          <div className="flex justify-between items-center text-cyber-textMuted">
            <span className="text-[10px] uppercase font-bold tracking-wider">Viewers</span>
            <ShieldCheck className="w-4 h-4 text-cyber-neonYellow" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{stats.viewers}</span>
            <span className="text-[9px] text-cyber-neonYellow">READ ONLY</span>
          </div>
          <div className="h-1 bg-cyber-dark border border-cyber-border/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyber-neonYellow shadow-lg shadow-cyber-neonYellow/50 transition-all duration-500" 
              style={{ width: `${stats.total > 0 ? (stats.viewers / stats.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Control Actions & Undo Header */}
      <div className="glass-panel p-5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
            Access Permissions Center
          </h4>
          <p className="text-[10px] text-cyber-textMuted">
            Configure authorization rules and inspect audit histories
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Undo Action Button */}
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded uppercase tracking-wider transition-all duration-150 ${
              canUndo
                ? 'bg-cyber-neonCyan/10 border-cyber-neonCyan text-cyber-neonCyan hover:bg-cyber-neonCyan/20 cursor-pointer shadow-md shadow-cyber-neonCyan/5'
                : 'border-cyber-border/20 text-cyber-textMuted/40 cursor-not-allowed'
            }`}
            title="Rollback the last administrative change instantly"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo Last Action</span>
          </button>

          {/* Add User trigger */}
          <button
            onClick={() => setShowAddUser(!showAddUser)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded uppercase tracking-wider transition-all duration-150 ${
              showAddUser
                ? 'bg-cyber-neonRed/10 border-cyber-neonRed text-cyber-neonRed hover:bg-cyber-neonRed/20'
                : 'bg-cyber-neonGreen/10 border border-cyber-neonGreen hover:bg-cyber-neonGreen/20 text-cyber-neonGreen'
            }`}
          >
            {showAddUser ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            <span>{showAddUser ? "Cancel Operator Form" : "Create Operator"}</span>
          </button>
        </div>
      </div>

      {/* Add User Form modal style panel */}
      {showAddUser && (
        <form onSubmit={handleAddUserSubmit} className="glass-panel p-5 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top duration-250">
          <div>
            <label className="text-[9px] text-cyber-textMuted block mb-1">OPERATOR FULL NAME</label>
            <input
              type="text"
              placeholder="e.g. John Miller"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="w-full bg-cyber-dark border border-cyber-border/40 hover:border-cyber-border focus:border-cyber-neonGreen focus:outline-none px-3 py-1.5 rounded text-white font-semibold"
            />
          </div>
          <div>
            <label className="text-[9px] text-cyber-textMuted block mb-1">EMAIL ADDRESS</label>
            <input
              type="email"
              placeholder="e.g. j.miller@cyberscope.io"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="w-full bg-cyber-dark border border-cyber-border/40 hover:border-cyber-border focus:border-cyber-neonGreen focus:outline-none px-3 py-1.5 rounded text-white font-semibold"
            />
          </div>
          <div>
            <label className="text-[9px] text-cyber-textMuted block mb-1">TERMINAL ROLE</label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              className="w-full bg-cyber-dark border border-cyber-border/40 px-3 py-1.5 rounded text-white cursor-pointer"
            >
              <option value="Admin">Admin (Full Access)</option>
              <option value="Security Analyst">Security Analyst (Intermediate)</option>
              <option value="Viewer">Viewer (Read Only)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-1.5 bg-cyber-neonGreen text-cyber-dark hover:bg-cyber-neonGreen/80 font-bold uppercase rounded transition-colors shadow-md shadow-cyber-neonGreen/10"
            >
              Commit privileges
            </button>
          </div>
        </form>
      )}

      {/* Main layout grids */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Table & Matrix side (2 cols width) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Detailed User Table */}
          <div className="glass-panel p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cyber-border/20">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyber-neonGreen" />
                <h4 className="text-xs text-white uppercase font-bold tracking-wider">
                  Operator Database Directory
                </h4>
              </div>
              <span className="text-[9px] text-cyber-textMuted uppercase font-bold bg-cyber-dark px-2 py-0.5 border border-cyber-border/10 rounded">
                Matrix Population: {users.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-cyber-border/20 text-cyber-textMuted text-[9px] uppercase tracking-wider">
                    <th className="py-2.5 font-semibold">Operator Details</th>
                    <th className="py-2.5 font-semibold">Security Role</th>
                    <th className="py-2.5 font-semibold">Traffic Status</th>
                    <th className="py-2.5 font-semibold">Last Matrix Update</th>
                    <th className="py-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const isSuspended = user.status === 'Suspended';
                    const isActiveWizardTarget = wizardUser?.id === user.id;

                    return (
                      <tr 
                        key={user.id} 
                        className={`border-b border-cyber-border/10 transition-colors ${
                          isActiveWizardTarget 
                            ? 'bg-cyber-neonCyan/5 border-cyber-neonCyan/40' 
                            : isSuspended 
                            ? 'bg-red-950/5 text-neutral-500' 
                            : 'hover:bg-white/5 text-white'
                        }`}
                      >
                        {/* Profile Info */}
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                              isSuspended
                                ? 'border-neutral-800 bg-neutral-900 text-neutral-600'
                                : isActiveWizardTarget
                                ? 'border-cyber-neonCyan bg-cyber-neonCyan/10 text-cyber-neonCyan'
                                : 'border-cyber-border/40 bg-cyber-neonGreen/10 text-cyber-neonGreen'
                            }`}>
                              {user.avatar}
                            </div>
                            <div>
                              <div className={`font-bold text-xs ${isSuspended ? 'line-through text-neutral-600' : 'text-slate-100'}`}>
                                {user.name}
                              </div>
                              <div className="text-[9px] text-cyber-textMuted">{user.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3">
                          <span className={`px-2 py-0.5 border text-[9px] rounded uppercase font-bold ${
                            user.role === 'Admin' 
                              ? 'bg-cyber-neonRed/10 border-cyber-neonRed/30 text-cyber-neonRed'
                              : user.role === 'Security Analyst'
                              ? 'bg-cyber-neonCyan/10 border-cyber-neonCyan/30 text-cyber-neonCyan'
                              : 'bg-cyber-neonGreen/10 border-cyber-neonGreen/20 text-cyber-neonGreen'
                          }`}>
                            {user.role}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 text-[9px] uppercase font-semibold ${
                            isSuspended ? 'text-cyber-neonRed animate-pulse' : 'text-cyber-neonGreen'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? 'bg-cyber-neonRed' : 'bg-cyber-neonGreen'}`} />
                            {user.status}
                          </span>
                        </td>

                        {/* Last Updated */}
                        <td className="py-3 font-semibold text-[9px] text-cyber-textMuted">
                          {formatTimestamp(user.lastUpdated)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            {/* Wizard selection */}
                            <button
                              onClick={() => initiateRoleChange(user)}
                              disabled={isSuspended}
                              className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${
                                isSuspended
                                  ? 'border border-neutral-800 text-neutral-700 cursor-not-allowed'
                                  : 'bg-cyber-neonCyan/15 border border-cyber-neonCyan text-cyber-neonCyan hover:bg-cyber-neonCyan/35 cursor-pointer shadow-md shadow-cyber-neonCyan/5'
                              }`}
                            >
                              Edit Role
                            </button>

                            {/* Suspension toggle */}
                            {!isSuspended ? (
                              <button
                                onClick={() => handleRemoveUser(user.id, user.name)}
                                className="p-1 border border-cyber-neonRed/30 text-cyber-neonRed/70 hover:text-cyber-neonRed hover:border-cyber-neonRed hover:bg-cyber-neonRed/10 rounded transition-all"
                                title="Deactivate Privileges"
                              >
                                <UserMinus className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="text-[8px] text-neutral-600 font-bold uppercase select-none pr-1">SUSPENDED</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Authorization Matrix Panel */}
          <div className="glass-panel p-5 rounded-lg space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-cyber-border/20">
              <Key className="w-4 h-4 text-cyber-neonGreen" />
              <h4 className="text-xs text-white uppercase font-bold tracking-wider">
                Authorization Matrix (RBAC Scheme Editor)
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-cyber-border/20 text-cyber-textMuted text-[9px] uppercase tracking-wider">
                    <th className="py-2.5 font-semibold">Security Permission Module</th>
                    {Object.keys(roles).map(role => (
                      <th key={role} className="py-2.5 font-semibold text-center w-24">
                        {role}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_KEYS.map(({ key, label }) => (
                    <tr key={key} className="border-b border-cyber-border/10 hover:bg-white/5 transition-colors">
                      <td className="py-3 font-semibold text-white">{label}</td>
                      {Object.keys(roles).map(role => {
                        const hasPerm = roles[role][key];
                        // Disable if active operator switch tests
                        const isSelfAdmin = currentUser.role === role && key === 'manage_users';
                        
                        return (
                          <td key={role} className="py-3 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={hasPerm}
                                disabled={isSelfAdmin} 
                                onChange={() => handleTogglePermission(role, key, hasPerm)}
                                className="w-4 h-4 rounded bg-cyber-dark border-cyber-border/60 text-cyber-neonGreen focus:ring-0 focus:ring-offset-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              />
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-3 bg-cyber-dark/40 border border-cyber-border/15 rounded text-[9px] text-cyber-textMuted leading-relaxed">
              <span className="font-bold text-white block uppercase mb-1">Matrix Policy Adjustments:</span>
              Changing checkboxes inside this authorization grid updates ACL permissions instantly. Toggle the operator context dropdown in the dashboard header to test limitations.
            </div>
          </div>

        </div>

        {/* Wizard, Add User, Audit Log (1 col width) */}
        <div className="space-y-6">

          {/* Rule Change Wizard Guide */}
          <div className="glass-panel p-5 rounded-lg space-y-4 border border-cyber-neonCyan/30 relative">
            <div className="absolute top-0 right-0 p-2 text-[8px] bg-cyber-neonCyan/10 text-cyber-neonCyan font-bold uppercase tracking-widest border-l border-b border-cyber-neonCyan/20">
              Rule Wizard
            </div>

            <div className="flex items-center gap-2 pb-3 border-b border-cyber-border/20">
              <UserCheck className="w-4 h-4 text-cyber-neonCyan" />
              <h4 className="text-xs text-white uppercase font-bold tracking-wider">
                Rule Change Wizard
              </h4>
            </div>

            {/* Stepper Progress Bar */}
            <div className="flex items-center justify-between px-1 py-2 relative">
              <div className="absolute left-4 right-4 top-1/2 h-[1px] bg-cyber-border/20 -translate-y-1/2 z-0" />
              
              {[1, 2, 3, 4].map(idx => {
                const isActive = wizardStep === idx;
                const isCompleted = wizardStep > idx;
                
                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                      isActive 
                        ? 'bg-cyber-dark border-cyber-neonCyan text-cyber-neonCyan shadow-md shadow-cyber-neonCyan/30'
                        : isCompleted
                        ? 'bg-cyber-neonCyan text-cyber-dark border-cyber-neonCyan'
                        : 'bg-cyber-dark border-cyber-border/20 text-cyber-textMuted'
                    }`}>
                      {idx}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Visual indicators steps name */}
            <div className="grid grid-cols-4 text-center text-[8px] text-cyber-textMuted uppercase font-bold pb-2 border-b border-cyber-border/10">
              <span className={wizardStep === 1 ? "text-cyber-neonCyan" : ""}>1. Select</span>
              <span className={wizardStep === 2 ? "text-cyber-neonCyan" : ""}>2. Role</span>
              <span className={wizardStep === 3 ? "text-cyber-neonCyan" : ""}>3. Review</span>
              <span className={wizardStep === 4 ? "text-cyber-neonCyan" : ""}>4. Commit</span>
            </div>

            {/* Steps Rendering */}
            <div className="space-y-4 min-h-[180px] flex flex-col justify-between pt-2">
              
              {/* STEP 1: Select User */}
              {wizardStep === 1 && (
                <div className="space-y-3 flex-1 flex flex-col justify-center items-center text-center p-3">
                  <Users className="w-8 h-8 text-cyber-textMuted animate-pulse mb-1" />
                  <p className="font-bold text-slate-200 text-[10px]">AWAITING OPERATOR SELECT</p>
                  <p className="text-[9px] text-cyber-textMuted max-w-[200px]">
                    Initiate a change by clicking the <span className="text-cyber-neonCyan">"Edit Role"</span> button on any Operator in the directory list.
                  </p>
                </div>
              )}

              {/* STEP 2: Choose Role */}
              {wizardStep === 2 && wizardUser && (
                <div className="space-y-3 flex-1">
                  <div>
                    <span className="text-[9px] text-cyber-textMuted block">SELECT NEW ROLE FOR:</span>
                    <span className="text-white font-bold text-xs">{wizardUser.name}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {['Admin', 'Security Analyst', 'Viewer'].map(role => {
                      const isCurrent = wizardUser.role === role;
                      const isSelected = wizardNewRole === role;

                      return (
                        <div 
                          key={role}
                          onClick={() => setWizardNewRole(role)}
                          className={`p-2 rounded border cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-cyber-neonCyan/10 border-cyber-neonCyan text-white'
                              : 'bg-cyber-dark/40 border-cyber-border/20 hover:border-cyber-border/60 text-cyber-textMuted'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-[10px]">{role}</p>
                            <p className="text-[8px] text-cyber-textMuted">
                              {role === 'Admin' ? "Full read/write ACL matrix overrides" : role === 'Security Analyst' ? "Active threat triage and search capability" : "Monitoring telemetry dashboard scope only"}
                            </p>
                          </div>
                          {isCurrent && (
                            <span className="text-[8px] bg-cyber-border/20 border border-cyber-border/30 px-1 py-0.2 rounded font-bold uppercase text-white">Current</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 justify-between pt-2">
                    <button 
                      onClick={() => { setWizardStep(1); setWizardUser(null); }}
                      className="px-2.5 py-1 border border-cyber-border text-white hover:bg-white/5 rounded font-bold uppercase"
                    >
                      Reset
                    </button>
                    <button 
                      onClick={() => setWizardStep(3)}
                      className="px-3 py-1 bg-cyber-neonCyan text-cyber-dark hover:bg-cyber-neonCyan/80 font-bold uppercase rounded flex items-center gap-1"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Review Permissions Delta */}
              {wizardStep === 3 && wizardUser && (
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-cyber-textMuted block">DELTA PRIVILEGES:</span>
                    <span className="text-white font-bold text-[10px]">{wizardUser.role} &gt;&gt; {wizardNewRole}</span>
                  </div>

                  <div className="bg-cyber-dark/80 p-2.5 border border-cyber-border/10 rounded max-h-36 overflow-y-auto space-y-1.5 font-mono text-[9px]">
                    {permissionDelta.gains.length === 0 && permissionDelta.losses.length === 0 ? (
                      <p className="text-cyber-textMuted italic text-center py-2">No security modifications detected.</p>
                    ) : (
                      <>
                        {permissionDelta.gains.map(gain => (
                          <div key={gain} className="text-cyber-neonGreen flex items-start gap-1">
                            <span className="font-bold flex-shrink-0">[+]</span>
                            <span>{gain}</span>
                          </div>
                        ))}
                        {permissionDelta.losses.map(loss => (
                          <div key={loss} className="text-cyber-neonRed flex items-start gap-1">
                            <span className="font-bold flex-shrink-0">[-]</span>
                            <span>{loss}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  <div className="flex gap-2 justify-between pt-2">
                    <button 
                      onClick={() => setWizardStep(2)}
                      className="px-2.5 py-1 border border-cyber-border text-white hover:bg-white/5 rounded font-bold uppercase"
                    >
                      Back
                    </button>
                    <button 
                      onClick={() => setWizardStep(4)}
                      className="px-3 py-1 bg-cyber-neonCyan text-cyber-dark hover:bg-cyber-neonCyan/80 font-bold uppercase rounded flex items-center gap-1"
                    >
                      <span>Proceed</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Confirm Action */}
              {wizardStep === 4 && wizardUser && (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[9px] text-cyber-textMuted block">MATRIX COMMIT READY</span>
                    <p className="text-white leading-relaxed text-[10px]">
                      Ready to execute privilege set update for operator <span className="text-cyber-neonCyan font-bold">{wizardUser.name}</span>.
                    </p>
                    <p className="text-[9px] text-cyber-neonYellow flex items-center gap-1.5 p-2 bg-cyber-neonYellow/5 border border-cyber-neonYellow/20 rounded">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>This action updates core ACL security policy routing.</span>
                    </p>
                  </div>

                  <div className="flex gap-2 justify-between">
                    <button 
                      onClick={() => setWizardStep(3)}
                      className="px-2.5 py-1 border border-cyber-border text-white hover:bg-white/5 rounded font-bold uppercase"
                    >
                      Back
                    </button>
                    <button 
                      onClick={() => setShowConfirmModal(true)}
                      className="px-3 py-1 bg-cyber-neonRed text-white hover:bg-cyber-neonRed/80 font-bold uppercase rounded shadow-lg shadow-cyber-neonRed/20"
                    >
                      Commit Update
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Audit History Logs */}
          <div className="glass-panel p-5 rounded-lg space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-cyber-neonGreen" />
              <h4 className="text-xs text-white uppercase font-bold tracking-wider">
                Permission Modification History
              </h4>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {permissionHistory.length === 0 ? (
                <div className="text-center py-10 text-cyber-textMuted">
                  &gt; Audit database empty.
                </div>
              ) : (
                permissionHistory.map(log => (
                  <div 
                    key={log.id} 
                    className="flex flex-col gap-1 py-2 px-3 bg-cyber-dark/30 border border-cyber-border/10 rounded font-mono text-[9px]"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className={`text-[8px] uppercase px-1 py-0.2 rounded font-bold border ${
                        log.severity === 'high' || log.severity === 'critical'
                          ? 'bg-cyber-neonRed/10 border-cyber-neonRed/30 text-cyber-neonRed'
                          : log.severity === 'medium'
                          ? 'bg-cyber-neonYellow/10 border-cyber-neonYellow/30 text-cyber-neonYellow'
                          : 'bg-cyber-neonGreen/10 border-cyber-neonGreen/20 text-cyber-neonGreen'
                      }`}>
                        {log.severity}
                      </span>
                      <span className="text-cyber-textMuted text-[8px]">
                        {new Date(log.timestamp).toLocaleTimeString()} {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-white font-medium break-words leading-tight">{log.action}</p>
                    <div className="text-right text-[8px] text-cyber-textMuted uppercase font-bold">
                      BY: {log.user}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AccessControlPage;
