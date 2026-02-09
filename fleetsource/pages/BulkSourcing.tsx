import React from 'react';
import { View } from '../App';

interface BulkSourcingProps {
  navigate: (view: View, id?: string) => void;
  isMember: boolean;
}

const BulkSourcing: React.FC<BulkSourcingProps> = ({ navigate, isMember }) => {
  return (
    <div className="flex flex-col">
      <div className="px-4 md:px-40 flex flex-1 justify-center py-5">
        <div className="flex flex-col max-w-[960px] flex-1">
          <div className="@container">
            <div className="@[480px]:p-4">
              <div className="flex min-h-[400px] flex-col gap-6 bg-cover bg-center bg-no-repeat @[480px]:gap-8 @[480px]:rounded-xl items-start justify-end px-4 pb-10 @[480px]:px-10 relative overflow-hidden group" style={{backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.6) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuCA5FCVdQCybSRNiPFrjaef6Y76642OReenLPkHuYl10bgSx5RXj8Qs3zX3d_J9j23nyNeaBAb6Y2wGgvqVVRd--Br2veaZlmr6CgBrbGUKsihmTm0R4t1aFc7ognVnpACOwuTU4CdRUI0ZXoaE7nGevy1ucgoGNGVme5ZuKNu9CzFljV79siNVFN4iNWnsEog0cCoIhjjdwJy5xZBLeO2cBWjXUuCDTnLX0yI-1wgbNhNKVz3n4oZ0umWVhwz1h0njqsZm0zQUjw")'}}>
                <div className="flex flex-col gap-2 text-left z-10">
                  <h1 className="text-white text-4xl font-black leading-tight max-w-2xl">Bulk lots, fleet renewal, export orders.</h1>
                  <h2 className="text-gray-200 text-sm font-normal leading-normal @[480px]:text-lg max-w-xl">Dedicated sourcing desk for high-volume buyers. Secure 50-200 units per order.</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col pb-20 pt-10">
        <div className="px-4 md:px-40 flex flex-1 justify-center">
          <div className="flex flex-col max-w-[960px] flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-4">
              <div className="lg:col-span-5 flex flex-col justify-center gap-6">
                <div>
                  <h2 className="text-[#111418] dark:text-white text-[32px] font-bold leading-tight mb-4">Submit Bulk Request</h2>
                  <p className="text-[#60758a] dark:text-[#9aaebd] text-lg leading-relaxed">Tell us what you need. Our sourcing experts will analyze the market and return with a preliminary fleet proposal within 48 hours.</p>
                </div>
                <div className="flex flex-col gap-4 mt-4">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined">support_agent</span></div>
                    <div className="flex flex-col"><span className="font-bold text-[#111418] dark:text-white">Dedicated Agent</span><span className="text-sm text-[#60758a] dark:text-[#9aaebd]">Single point of contact for your order</span></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined">gavel</span></div>
                    <div className="flex flex-col"><span className="font-bold text-[#111418] dark:text-white">Negotiated Rates</span><span className="text-sm text-[#60758a] dark:text-[#9aaebd]">Wholesale pricing on bulk lots</span></div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="bg-white dark:bg-[#1a2632] p-6 md:p-8 rounded-2xl border border-[#dbe0e6] dark:border-[#304150] shadow-sm">
                  <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); alert("Request Submitted!"); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[#111418] dark:text-white text-sm font-medium leading-normal">Equipment Category</label>
                        <div className="relative">
                          <select className="w-full h-12 rounded-xl border border-[#dbe0e6] dark:border-[#304150] bg-[#f5f7f8] dark:bg-[#101922] px-4 text-[#111418] dark:text-white text-base focus:border-primary focus:ring-0 appearance-none">
                            <option>Select category</option>
                            <option>Excavators (Tracked)</option>
                            <option>Wheel Loaders</option>
                            <option>Dump Trucks</option>
                            <option>Mixed Lot</option>
                          </select>
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#60758a]"><span className="material-symbols-outlined">expand_more</span></span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[#111418] dark:text-white text-sm font-medium leading-normal">Quantity (Units)</label>
                        <input className="w-full h-12 rounded-xl border border-[#dbe0e6] dark:border-[#304150] bg-[#f5f7f8] dark:bg-[#101922] px-4 text-[#111418] dark:text-white text-base focus:border-primary focus:ring-0 placeholder:text-[#9aaebd]" placeholder="Min. 20" type="number"/>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[#111418] dark:text-white text-sm font-medium leading-normal">Year Range</label>
                        <input className="w-full h-12 rounded-xl border border-[#dbe0e6] dark:border-[#304150] bg-[#f5f7f8] dark:bg-[#101922] px-4 text-[#111418] dark:text-white text-base focus:border-primary focus:ring-0 placeholder:text-[#9aaebd]" placeholder="e.g. 2018-2022" type="text"/>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[#111418] dark:text-white text-sm font-medium leading-normal">Total Budget Range <span className="text-[#60758a] font-normal">(Optional)</span></label>
                        <input className="w-full h-12 rounded-xl border border-[#dbe0e6] dark:border-[#304150] bg-[#f5f7f8] dark:bg-[#101922] px-4 text-[#111418] dark:text-white text-base focus:border-primary focus:ring-0 placeholder:text-[#9aaebd]" placeholder="e.g. $1M - $1.5M" type="text"/>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[#111418] dark:text-white text-sm font-medium leading-normal">Ship-to Country / Destination Port</label>
                      <div className="relative">
                        <input className="w-full h-12 rounded-xl border border-[#dbe0e6] dark:border-[#304150] bg-[#f5f7f8] dark:bg-[#101922] pl-11 pr-4 text-[#111418] dark:text-white text-base focus:border-primary focus:ring-0 placeholder:text-[#9aaebd]" placeholder="e.g. Port of Rotterdam, Netherlands" type="text"/>
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#60758a]"><span className="material-symbols-outlined text-[20px]">anchor</span></span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-6 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                        <span className="truncate">Submit bulk request</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkSourcing;