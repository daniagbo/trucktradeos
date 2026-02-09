import React from 'react';
import { View } from '../App';

interface HomeProps {
  navigate: (view: View, id?: string) => void;
  isMember: boolean;
}

const Home: React.FC<HomeProps> = ({ navigate, isMember }) => {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative w-full pt-16 pb-32 md:pt-24 md:pb-40 px-4 md:px-10 lg:px-20 overflow-hidden">
        {/* Background Map Effect */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30 dark:opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent animate-fade-in duration-1000"></div>
        <div className="absolute right-0 top-0 w-1/2 h-full z-0 opacity-10 dark:opacity-5 bg-no-repeat bg-right-top bg-contain animate-fade-in" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA1vn4KsBGhxGXg_6oBrlsUFdBAGvrwkwEd_t-JRmsVlVmphrsufMohoEwO4Ev_JE2aolQCpS4eRc1H5njFIMVRdNL7A6iQL8kjREEtWguxLoiNbFSfp8iwMQDzFM9B0LnLfdCy_Vu9Qqar2qE1lJqpmSTIdhUA1lk1yXISMNnY-_vCevjcQ7EtMxH2-Wp4OLQehKOX_sdYz48Mj23j51ak1LhdDWQybs8TAH7H2bWMCIC5ac9pxMOq0p4huKgGoW7Z98-9leN8CA')"}}></div>
        
        <div className="relative z-10 max-w-[1440px] mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-primary text-xs font-bold uppercase tracking-wider mb-6 border border-blue-100 dark:border-blue-800 opacity-0 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Premium B2B Marketplace
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6 text-[#111418] dark:text-white opacity-0 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Source trucks and trailers <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">across borders</span>, fast.
            </h1>
            <p className="text-lg md:text-xl text-[#60758a] dark:text-gray-400 mb-8 max-w-lg leading-relaxed font-medium opacity-0 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              Managed sourcing and bulk deals connecting Europe to global buyers. We handle the vetting, logistics, and paperwork.
            </p>
            <div className="flex flex-wrap gap-4 mb-10 opacity-0 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <button 
                onClick={() => navigate('bulk')}
                className="h-14 px-8 rounded-xl bg-primary text-white text-base font-bold hover:bg-primary-dark transition-all shadow-xl shadow-primary/25 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                Request Sourcing
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
              <button 
                onClick={() => navigate('inventory')}
                className="h-14 px-8 rounded-xl bg-white dark:bg-[#1A2633] border border-gray-200 dark:border-gray-700 text-[#111418] dark:text-white text-base font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                Browse Inventory
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 text-sm text-[#60758a] dark:text-gray-400 font-semibold opacity-0 animate-fade-in-up" style={{animationDelay: '0.5s'}}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500 fill-1">check_circle</span>
                Verified Dealers
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500 fill-1">check_circle</span>
                Escrow Payment
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500 fill-1">check_circle</span>
                Export Handling
              </div>
            </div>
          </div>
          
          <div className="flex-1 relative hidden lg:block h-[500px] opacity-0 animate-fade-in" style={{animationDelay: '0.6s'}}>
             {/* Abstract visual element placeholder */}
             <div className="absolute top-10 right-10 w-[400px] h-[500px] bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDuration: '4s'}}></div>
          </div>
        </div>
      </section>

      {/* Featured Inventory Teaser */}
      <section className="py-20 px-4 md:px-10 lg:px-20 max-w-[1440px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#111418] dark:text-white mb-2">Featured Premium Inventory</h2>
            <p className="text-[#60758a] dark:text-gray-400">Hand-picked, inspected units ready for export.</p>
          </div>
          <button 
            onClick={() => navigate('inventory')}
            className="text-primary font-bold hover:underline flex items-center gap-1"
          >
            View all inventory
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div onClick={() => navigate('detail', '1')} className="group bg-white dark:bg-[#1e2a38] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300 cursor-pointer">
            <div className="relative h-64 overflow-hidden">
              <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuByrcrG4Yhq2OHgmW7V4alEjNzfQknzP72-q_5UzzsZBjpgR1C10AxObsssHBFFipElhf3wbqqvoS-I4MN6EQ-Wl7gj0M2E76XrAlyPDKakZSZTMqlX3dLqjxTjvqyw_tK8J1g_WVOS4HOKeyC5qh2QVu2GEVYuuMCiO3Te5RwzugNDl03ULH5wECCYXFU4MKpjanz8H5fTT38Qy3EnC6FCORf0jC2RWjufGpvmESQ-XyMkNbmx6ccpIWPLinFOVOji0OpcWlcA1g" alt="Truck" />
              <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur px-2 py-1 rounded text-xs font-bold text-[#111418] dark:text-white flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                VERIFIED
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-xl font-bold text-[#111418] dark:text-white mb-2">Scania R450 Streamline</h3>
              <div className="flex items-center gap-2 text-sm text-[#60758a] dark:text-gray-400 mb-4">
                <span>2019</span> • <span>540,000 km</span> • <span>Hamburg, DE</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-4">
                <div className="text-2xl font-bold text-[#111418] dark:text-white">€38,500</div>
                <span className="text-primary font-bold text-sm">View Details</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div onClick={() => navigate('detail', '2')} className="group bg-white dark:bg-[#1e2a38] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300 cursor-pointer">
            <div className="relative h-64 overflow-hidden">
              <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuABmu93-oINxcZNRVC2LPkiZtDLlR9ceAOMvhzDgZdnRZaBzyD1wW2xmyWWpz2pqCXAhJm6WJPHak8TRan2D_jzvMWplMhFSdocf-8RIRahTZvnLqV9RadFYsVCok59yoHdNKqfwK5ywEzwKeFvhCDuqVkaFVLlChwym6r8gNYaG6jKCDep2pKLvTD-dpBEH7Mi_kWXG28xM3tQTR5F5EwKUnZBsuKQgBjNT34qax9Sjt7rbzeMv_x8Qi9teiY3E_mHCbZYccqvow" alt="Volvo" />
              <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur px-2 py-1 rounded text-xs font-bold text-[#111418] dark:text-white flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                VERIFIED
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-xl font-bold text-[#111418] dark:text-white mb-2">Volvo FH500 Globetrotter</h3>
              <div className="flex items-center gap-2 text-sm text-[#60758a] dark:text-gray-400 mb-4">
                <span>2020</span> • <span>420,000 km</span> • <span>Rotterdam, NL</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-4">
                <div className="text-2xl font-bold text-[#111418] dark:text-white">€52,000</div>
                <span className="text-primary font-bold text-sm">View Details</span>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group bg-white dark:bg-[#1e2a38] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300 cursor-pointer">
            <div className="relative h-64 overflow-hidden">
              <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRWWi6RAzVHgxWGG92KEZjtA5uf5mRXVthUqt0Oe-zTH6m8zDlwPc7f-aX64QF8RyKfGO1MMDI4Iq83WUemCHJCKijC3nf1jVmSzWNypxHG4dKDDgei_j79rSHu-Tv7s4Pu7zVONz7gpGPwqRlpdZU87JDQXpe4VeThmZJKiMZA6e8TXnMHQAG4z22y7owO6WA5uE4vrfz5D5uooEoZSDqofAX4odI-tsGrUHuI9C-c4BUHRWlt7JiyDbQiA_vFqjVnajqYSHooQ" alt="CAT" />
            </div>
            <div className="p-5">
              <h3 className="text-xl font-bold text-[#111418] dark:text-white mb-2">Caterpillar 320 GC</h3>
              <div className="flex items-center gap-2 text-sm text-[#60758a] dark:text-gray-400 mb-4">
                <span>2021</span> • <span>2,400 hrs</span> • <span>Antwerp, BE</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-4">
                <div className="text-2xl font-bold text-[#111418] dark:text-white">€89,500</div>
                <span className="text-primary font-bold text-sm">View Details</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 md:px-10 lg:px-20 max-w-[1440px] mx-auto w-full">
        <div className="bg-primary rounded-2xl p-10 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/30">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">Ready to source your next fleet?</h2>
            <p className="text-blue-100 text-lg md:text-xl mb-12 font-medium">Join 2,000+ global buyers sourcing premium European equipment efficiently.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-5">
              <button onClick={() => navigate('bulk')} className="h-16 px-10 rounded-xl bg-white text-primary text-lg font-bold hover:bg-gray-50 transition-colors shadow-lg">
                Start Sourcing Request
              </button>
              <button onClick={() => navigate('inventory')} className="h-16 px-10 rounded-xl bg-[#08529d] text-white border border-white/20 text-lg font-bold hover:bg-[#06407a] transition-colors shadow-lg">
                Browse Inventory
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;