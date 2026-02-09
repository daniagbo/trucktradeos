import React, { useState } from 'react';
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import ListingDetail from './pages/ListingDetail';
import BulkSourcing from './pages/BulkSourcing';
import AdminDashboard from './pages/AdminDashboard';

// Simple navigation types
export type View = 'home' | 'inventory' | 'detail' | 'bulk' | 'admin';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  // Member state: false = Visitor, true = Member
  const [isMember, setIsMember] = useState<boolean>(false);

  const navigate = (view: View, id?: string) => {
    setCurrentView(view);
    if (id) setSelectedItemId(id);
    window.scrollTo(0, 0);
  };

  const toggleMemberStatus = () => {
    setIsMember(!isMember);
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home navigate={navigate} isMember={isMember} />;
      case 'inventory':
        return <Inventory navigate={navigate} isMember={isMember} />;
      case 'detail':
        return <ListingDetail navigate={navigate} id={selectedItemId} isMember={isMember} />;
      case 'bulk':
        return <BulkSourcing navigate={navigate} isMember={isMember} />;
      case 'admin':
        return <AdminDashboard navigate={navigate} isMember={isMember} />;
      default:
        return <Home navigate={navigate} isMember={isMember} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-display">
      {/* Universal Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#1a212e]/90 backdrop-blur-md border-b border-[#dbdfe6] dark:border-[#2a303c] px-4 md:px-10 py-3">
        <div className="flex items-center justify-between max-w-[1440px] mx-auto w-full">
          <div 
            className="flex items-center gap-4 cursor-pointer" 
            onClick={() => navigate('home')}
          >
            <div className="size-8 text-primary bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">local_shipping</span>
            </div>
            <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">FleetSource</h2>
          </div>

          <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
            <nav className="flex items-center gap-8">
              <button onClick={() => navigate('inventory')} className={`text-sm font-bold transition-colors ${currentView === 'inventory' ? 'text-primary' : 'text-[#60758a] hover:text-primary'}`}>
                Inventory
              </button>
              <button onClick={() => navigate('bulk')} className={`text-sm font-bold transition-colors ${currentView === 'bulk' ? 'text-primary' : 'text-[#60758a] hover:text-primary'}`}>
                Bulk Sourcing
              </button>
              {isMember && (
                <button onClick={() => navigate('admin')} className={`text-sm font-bold transition-colors ${currentView === 'admin' ? 'text-primary' : 'text-[#60758a] hover:text-primary'}`}>
                  Dashboard
                </button>
              )}
            </nav>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex items-center gap-3">
               {isMember ? (
                 <button onClick={toggleMemberStatus} className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
                    <span className="text-sm font-bold text-[#111418] dark:text-white group-hover:text-red-500 transition-colors">Member</span>
                    <div className="size-9 rounded-full bg-gray-100 border border-gray-200 overflow-hidden relative">
                      <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcf0yPbF67zIgmPRu_PbdwoYTAMlijYk3R9Mi8Cn-2l989zZKNADCtwHCvFZUbX1PSZY0VU0taDy0eZBGSp1PyfsImeQR1MTplTe583YReGLu5TW6AafqH5sdlQUnxPOVon2mxA8Be7LRNXnY0qrgrsrNDijA4QBdtF-mwCRxq4TTF_eE1R1NgKsC3BEp5uAV2QPYwck3nnT4ZBPoPMFzIXOasn8As9DdSzO402s5KGgC8AbV9J0dOwgDm5HIV9nKDQCVUCE332Q" alt="User" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-white text-[18px]">logout</span>
                      </div>
                    </div>
                 </button>
               ) : (
                 <button onClick={toggleMemberStatus} className="h-10 px-5 rounded-xl bg-[#111418] dark:bg-white text-white dark:text-[#111418] text-sm font-bold hover:opacity-90 transition-opacity">
                   Sign In
                 </button>
               )}
            </div>
          </div>
          
          <button className="md:hidden text-[#111418] dark:text-white">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full">
        {renderView()}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#1a232e] border-t border-[#e5e7eb] dark:border-[#2a3441] py-10">
        <div className="px-4 md:px-10 lg:px-40 max-w-[1440px] mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-[#111418] dark:text-white">
            <span className="material-symbols-outlined text-primary">local_shipping</span>
            <span className="font-bold text-lg">FleetSource</span>
          </div>
          <div className="text-sm text-[#60758a] dark:text-gray-400">
            © 2024 FleetSource Inc. All rights reserved.
          </div>
          <div className="flex gap-6">
             <a href="#" className="text-[#60758a] hover:text-primary"><span className="material-symbols-outlined">mail</span></a>
             <a href="#" className="text-[#60758a] hover:text-primary"><span className="material-symbols-outlined">call</span></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;