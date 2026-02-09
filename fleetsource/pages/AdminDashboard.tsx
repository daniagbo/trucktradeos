import React, { useState, useEffect } from 'react';
import { View } from '../App';

interface AdminDashboardProps {
  navigate: (view: View, id?: string) => void;
  isMember: boolean;
}

interface UploadedFile {
  name: string;
  date: string;
  size: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigate, isMember }) => {
  const [activeStatus, setActiveStatus] = useState('All');
  const [sortBy, setSortBy] = useState('Date');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Status Menu State
  const [statusMenuOpenId, setStatusMenuOpenId] = useState<string | null>(null);

  // File Upload State
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile[]>>({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Initial Data
  const [rfqList, setRfqList] = useState([
    { 
      id: '#RFQ-2024-8831', 
      company: 'Global Logistics S.A.', 
      cat: 'Spare Parts', 
      dest: 'Rotterdam, NL', 
      status: 'Received', 
      urgency: 'Critical', 
      time: '2 hours ago', 
      statusColor: 'yellow', 
      urgencyColor: 'red', 
      timestamp: Date.now() - 7200000,
      contact: { name: 'Willem Jansen', email: 'w.jansen@globallogistics.nl', phone: '+31 10 798 5500' },
      details: 'Urgent requirement for Scania DC13 engine overhaul kits. Must include all gaskets, seals, and cylinder liners. OEM parts preferred, aftermarket acceptable if certified.',
      history: [
        { time: 'Today, 09:15', action: 'Request received via Portal' },
        { time: 'Today, 09:30', action: 'Automated acknowledgment sent' }
      ]
    },
    { 
      id: '#RFQ-2024-8792', 
      company: 'North Star Fleet', 
      cat: 'Lubricants', 
      dest: 'Singapore, SG', 
      status: 'In Progress', 
      urgency: 'Standard', 
      time: 'Yesterday, 14:20', 
      statusColor: 'blue', 
      urgencyColor: 'gray', 
      timestamp: Date.now() - 86400000,
      contact: { name: 'Sarah Chen', email: 'schen@northstar.sg', phone: '+65 6745 9921' },
      details: 'Bulk order for 5000L Shell Rimula R4 X 15W-40. Require delivery to Jurong Port within 5 working days. Palletized packaging required.',
      history: [
        { time: 'Yesterday, 14:20', action: 'Request received' },
        { time: 'Yesterday, 15:45', action: 'Assigned to Agent: Mike Ross' },
        { time: 'Today, 08:00', action: 'Supplier check in progress' }
      ]
    },
    { 
      id: '#RFQ-2024-8710', 
      company: 'Oceanic Express Ltd', 
      cat: 'Engine Overhaul', 
      dest: 'Jebel Ali, AE', 
      status: 'Offer Sent', 
      urgency: 'High', 
      time: '3 days ago', 
      statusColor: 'green', 
      urgencyColor: 'orange', 
      timestamp: Date.now() - 259200000,
      contact: { name: 'Ahmed Al-Fayed', email: 'procurement@oceanic.ae', phone: '+971 4 881 2233' },
      details: 'Full rebuild kit for Caterpillar 3512C marine generator. Include new turbochargers and fuel injectors in quote.',
      history: [
        { time: '3 days ago', action: 'Request received' },
        { time: '2 days ago', action: 'Quote generated #Q-9921' },
        { time: 'Yesterday, 10:00', action: 'Offer sent to client' }
      ]
    },
    { 
      id: '#RFQ-2024-8655', 
      company: 'Atlantic Marine', 
      cat: 'Safety Gear', 
      dest: 'New York, US', 
      status: 'Closed', 
      urgency: 'Standard', 
      time: 'May 12, 2024', 
      statusColor: 'gray', 
      urgencyColor: 'gray', 
      timestamp: 1715472000000,
      contact: { name: 'John Smith', email: 'j.smith@atlanticmarine.us', phone: '+1 212 555 0199' },
      details: 'Restock of 50x Immersion Suits (SOLAS approved) and 200x Life Jackets with lights. Sizes L and XL mixed.',
      history: [
        { time: 'May 12, 08:00', action: 'Request received' },
        { time: 'May 13, 14:00', action: 'Offer accepted' },
        { time: 'May 15, 09:00', action: 'Order fulfilled & Closed' }
      ]
    },
    { 
      id: '#RFQ-2024-8522', 
      company: 'Mediterranean Shipping', 
      cat: 'Filters', 
      dest: 'Naples, IT', 
      status: 'Received', 
      urgency: 'High', 
      time: '4 hours ago', 
      statusColor: 'yellow', 
      urgencyColor: 'orange', 
      timestamp: Date.now() - 14400000,
      contact: { name: 'Marco Rossi', email: 'm.rossi@medshipping.it', phone: '+39 081 555 1234' },
      details: 'Urgent: Fleetguard filter set for 3x MAN TGX 26.440. Oil, Fuel, and Air filters needed immediately.',
      history: [
        { time: 'Today, 11:00', action: 'Request received' }
      ]
    },
    { 
      id: '#RFQ-2024-8411', 
      company: 'Pacific Drilling', 
      cat: 'Hydraulics', 
      dest: 'Houston, US', 
      status: 'In Progress', 
      urgency: 'Critical', 
      time: '2 days ago', 
      statusColor: 'blue', 
      urgencyColor: 'red', 
      timestamp: Date.now() - 172800000,
      contact: { name: 'Robert Ford', email: 'bob.ford@pacificdrilling.com', phone: '+1 713 555 6789' },
      details: 'Hydraulic pump replacement for crane unit. Part No: Rexroth A4VSO. Require air freight to Houston immediately.',
      history: [
        { time: '2 days ago', action: 'Request received' },
        { time: '2 days ago', action: 'Priority escalation to Sourcing Lead' },
        { time: 'Yesterday, 09:00', action: 'Supplier identified in Germany' }
      ]
    },
    { 
      id: '#RFQ-2024-8399', 
      company: 'Baltic Sea Transport', 
      cat: 'Navigation', 
      dest: 'Gdansk, PL', 
      status: 'Received', 
      urgency: 'Standard', 
      time: '3 days ago', 
      statusColor: 'yellow', 
      urgencyColor: 'gray', 
      timestamp: Date.now() - 260000000,
      contact: { name: 'Piotr Kowalski', email: 'p.kowalski@baltictrans.pl', phone: '+48 58 555 4321' },
      details: 'Inquiry for Furuno Radar magnetron replacement. Model FAR-2117. Also quote for installation service.',
      history: [
        { time: '3 days ago', action: 'Request received' }
      ]
    },
    { 
      id: '#RFQ-2024-8350', 
      company: 'Aegean Cargo', 
      cat: 'Safety', 
      dest: 'Athens, GR', 
      status: 'In Progress', 
      urgency: 'High', 
      time: '4 days ago', 
      statusColor: 'blue', 
      urgencyColor: 'orange', 
      timestamp: Date.now() - 345600000,
      contact: { name: 'Nikos Papadopoulos', email: 'nikos@aegeancargo.gr', phone: '+30 210 555 9876' },
      details: 'Firefighting equipment inspection and replacement of expired hoses. 20x 15m hoses with Storz coupling.',
      history: [
        { time: '4 days ago', action: 'Request received' },
        { time: '3 days ago', action: 'Technical clarification sent' },
        { time: '2 days ago', action: 'Clarification received' }
      ]
    },
    { 
      id: '#RFQ-2024-8321', 
      company: 'Nordic Bulk', 
      cat: 'Engine Parts', 
      dest: 'Oslo, NO', 
      status: 'Received', 
      urgency: 'Standard', 
      time: '5 days ago', 
      statusColor: 'yellow', 
      urgencyColor: 'gray', 
      timestamp: Date.now() - 432000000,
      contact: { name: 'Lars Jensen', email: 'l.jensen@nordicbulk.no', phone: '+47 22 55 12 34' },
      details: 'Volvo Penta D13 injector set. Remanufactured or New. Quantity: 6 units.',
      history: [
        { time: '5 days ago', action: 'Request received' }
      ]
    },
    { 
      id: '#RFQ-2024-8288', 
      company: 'Iberia Freight', 
      cat: 'Tires', 
      dest: 'Valencia, ES', 
      status: 'Closed', 
      urgency: 'Standard', 
      time: 'Last week', 
      statusColor: 'gray', 
      urgencyColor: 'gray', 
      timestamp: Date.now() - 604800000,
      contact: { name: 'Maria Garcia', email: 'm.garcia@iberiafreight.es', phone: '+34 96 555 6789' },
      details: 'Bridgestone R249 steer tires. 315/80 R22.5. Quantity: 12. Delivery to warehouse Valencia.',
      history: [
        { time: '7 days ago', action: 'Request received' },
        { time: '6 days ago', action: 'Quote sent' },
        { time: '5 days ago', action: 'Order confirmed' }
      ]
    },
    { 
      id: '#RFQ-2024-8245', 
      company: 'Black Sea Logistics', 
      cat: 'Electronics', 
      dest: 'Constanta, RO', 
      status: 'Offer Sent', 
      urgency: 'Critical', 
      time: 'Last week', 
      statusColor: 'green', 
      urgencyColor: 'red', 
      timestamp: Date.now() - 691200000,
      contact: { name: 'Andrei Popescu', email: 'a.popescu@bsl.ro', phone: '+40 241 555 111' },
      details: 'ECU replacement for Mercedes Actros MP4. Part number A 000 446 48 02. Programming required.',
      history: [
        { time: '8 days ago', action: 'Request received' },
        { time: '8 days ago', action: 'Part located in Germany' },
        { time: '7 days ago', action: 'Offer sent with express shipping' }
      ]
    },
    { 
      id: '#RFQ-2024-8210', 
      company: 'Hamburg Süd', 
      cat: 'Container Parts', 
      dest: 'Hamburg, DE', 
      status: 'Received', 
      urgency: 'Low', 
      time: '2 weeks ago', 
      statusColor: 'yellow', 
      urgencyColor: 'gray', 
      timestamp: Date.now() - 1209600000,
      contact: { name: 'Hans Mueller', email: 'h.mueller@hamburgsud.com', phone: '+49 40 3705 0' },
      details: 'Container twistlocks (manual). Quantity: 500. Standard ISO type.',
      history: [
        { time: '14 days ago', action: 'Request received' }
      ]
    },
    { 
      id: '#RFQ-2024-8188', 
      company: 'CMA CGM', 
      cat: 'Hydraulics', 
      dest: 'Marseille, FR', 
      status: 'In Progress', 
      urgency: 'High', 
      time: '2 weeks ago', 
      statusColor: 'blue', 
      urgencyColor: 'orange', 
      timestamp: Date.now() - 1296000000,
      contact: { name: 'Jean Dubois', email: 'j.dubois@cma-cgm.com', phone: '+33 4 88 91 90 00' },
      details: 'Steering gear hydraulic seal kit. MacGregor Hatlapa. Ship arriving Marseille drydock on 25th.',
      history: [
        { time: '15 days ago', action: 'Request received' },
        { time: '14 days ago', action: 'Technical drawings requested' },
        { time: '12 days ago', action: 'Drawings received, sourcing seals' }
      ]
    },
  ]);

  // Load files from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('fleet_rfq_uploads');
    if (saved) {
      try {
        setUploadedFiles(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse uploads", e);
      }
    }
  }, []);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
    setExpandedRowId(null); // Close expanded details on filter change
  }, [activeStatus, searchQuery, sortBy]);

  const toggleExpand = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, rfqId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newFile: UploadedFile = {
      name: file.name,
      date: new Date().toLocaleDateString(),
      size: file.size < 1024 * 1024 
        ? (file.size / 1024).toFixed(1) + ' KB' 
        : (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    };

    const currentFiles = uploadedFiles[rfqId] || [];
    const updatedFiles = { ...uploadedFiles, [rfqId]: [...currentFiles, newFile] };
    
    setUploadedFiles(updatedFiles);
    localStorage.setItem('fleet_rfq_uploads', JSON.stringify(updatedFiles));
    
    // Reset input
    e.target.value = '';
  };

  const deleteFile = (rfqId: string, fileName: string) => {
     const currentFiles = uploadedFiles[rfqId] || [];
     const updatedFiles = { 
       ...uploadedFiles, 
       [rfqId]: currentFiles.filter(f => f.name !== fileName) 
     };
     setUploadedFiles(updatedFiles);
     localStorage.setItem('fleet_rfq_uploads', JSON.stringify(updatedFiles));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Received': return 'yellow';
      case 'In Progress': return 'blue';
      case 'Offer Sent': return 'green';
      case 'Closed': return 'gray';
      default: return 'gray';
    }
  };

  // Helper to get consistent styling classes based on color name
  const getStatusClasses = (color: string) => {
    switch (color) {
      case 'yellow': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 hover:text-yellow-800 border border-yellow-200';
      case 'blue': return 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 border border-blue-200';
      case 'green': return 'bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800 border border-green-200';
      case 'gray': return 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700 border border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  const handleStatusUpdate = (id: string, newStatus: string) => {
    setRfqList(prevList => prevList.map(req => {
      if (req.id === id) {
        return {
          ...req,
          status: newStatus,
          statusColor: getStatusColor(newStatus),
          history: [...req.history, { time: 'Just now', action: `Status updated to ${newStatus}` }]
        };
      }
      return req;
    }));
    setStatusMenuOpenId(null);
  };

  // If user is not a member (or specifically admin, but simplifying for this request), show access denied
  if (!isMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-gray-400">lock</span>
        </div>
        <h2 className="text-3xl font-black text-[#111318] dark:text-white mb-2">Access Restricted</h2>
        <p className="text-gray-500 max-w-md mb-8">This dashboard is available to registered members and fleet managers only. Please sign in to access your RFQ inbox.</p>
        <button 
          onClick={() => document.querySelector<HTMLButtonElement>('header button:last-child')?.click()} // Hacky way to trigger login for demo
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors"
        >
          Sign In to Continue
        </button>
      </div>
    );
  }

  const statuses = ['All', 'Received', 'In Progress', 'Offer Sent', 'Closed'];
  const sortOptions = ['Date', 'Company Name', 'Status', 'Urgency', 'Destination'];

  // 1. Filter
  const filteredRequests = rfqList.filter(r => {
    const matchesStatus = activeStatus === 'All' || r.status === activeStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      r.company.toLowerCase().includes(query) || 
      r.id.toLowerCase().includes(query) || 
      r.cat.toLowerCase().includes(query);
      
    return matchesStatus && matchesSearch;
  });

  // 2. Sort
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'Date') return b.timestamp - a.timestamp;
    if (sortBy === 'Company Name') return a.company.localeCompare(b.company);
    if (sortBy === 'Status') return a.status.localeCompare(b.status);
    if (sortBy === 'Destination') return a.dest.localeCompare(b.dest);
    if (sortBy === 'Urgency') {
      const weights: Record<string, number> = { 'Critical': 3, 'High': 2, 'Standard': 1, 'Low': 0 };
      return (weights[b.urgency] || 0) - (weights[a.urgency] || 0);
    }
    return 0;
  });

  // 3. Paginate
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);

  const getCount = (status: string) => {
    if (status === 'All') return rfqList.length;
    return rfqList.filter(r => r.status === status).length;
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 relative" onClick={() => setStatusMenuOpenId(null)}>
      {/* Click outside to close sort dropdown */}
      {isSortOpen && <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsSortOpen(false)}></div>}

      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black tracking-tight text-[#111318] dark:text-white">RFQ Inbox</h1>
          <p className="text-[#616f89] dark:text-gray-400 text-base font-medium">Manage and triage incoming sourcing requests from partners globally.</p>
        </div>
        <button className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2">
          <span className="material-symbols-outlined">add</span> New Entry
        </button>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-[65px] z-40 bg-background-light dark:bg-background-dark py-4 space-y-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col xl:flex-row gap-4">
          <div className="flex-1 flex gap-3">
            <div className="relative flex-1 flex items-center h-11 w-full rounded-lg bg-[#f0f2f4] dark:bg-gray-800 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <div className="text-[#616f89] pl-4 flex items-center pointer-events-none"><span className="material-symbols-outlined">search</span></div>
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder:text-[#616f89] dark:text-gray-200 text-[#111318] dark:text-white h-full" 
                placeholder="Search RFQ ID, Buyer, or Category..." 
                type="text"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative z-50">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsSortOpen(!isSortOpen); }}
                className="h-11 px-4 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 text-[#111318] dark:text-white text-sm font-bold flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-transparent focus:border-primary/20"
              >
                <span className="material-symbols-outlined text-[20px] text-gray-500">sort</span>
                <span className="hidden sm:inline">Sort by:</span> {sortBy}
                <span className="material-symbols-outlined text-[18px] text-gray-400">expand_more</span>
              </button>
              
              {isSortOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 animate-fade-in-up" style={{animationDuration: '0.2s'}}>
                  {sortOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => { setSortBy(option); setIsSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${sortBy === option ? 'text-primary bg-blue-50/50 dark:bg-blue-900/20' : 'text-[#111318] dark:text-white'}`}
                    >
                      {option}
                      {sortBy === option && <span className="material-symbols-outlined text-[18px]">check</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Status Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0 no-scrollbar">
            {statuses.map((status) => (
              <button 
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-lg px-5 transition-all duration-200 active:scale-95 ${
                  activeStatus === status 
                    ? 'bg-primary text-white shadow-md shadow-blue-500/20' 
                    : 'bg-[#f0f2f4] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[#111318] dark:text-white'
                }`}
              >
                <span className="text-sm font-bold">{status === 'All' ? 'All Requests' : status}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                   activeStatus === status 
                    ? 'bg-white/20 text-white' 
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {getCount(status)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="mt-6 space-y-3 min-h-[400px]">
        {currentItems.length > 0 ? (
          currentItems.map((req, idx) => (
            <div key={req.id} className="group relative">
              {/* Main Row */}
              <div 
                onClick={() => toggleExpand(req.id)}
                className={`bg-white dark:bg-gray-900 p-5 border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-primary/20 transition-all flex flex-col md:flex-row items-start md:items-center gap-6 cursor-pointer animate-fade-in-up 
                  ${expandedRowId === req.id ? 'rounded-t-xl border-b-0' : 'rounded-xl'}
                  ${req.status === 'Closed' ? 'opacity-75' : ''}
                `}
                style={{animationDelay: `${idx * 0.05}s`}}
              >
                <div className="flex flex-col min-w-[140px]">
                  <span className="text-[10px] uppercase font-bold text-[#616f89] tracking-widest">RFQ ID</span>
                  <span className="font-bold text-sm text-[#111318] dark:text-white flex items-center gap-2">
                    <span dangerouslySetInnerHTML={{ __html: searchQuery ? req.id.replace(new RegExp(`(${searchQuery})`, 'gi'), '<span class="bg-yellow-200 dark:bg-yellow-800 text-black dark:text-white">$1</span>') : req.id }} />
                    {expandedRowId === req.id ? 
                      <span className="material-symbols-outlined text-[20px] text-primary">expand_less</span> :
                      <span className="material-symbols-outlined text-[20px] text-gray-300 group-hover:text-primary transition-colors">expand_more</span>
                    }
                  </span>
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 items-center gap-4 w-full">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-[#616f89] tracking-widest">Buyer</span>
                    <span className={`font-bold text-sm truncate ${sortBy === 'Company Name' ? 'text-primary' : 'text-[#111318] dark:text-white'}`} dangerouslySetInnerHTML={{ __html: searchQuery ? req.company.replace(new RegExp(`(${searchQuery})`, 'gi'), '<span class="bg-yellow-200 dark:bg-yellow-800 text-black dark:text-white">$1</span>') : req.company }} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-[#616f89] tracking-widest">Category</span>
                    <span className="text-sm font-medium text-[#111318] dark:text-white" dangerouslySetInnerHTML={{ __html: searchQuery ? req.cat.replace(new RegExp(`(${searchQuery})`, 'gi'), '<span class="bg-yellow-200 dark:bg-yellow-800 text-black dark:text-white">$1</span>') : req.cat }} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-[#616f89] tracking-widest">Destination</span>
                    <span className={`text-sm font-medium flex items-center gap-1 ${sortBy === 'Destination' ? 'text-primary' : 'text-[#111318] dark:text-white'}`}><span className="material-symbols-outlined !text-sm">location_on</span> {req.dest}</span>
                  </div>
                  <div className="flex flex-col items-start gap-1 relative z-30">
                    <span className="text-[10px] uppercase font-bold text-[#616f89] tracking-widest">Status</span>
                    <div className="flex gap-2 items-center">
                      {/* Interactive Status Badge Filter */}
                      <button 
                         onClick={(e) => { e.stopPropagation(); setActiveStatus(req.status); }}
                         className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all shadow-sm ${getStatusClasses(req.statusColor)} ${activeStatus === req.status ? 'ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : 'hover:scale-105'}`}
                         title={`Filter by ${req.status}`}
                      >
                         {req.status}
                      </button>
                      
                      <button 
                         onClick={(e) => { e.stopPropagation(); setStatusMenuOpenId(statusMenuOpenId === req.id ? null : req.id); }}
                         className="text-gray-300 hover:text-primary transition-colors p-1"
                         aria-label="Change status"
                      >
                         <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>

                      {statusMenuOpenId === req.id && (
                        <div className="absolute top-full left-0 mt-1 w-36 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden flex flex-col animate-fade-in-up" style={{animationDuration: '0.1s'}}>
                           {statuses.filter(s => s !== 'All').map(status => (
                             <button
                               key={status}
                               onClick={(e) => { e.stopPropagation(); handleStatusUpdate(req.id, status); }}
                               className={`text-left px-3 py-2 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${req.status === status ? 'text-primary bg-blue-50/50 dark:bg-blue-900/20' : 'text-[#111318] dark:text-white'}`}
                             >
                               {status}
                             </button>
                           ))}
                        </div>
                      )}

                      {(req.urgency === 'Critical' || sortBy === 'Urgency') && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 ${
                          req.urgency === 'Critical' ? 'bg-red-100 text-red-700' : 
                          req.urgency === 'High' ? 'bg-orange-100 text-orange-700' :
                          req.urgency === 'Standard' ? 'bg-blue-50 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {req.urgency === 'Critical' && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>}
                          {req.urgency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between w-full md:w-auto items-center gap-4">
                  <div className="flex flex-col items-end min-w-[100px]">
                      <span className="text-[10px] uppercase font-bold text-[#616f89] tracking-widest">Created</span>
                      <span className="text-xs font-medium text-[#111318] dark:text-white">{req.time}</span>
                    </div>
                    <button className="bg-[#f0f2f4] dark:bg-gray-800 hover:bg-primary hover:text-white p-2.5 rounded-lg transition-all"><span className="material-symbols-outlined">open_in_new</span></button>
                </div>
              </div>

              {/* Expanded Details Panel */}
              {expandedRowId === req.id && (
                <div className="bg-gray-50 dark:bg-gray-800/30 border border-t-0 border-gray-100 dark:border-gray-800 rounded-b-xl p-6 animate-fade-in relative -mt-[1px] z-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact Info */}
                    <div className="flex flex-col gap-3">
                      <h4 className="text-xs uppercase font-bold text-[#616f89] tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">person</span> Contact Details
                      </h4>
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <p className="font-bold text-[#111318] dark:text-white">{req.contact.name}</p>
                        <a href={`mailto:${req.contact.email}`} className="text-sm text-primary hover:underline block mt-1">{req.contact.email}</a>
                        <p className="text-sm text-[#60758a] mt-1">{req.contact.phone}</p>
                        <div className="mt-3 flex gap-2">
                          <button className="flex-1 bg-[#f0f2f4] dark:bg-gray-800 text-xs font-bold py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Email</button>
                          <button className="flex-1 bg-[#f0f2f4] dark:bg-gray-800 text-xs font-bold py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Call</button>
                        </div>
                      </div>
                    </div>

                    {/* Requirements & Documents */}
                    <div className="flex flex-col gap-6 lg:col-span-1">
                      <div className="flex flex-col gap-3">
                        <h4 className="text-xs uppercase font-bold text-[#616f89] tracking-widest flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">assignment</span> Requirements
                        </h4>
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-[#111318] dark:text-white leading-relaxed">
                            {req.details}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <h4 className="text-xs uppercase font-bold text-[#616f89] tracking-widest flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">folder_open</span> Documents
                        </h4>
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                           {uploadedFiles[req.id] && uploadedFiles[req.id].length > 0 ? (
                             <ul className="mb-3 space-y-2">
                               {uploadedFiles[req.id].map((file, i) => (
                                 <li key={i} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                                   <div className="flex items-center gap-2 overflow-hidden">
                                     <span className="material-symbols-outlined text-primary text-[20px] shrink-0">description</span>
                                     <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-[#111318] dark:text-white truncate">{file.name}</span>
                                        <span className="text-[10px] text-gray-400">{file.size} • {file.date}</span>
                                     </div>
                                   </div>
                                   <button onClick={() => deleteFile(req.id, file.name)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                     <span className="material-symbols-outlined text-[18px]">delete</span>
                                   </button>
                                 </li>
                               ))}
                             </ul>
                           ) : (
                             <div className="text-center py-3 text-xs text-gray-400 mb-3 border-dashed border border-gray-200 dark:border-gray-700 rounded-lg">
                               No documents uploaded
                             </div>
                           )}
                           
                           <div className="relative">
                             <input 
                               type="file" 
                               id={`file-upload-${req.id.replace(/\W/g, '')}`} 
                               className="hidden" 
                               onChange={(e) => handleFileUpload(e, req.id)}
                             />
                             <label 
                               htmlFor={`file-upload-${req.id.replace(/\W/g, '')}`} 
                               className="flex items-center justify-center gap-2 w-full py-2 bg-[#f0f2f4] dark:bg-gray-800 text-xs font-bold text-[#111318] dark:text-white rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                             >
                               <span className="material-symbols-outlined text-[16px]">upload_file</span> Upload Document
                             </label>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* History */}
                    <div className="flex flex-col gap-3">
                      <h4 className="text-xs uppercase font-bold text-[#616f89] tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">history</span> Activity
                      </h4>
                      <div className="relative pl-2 pt-1">
                        {req.history.map((event, i) => (
                          <div key={i} className="flex gap-3 mb-4 last:mb-0 relative">
                            {/* Timeline line */}
                            {i !== req.history.length - 1 && (
                              <div className="absolute left-[5px] top-2 bottom-[-16px] w-[2px] bg-gray-200 dark:bg-gray-700"></div>
                            )}
                            <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-primary shrink-0 z-10 ring-4 ring-gray-50 dark:ring-gray-800"></div>
                            <div>
                              <p className="text-xs font-bold text-[#111318] dark:text-white">{event.action}</p>
                              <p className="text-[10px] text-[#60758a]">{event.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                     <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-red-600">Decline Request</button>
                     <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors shadow-sm shadow-blue-500/20">Create Quote</button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
               <span className="material-symbols-outlined text-gray-400 text-3xl">inbox</span>
            </div>
            <h3 className="text-lg font-bold text-[#111318] dark:text-white">No requests found</h3>
            <p className="text-[#616f89] dark:text-gray-400">
              {searchQuery ? `No matches for "${searchQuery}"` : `There are no ${activeStatus.toLowerCase()} requests at the moment.`}
            </p>
            <button onClick={() => { setActiveStatus('All'); setSearchQuery(''); }} className="mt-4 text-primary font-bold text-sm hover:underline">Clear filters</button>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {sortedRequests.length > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-6 mt-8 gap-4">
          <div className="text-sm text-[#616f89] dark:text-gray-400">
            Showing <span className="font-bold text-[#111318] dark:text-white">{indexOfFirstItem + 1}</span> to <span className="font-bold text-[#111318] dark:text-white">{Math.min(indexOfLastItem, sortedRequests.length)}</span> of <span className="font-bold text-[#111318] dark:text-white">{sortedRequests.length}</span> results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-bold text-[#111318] dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span> Previous
            </button>
            
            <div className="hidden sm:flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${
                    currentPage === i + 1
                      ? 'bg-primary text-white shadow-md shadow-blue-500/20'
                      : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-[#616f89] dark:text-gray-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-bold text-[#111318] dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Next <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;