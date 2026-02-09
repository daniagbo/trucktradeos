import React, { useState } from 'react';
import { View } from '../App';

interface ListingDetailProps {
  navigate: (view: View, id?: string) => void;
  id: string | null;
  isMember: boolean;
}

const ListingDetail: React.FC<ListingDetailProps> = ({ navigate, id, isMember }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-10 py-6 relative">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
        <button onClick={() => navigate('inventory')} className="text-[#60758a] dark:text-gray-400 font-medium hover:text-primary transition-colors">Inventory</button>
        <span className="material-symbols-outlined text-[#60758a] text-[16px]">chevron_right</span>
        <button className="text-[#60758a] dark:text-gray-400 font-medium hover:text-primary transition-colors">Trucks</button>
        <span className="material-symbols-outlined text-[#60758a] text-[16px]">chevron_right</span>
        <span className="text-[#111418] dark:text-white font-medium">Scania R450 Topline</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Gallery, Specs, Description (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <div className="w-full aspect-[4/3] md:aspect-video rounded-2xl bg-gray-200 dark:bg-gray-800 overflow-hidden relative group cursor-pointer">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBRIwyCKLIAVtRLPtsyEUabL8auajh7gjWiMZRVK7zNrEW_LB7-EAD0WGKlnbbwBR1qo6dxS1D3OQkXjP6TRkefNLsp77oAw1utTA7gHTaJII13ZouL6iTcm4H27gi1H_lFJa9casQUh7MRHqvxUB6WQBIotVvDE6UsXERh1f7ECwdo9RFeu9T4n-NJKEVMVKPVVbDXqPsTv0goVRpbRtGgN8sibKG6onClNR3fksMfAqGDXglV03CJBt9103ECrlRA5DpLyJYhJw')"}}></div>
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">photo_library</span> 1/12
              </div>
            </div>
            <div className="grid grid-cols-5 gap-3">
               {[
                 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJ58IHQPXmZ0LV4r6J8Dn_nUBLVrcztQyNp0aNjic9j2lwB-kx9AfAgC5Qt0WtnmAIaHNS-BASn-rMwcWbtR4wxI0xMUxrD4zepn7PDVI-0aLZKDZU42TJ9lK6G-HEcs0GioOQP3l05yfjJu7r1xn7zWNsYQgRv9PmoZpcx1Qnu2c450QKG6HAQCjQXcWz1JvfHpS5YKPkrxYD1COHKOLNBpyszJUctjEe2u_YYLj9Kf2ugZmh_1P7DMRe40SelC-XoFuayDSTfw',
                 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUrpHR7wzgrMYmQ5Xeq8bZ4PiYhRf-gTRFkVObnWCXwGnc-Cp6dE8KOICf5K6iA9zt1W6nZXj-1yxTNl-jhz8ROI38-LiIi_6YY5gdpP_UUz5-7kIShttKiytyess3m8VqfKSCQ0LMlGqa0WdhPl8jcXU7l_6DhI3MuC0Hkbq8RCQig1uI7KHe_YSGDUzHh6L9AmrcwuYT2R0wq2g3uX28elMWvlHKS4wrpF_ZxAoel53ulMdIn5qgUZNoL0-QYbLQsnGShS24nw',
                 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQs2FWiES1hs2DNa7OR4RpJD1n33V06MRelxnc9d2Ak5sqEuYmGTa3uPvEI2qmIjs6r-hrLSHWDjCAgzhYq83Ol9uVHrLtgXMlYfLa1lMjanR4U2Ml1TLjbeyGJ35_z3PWq1MJ3ZTJh-QIuIdD2NWNQrlaogsCvVFlCQ7dkKYydH-QI7xASQSGuEGafyOi2H_65YqJCMnwjOMow19CuEwFx2MkC98T7fx-bnwoz_PTpDbTUHOh_9IOsYoPyr0c8yqLQGjHxkMp3A',
                 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZTome_FgNzI0Gzt0U9MZzkLJ3v0VCSZrWansKwmgVtEWS6Avb8a9f7EbeQir1ytrynoQGMpVnqAFMZMNGw8_-Tag61ajS2K0F3ibe5pH2KEHR3zNyG4fsgxzQCqU79CJdIQTZoEkTYB1ssXAGH3jNeYtafbd0yc6XjfduIJpzdyhOOApAgB5wFXqGbf7h5lDHaNMDkpeNUpdd6wrdnCB0bVlPsFUdBs9Sk796qm9GOOPVuGPXW1BYBwYqLpvyBeiWc4Bpdvf1MQ'
               ].map((src, i) => (
                 <div key={i} className="aspect-square rounded-lg bg-cover bg-center cursor-pointer hover:opacity-80 transition-opacity" style={{backgroundImage: `url('${src}')`}}></div>
               ))}
               <div className="aspect-square rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-[#60758a] hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-xs font-bold">+8</div>
            </div>
          </div>

          <section>
            <h3 className="text-xl font-bold mb-6 text-[#111418] dark:text-white">Technical Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              <div className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-primary"><span className="material-symbols-outlined">calendar_today</span></div>
                <div><p className="text-xs text-[#60758a] uppercase tracking-wide">First Registration</p><p className="text-base font-semibold text-[#111418] dark:text-white">March 2019</p></div>
              </div>
              <div className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-primary"><span className="material-symbols-outlined">speed</span></div>
                <div><p className="text-xs text-[#60758a] uppercase tracking-wide">Mileage</p><p className="text-base font-semibold text-[#111418] dark:text-white">482,000 km</p></div>
              </div>
              <div className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-primary"><span className="material-symbols-outlined">settings</span></div>
                <div><p className="text-xs text-[#60758a] uppercase tracking-wide">Transmission</p><p className="text-base font-semibold text-[#111418] dark:text-white">Automatic (Opticruise)</p></div>
              </div>
              <div className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-primary"><span className="material-symbols-outlined">eco</span></div>
                <div><p className="text-xs text-[#60758a] uppercase tracking-wide">Emission Class</p><p className="text-base font-semibold text-[#111418] dark:text-white">Euro 6</p></div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 text-[#111418] dark:text-white">Description</h3>
            <div className="text-[#60758a] dark:text-gray-300 leading-relaxed">
              <p className="mb-4">Exceptionally maintained Scania R450 Topline available for immediate sourcing. This unit features the highly reliable DC13 engine paired with Scania's Opticruise transmission for optimal fuel efficiency. The Topline cab offers premium driver comfort with dual bunks, refrigerator, and auxiliary heating.</p>
              <p>Recently serviced at certified Scania dealership in Rotterdam. Tires are Michelin X Multi Energy Z. Vehicle is equipped with retarder, adaptive cruise control, and lane keeping assist. Full service history available digitally.</p>
            </div>
          </section>
        </div>

        {/* Right Column: Sticky Summary Card (4 cols) */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 flex flex-col gap-6">
            <div className="bg-white dark:bg-[#1a2632] rounded-2xl p-6 md:p-8 shadow-sm border border-[#e5e7eb] dark:border-slate-700">
              <div className="mb-4">
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#111418] dark:text-white leading-tight mb-2">Scania R450 Topline</h1>
                <div className="flex items-center gap-2 text-[#60758a] dark:text-gray-400 text-sm">
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  <span>Rotterdam, NL</span> • <span>2019</span>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold mb-6 w-fit">
                <span className="material-symbols-outlined text-[14px]" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span> Used - Excellent
              </div>
              <div className="mb-8 pt-6 border-t border-gray-100 dark:border-slate-700">
                <p className="text-sm text-[#60758a] dark:text-gray-400 mb-1">Export Price (excl. VAT)</p>
                {isMember ? (
                  <p className="text-4xl font-extrabold text-[#111418] dark:text-white tracking-tight">€ 42,500</p>
                ) : (
                  <div className="flex flex-col items-start gap-1">
                     <p className="text-4xl font-extrabold text-gray-300 dark:text-gray-600 tracking-tight blur-sm select-none">€ 42,500</p>
                     <span className="text-xs font-bold text-primary">Sign in to view price</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <button className="w-full h-12 flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20">
                  <span>Request sourcing</span> <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
                
                {isMember ? (
                  <button className="w-full h-12 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-primary font-bold rounded-xl border border-blue-200 dark:border-blue-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">download</span> <span>Download Inspection Report</span>
                  </button>
                ) : (
                  <button className="w-full h-12 flex items-center justify-center gap-2 bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500 font-semibold rounded-xl border border-gray-200 dark:border-slate-700 cursor-not-allowed">
                    <span className="material-symbols-outlined text-[16px]">lock</span> <span>Sign in to unlock documents</span>
                  </button>
                )}
                
                <div className="flex items-center gap-3 pt-2">
                  <button className="flex-1 h-10 flex items-center justify-center gap-2 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-[#60758a] dark:text-gray-300 text-sm font-bold transition-colors">
                    <span className="material-symbols-outlined text-[18px]">favorite</span> Save
                  </button>
                  <button 
                    onClick={() => setShowShareModal(true)}
                    className="flex-1 h-10 flex items-center justify-center gap-2 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-[#60758a] dark:text-gray-300 text-sm font-bold transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">share</span> Share
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-4 justify-center text-xs text-[#60758a] dark:text-gray-500">
                <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">verified_user</span> Verified Seller</div>
                <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">shield</span> Secure Transaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowShareModal(false)}>
          <div className="bg-white dark:bg-[#1a2632] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-extrabold text-[#111418] dark:text-white">Share Listing</h3>
              <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {/* Body */}
            <div className="p-5">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { icon: 'mail', label: 'Email', color: 'bg-blue-100 text-blue-600' },
                  { icon: 'chat', label: 'Message', color: 'bg-green-100 text-green-600' },
                  { icon: 'link', label: 'Copy', color: 'bg-gray-100 text-gray-600' },
                  { icon: 'more_horiz', label: 'More', color: 'bg-purple-100 text-purple-600' }
                ].map((item) => (
                  <button key={item.label} className="flex flex-col items-center gap-2 group">
                    <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                    <span className="text-xs font-medium text-[#60758a] dark:text-gray-400">{item.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Copy Link Input */}
              <div className="p-1 pl-4 bg-gray-50 dark:bg-black/20 rounded-xl flex items-center gap-3 border border-gray-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="material-symbols-outlined text-gray-400 text-[20px]">link</span>
                <input readOnly value="https://fleetsource.com/l/scania-r450" className="bg-transparent border-none text-sm text-[#111418] dark:text-white w-full focus:ring-0 p-0 truncate font-medium" />
                <button 
                  onClick={handleCopyLink}
                  className={`h-9 px-4 rounded-lg text-sm font-bold transition-all ${isCopied ? 'bg-green-500 text-white' : 'bg-white dark:bg-slate-700 text-[#111418] dark:text-white shadow-sm hover:bg-gray-50'}`}
                >
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetail;