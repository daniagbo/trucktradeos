import React, { useState, useMemo } from 'react';
import { View } from '../App';

interface InventoryProps {
  navigate: (view: View, id?: string) => void;
  isMember: boolean;
}

const Inventory: React.FC<InventoryProps> = ({ navigate, isMember }) => {
  // State for filters
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300000]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const items = [
    { id: '1', name: '2023 Freightliner Cascadia', type: 'Truck', price: '$145,000', rawPrice: 145000, location: 'Rotterdam, NL', specs: ['45,000 km', '6x4 Drive', 'Diesel Euro 6', 'Automatic'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8pYbyKKiqGhRE9hlTBd1fbwtbdVepd50s40wnyfIkunBoVQNaxduk6j44oAJxV2mKKjfM_xgJQEctEooyLFVSa7BGkhf_Y-1-NSYIcy6MKO4M1W4Q0njHrXLzet5bzElwPOQQCwHan1DClvzHlwVHHkijD6HjMLfc-eDI9DbQHWenYZzJ8AoEft_0C3ghYaO1KCa2DH6L-FLgYdAc-1BI1V48dOt40htnFeLJtp9OV7ahAfJw9E5UW8MjRE6eaVECW463My4hlg' },
    { id: '2', name: '2022 Schmitz Cargobull', type: 'Trailer', price: '$38,900', rawPrice: 38900, location: 'Berlin, DE', specs: ['Curtainside', 'SAF Axles', '13.6m Length', 'Disc Brakes'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVJvURWqm4ZOma_TgDKaK0te28y-jAg9bXTylT7gQCh0agYLVywalMov94bQ4Iyat-Dwce9qFM3hCQVA4d0A5m2zk4Qhzf_b091K2XxAZgMm4DOisryeRjiEsnY2s48kFZTh2sbr-_wyP5h6vb56rJz9zTq6uLlI-Gtlm93xF3UB6dPPpx3jondidnWUCWx2RxFKCMdqJ1ZdsUEbozYTbcDLE6NlbGFlJRCy-5mLJc_R1wLTRTOZ-3TuLh1_TSo1ySJbQoGgC4Rg' },
    { id: '3', name: '2021 Volvo FH16 750', type: 'Truck', price: '$182,500', rawPrice: 182500, location: 'Gothenburg, SE', specs: ['112,000 km', 'Heavy Haulage', 'I-Shift', 'Globe XL'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGi-ip7u-OUZ-zpn3qICN4lPcddNayZVw1PWq5ALT_54-r6VEI1ovH2lpbjRwGyzdw2HPaJTPwzIDketNy1XabsFeBNqOm_bNyrFsoX5YXLrOiSLa_an0BhRNufQsYH1WKfeRsluzEZYGSxChTl5SqrOzcblfzLokJnasz-UDeYh4JPC1kYBw6Kc8zqjMot04yh9W6VODL0rAg9R4CYTjeTyBfKeVpboYsLqyVitFZifXRjt7X9o1BXuPg2LqjDMFJlsYnc9s0DQ' },
    { id: '4', name: '2020 MAN TGX 18.510', type: 'Truck', price: '$89,000', rawPrice: 89000, location: 'Munich, DE', specs: ['280,000 km', 'Euro 6d', '4x2', 'GX Cab'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-ldN-dUPMbpTHdHacofqzjPKuTw5s75JFizSPJcX0ZvMzYQz0yStMxMqGCompkVambz7E8MhG6izXnewVMHgnlDD5BPC8x7NPcA_s1Ci5GIDuxDk2FFMBQbVUuQ-PvXNq6-VJSK6T0ZCPJepxd4y8rDCx6yx4y1DlKxCyzSq7U1LQg9tiTk1Cf_v2FaoQOD5Vf7GHM18FJ-ydcq_0uZ-wpGHJ53hMGHwCg7ScWsnaGlhWbpnZDDS9xlzXKfumWg7E-OcvkoxtYg' },
    { id: '5', name: '2019 Mercedes-Benz Citaro K', type: 'Bus', price: '$45,500', rawPrice: 45500, location: 'Lyon, FR', specs: ['City Bus', 'Euro 6', '32 Seats', 'Automatic'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRWWi6RAzVHgxWGG92KEZjtA5uf5mRXVthUqt0Oe-zTH6m8zDlwPc7f-aX64QF8RyKfGO1MMDI4Iq83WUemCHJCKijC3nf1jVmSzWNypxHG4dKDDgei_j79rSHu-Tv7s4Pu7zVONz7gpGPwqRlpdZU87JDQXpe4VeThmZJKiMZA6e8TXnMHQAG4z22y7owO6WA5uE4vrfz5D5uooEoZSDqofAX4odI-tsGrUHuI9C-c4BUHRWlt7JiyDbQiA_vFqjVnajqYSHooQ' },
  ];

  const manufacturers = ['Volvo', 'Scania', 'MAN', 'Mercedes-Benz', 'Caterpillar', 'Freightliner', 'Schmitz Cargobull'];
  const categories = ['All', 'Trucks', 'Trailers', 'Buses', 'Specialty'];

  // Derived filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Filter by Category
      let matchesCategory = true;
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Trucks' && item.type !== 'Truck') matchesCategory = false;
        if (selectedCategory === 'Trailers' && item.type !== 'Trailer') matchesCategory = false;
        if (selectedCategory === 'Buses' && item.type !== 'Bus') matchesCategory = false;
        if (selectedCategory === 'Specialty' && item.type !== 'Specialty') matchesCategory = false;
      }

      // Filter by Manufacturer
      const matchesManufacturer = selectedManufacturers.length === 0 || selectedManufacturers.some(m => item.name.toLowerCase().includes(m.toLowerCase()));
      
      // Filter by Price
      const matchesPrice = item.rawPrice >= priceRange[0] && item.rawPrice <= priceRange[1];

      return matchesCategory && matchesManufacturer && matchesPrice;
    });
  }, [selectedCategory, selectedManufacturers, priceRange, items]);

  const toggleManufacturer = (m: string) => {
    setSelectedManufacturers(prev => 
      prev.includes(m) ? prev.filter(i => i !== m) : [...prev, m]
    );
  };

  const handlePriceChange = (index: 0 | 1, value: string) => {
    const val = parseInt(value) || 0;
    const newRange: [number, number] = [priceRange[0], priceRange[1]];
    newRange[index] = val;
    setPriceRange(newRange);
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto px-4 md:px-10 lg:px-20 py-8 relative">
      
      {/* Click outside handler for dropdowns */}
      {activeFilter && (
        <div className="fixed inset-0 z-30 bg-transparent" onClick={() => setActiveFilter(null)}></div>
      )}

      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#111318] dark:text-white text-4xl font-black tracking-tight">Inventory</h1>
          {isMember ? (
            <p className="text-green-600 dark:text-green-400 text-base font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] fill-1">verified_user</span>
              Member access: documents and extra details unlocked.
            </p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-base font-normal flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">lock</span>
              Visitor mode. <span className="text-primary font-bold cursor-pointer hover:underline">Sign in</span> to unlock full pricing and history reports.
            </p>
          )}
        </div>
        <button className="flex items-center justify-center gap-2 rounded-xl h-10 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[#111318] dark:text-white text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <span className="material-symbols-outlined text-[18px]">download</span>
          <span>Export Inventory</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-[73px] z-40 bg-[#f6f6f8] dark:bg-[#101622] py-4 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="flex items-center h-12 w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="material-symbols-outlined text-gray-400">search</span>
              <input 
                className="flex-1 border-none bg-transparent focus:ring-0 text-[#111318] dark:text-white placeholder:text-gray-400 text-base ml-2" 
                placeholder="Search fleet inventory by model or VIN..." 
                aria-label="Search inventory by model or VIN"
              />
            </label>
          </div>
          <div 
            className="flex h-12 items-center rounded-xl bg-gray-100 dark:bg-gray-800 p-1 min-w-[320px] overflow-x-auto no-scrollbar"
            role="radiogroup" 
            aria-label="Vehicle Category"
          >
            {categories.map((cat, idx) => (
              <label 
                key={cat} 
                className={`flex cursor-pointer h-full grow items-center justify-center rounded-lg px-4 whitespace-nowrap text-sm font-bold transition-all focus-within:ring-2 focus-within:ring-primary/50 ${selectedCategory === cat ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-primary'}`}
              >
                {cat}
                <input 
                  type="radio" 
                  name="category" 
                  className="sr-only" 
                  checked={selectedCategory === cat} 
                  onChange={() => setSelectedCategory(cat)}
                  aria-label={`Category ${cat}`}
                />
              </label>
            ))}
          </div>
        </div>
        
        {/* Interactive Filters */}
        <div className="flex items-center justify-between overflow-x-auto pb-2 scrollbar-hide relative">
          <div className="flex gap-2 relative">
            
            {/* Manufacturer Filter */}
            <div className="relative">
              <button 
                onClick={() => setActiveFilter(activeFilter === 'manufacturer' ? null : 'manufacturer')}
                aria-expanded={activeFilter === 'manufacturer'}
                aria-haspopup="true"
                aria-controls="manufacturer-filter-dropdown"
                className={`flex h-9 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors ${activeFilter === 'manufacturer' || selectedManufacturers.length > 0 ? 'bg-blue-50 dark:bg-blue-900/30 border-primary text-primary' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-[#111318] dark:text-white hover:border-primary'}`}
              >
                <span>Manufacturer {selectedManufacturers.length > 0 && `(${selectedManufacturers.length})`}</span>
                <span className="material-symbols-outlined text-[18px]">{activeFilter === 'manufacturer' ? 'expand_less' : 'expand_more'}</span>
              </button>
              
              {activeFilter === 'manufacturer' && (
                <div 
                  id="manufacturer-filter-dropdown"
                  className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 z-50 p-3 flex flex-col gap-2 animate-fade-in-up" 
                  style={{animationDuration: '0.2s'}}
                  role="group"
                  aria-label="Filter by Manufacturer"
                >
                  {manufacturers.map(m => (
                    <label key={m} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedManufacturers.includes(m)}
                        onChange={() => toggleManufacturer(m)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                        aria-label={`Select ${m}`}
                      />
                      <span className="text-sm font-medium text-[#111318] dark:text-white">{m}</span>
                    </label>
                  ))}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between">
                    <button onClick={() => setSelectedManufacturers([])} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1">Clear</button>
                    <button onClick={() => setActiveFilter(null)} className="text-xs font-bold text-primary px-2 py-1">Done</button>
                  </div>
                </div>
              )}
            </div>

            {/* Price Filter */}
            <div className="relative">
              <button 
                onClick={() => setActiveFilter(activeFilter === 'price' ? null : 'price')}
                aria-expanded={activeFilter === 'price'}
                aria-haspopup="true"
                aria-controls="price-filter-dropdown"
                className={`flex h-9 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors ${activeFilter === 'price' || priceRange[0] > 0 || priceRange[1] < 300000 ? 'bg-blue-50 dark:bg-blue-900/30 border-primary text-primary' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-[#111318] dark:text-white hover:border-primary'}`}
              >
                <span>Price Range</span>
                <span className="material-symbols-outlined text-[18px]">{activeFilter === 'price' ? 'expand_less' : 'expand_more'}</span>
              </button>

              {activeFilter === 'price' && (
                <div 
                  id="price-filter-dropdown"
                  className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 z-50 p-4 animate-fade-in-up" 
                  style={{animationDuration: '0.2s'}}
                  role="group"
                  aria-label="Filter by Price Range"
                >
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-2 block" id="price-slider-label">Price Range ($)</label>
                      <div className="relative pt-6 pb-2">
                        {/* Simple range slider for Max Price visualization */}
                        <input 
                          type="range" 
                          min="0" 
                          max="300000" 
                          step="5000"
                          value={priceRange[1]} 
                          onChange={(e) => handlePriceChange(1, e.target.value)}
                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                          aria-labelledby="price-slider-label"
                          aria-valuemin={0}
                          aria-valuemax={300000}
                          aria-valuenow={priceRange[1]}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label htmlFor="min-price-input" className="text-xs text-gray-400 block mb-1">Min</label>
                        <input 
                          id="min-price-input"
                          type="number" 
                          value={priceRange[0]} 
                          onChange={(e) => handlePriceChange(0, e.target.value)}
                          className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm p-2"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="max-price-input" className="text-xs text-gray-400 block mb-1">Max</label>
                        <input 
                          id="max-price-input"
                          type="number" 
                          value={priceRange[1]} 
                          onChange={(e) => handlePriceChange(1, e.target.value)}
                          className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm p-2"
                        />
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                      <button onClick={() => setPriceRange([0, 300000])} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Reset</button>
                      <button onClick={() => setActiveFilter(null)} className="text-xs font-bold text-white bg-primary rounded-lg px-3 py-1.5 hover:bg-primary-dark">Apply Filter</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Other Static Filters */}
            {['Year', 'Country', 'Condition'].map(filter => (
              <button 
                key={filter} 
                className="flex h-9 shrink-0 items-center gap-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 text-[#111318] dark:text-white text-sm font-medium hover:border-primary transition-colors"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <span>{filter}</span>
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>
            ))}
          </div>
          <button className="flex h-9 items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 px-4 text-[#111318] dark:text-white text-sm font-bold ml-4">
            <span className="material-symbols-outlined text-[20px]">tune</span>
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 group hover:shadow-md transition-shadow">
              <div 
                className="relative h-56 w-full cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/20"
                onClick={() => navigate('detail', item.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, () => navigate('detail', item.id))}
                aria-label={`View details for ${item.name}`}
              >
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{backgroundImage: `url("${item.img}")`}}></div>
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit">
                    <span className="material-symbols-outlined text-[14px] fill-1">verified</span> Verified Source
                  </span>
                </div>
                {/* Type Badge */}
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-white">
                  {item.type}
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-[#111318] dark:text-white">{item.name}</h3>
                    <p className="text-sm text-gray-500 font-medium">{item.location}</p>
                  </div>
                  <div className="text-right">
                    {isMember ? (
                      <p className="text-2xl font-extrabold text-primary">{item.price}</p>
                    ) : (
                      <p className="text-lg font-bold text-gray-400 blur-[4px] select-none" aria-label="Price hidden, sign in to view">$XXX,XXX</p>
                    )}
                    <p className="text-xs text-gray-400">Excl. VAT</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.specs.map(spec => (
                    <span key={spec} className="bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300">{spec}</span>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => navigate('detail', item.id)} className="flex-1 bg-primary text-white font-bold h-12 rounded-xl hover:bg-primary/90 transition-colors">Request offer</button>
                  <button onClick={() => navigate('detail', item.id)} className="flex-1 border border-gray-200 dark:border-gray-700 text-[#111318] dark:text-white font-bold h-12 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">View details</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 animate-fade-in text-center">
            <div className="relative w-24 h-24 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-6 ring-8 ring-gray-50/50 dark:ring-gray-800/30">
               <span className="material-symbols-outlined text-[48px] text-gray-400 dark:text-gray-500">search_off</span>
            </div>
            
            <h3 className="text-2xl font-extrabold text-[#111318] dark:text-white mb-3 tracking-tight">No inventory matches your search</h3>
            
            <div className="max-w-md mx-auto mb-8">
              <p className="text-[#60758a] dark:text-gray-400 leading-relaxed mb-6">
                We couldn't find any vehicles matching your specific criteria.
              </p>
              <div className="text-sm text-[#60758a] dark:text-gray-400 text-left bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                <p className="font-bold text-[#111318] dark:text-white mb-3">Suggestions:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">check_circle</span>
                    <span>Try selecting a different category (e.g., Trucks vs Buses)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">check_circle</span>
                    <span>Try adjusting your price range sliders to include more options</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">check_circle</span>
                    <span>Clear individual filters instead of all at once</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <button 
              onClick={() => { setSelectedManufacturers([]); setPriceRange([0, 300000]); setSelectedCategory('All'); }}
              className="h-12 px-8 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary-dark hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
            >
              <span className="material-symbols-outlined">filter_alt_off</span>
              Clear All Filters
            </button>
          </div>
        )}
      </div>
      
      {/* Pagination (Hide if no items) */}
      {filteredItems.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-12 py-10">
          <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400" aria-label="Previous page"><span className="material-symbols-outlined">chevron_left</span></button>
          <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary text-white font-bold shadow-md shadow-primary/20" aria-current="page">1</button>
          <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">2</button>
          <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400" aria-label="Next page"><span className="material-symbols-outlined">chevron_right</span></button>
        </div>
      )}
    </div>
  );
};

export default Inventory;