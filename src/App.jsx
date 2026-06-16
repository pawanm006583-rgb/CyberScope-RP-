import { useState } from 'react';
import { SecurityProvider } from './context/SecurityContext';
import { NetworkProvider } from './context/NetworkContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Page Imports
import DashboardPage from './components/pages/DashboardPage';
import NetworkFeedPage from './components/pages/NetworkFeedPage';
import ThreatAnalysisPage from './components/pages/ThreatAnalysisPage';
import BlacklistExplorerPage from './components/pages/BlacklistExplorerPage';
import AccessControlPage from './components/pages/AccessControlPage';
import SecuritySearchPage from './components/pages/SecuritySearchPage';
import SettingsPage from './components/pages/SettingsPage';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'network-feed':
        return <NetworkFeedPage />;
      case 'threat-analysis':
        return <ThreatAnalysisPage />;
      case 'blacklist':
        return <BlacklistExplorerPage />;
      case 'access-control':
        return <AccessControlPage />;
      case 'security-search':
        return <SecuritySearchPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <SecurityProvider>
      <NetworkProvider>
        <div className="flex bg-cyber-dark min-h-screen text-slate-200 antialiased scanline relative">
          
          {/* Main Navigation Sidebar */}
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          
          {/* Main Console Workspace */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Operational Status Header */}
            <Topbar activeTab={activeTab} />
            
            {/* Scrollable HUD Workspace */}
            <main className="flex-1 p-8 overflow-y-auto max-h-[calc(100vh-80px)]">
              {renderActivePage()}
            </main>
          </div>

        </div>
      </NetworkProvider>
    </SecurityProvider>
  );
}

export default App;
