import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Download, Info, ChevronRight, Database, Leaf, Factory, Truck, Trash2, Droplets, Zap, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmissionFactor } from './data/emissionFactors';

const ScopeBadge = ({ scope }: { scope: string }) => {
  const colors: Record<string, string> = {
    'Scope 1': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Scope 2': 'bg-blue-100 text-blue-800 border-blue-200',
    'Scope 3': 'bg-amber-100 text-amber-800 border-amber-200',
    'Offset': 'bg-purple-100 text-purple-800 border-purple-200',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[scope] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
      {scope}
    </span>
  );
};

const SectionIcon = ({ section }: { section: string }) => {
  if (section.includes('Combustion')) return <Factory className="w-4 h-4 opacity-50" />;
  if (section.includes('Mobile')) return <Truck className="w-4 h-4 opacity-50" />;
  if (section.includes('Water')) return <Droplets className="w-4 h-4 opacity-50" />;
  if (section.includes('Electricity')) return <Zap className="w-4 h-4 opacity-50" />;
  if (section.includes('Waste')) return <Trash2 className="w-4 h-4 opacity-50" />;
  if (section.includes('Green Space')) return <Leaf className="w-4 h-4 opacity-50" />;
  return <Database className="w-4 h-4 opacity-50" />;
};

export default function App() {
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScope, setSelectedScope] = useState<string | null>(null);
  const [selectedFactor, setSelectedFactor] = useState<EmissionFactor | null>(null);

  useEffect(() => {
    fetch('/api/factors')
      .then(res => res.json())
      .then(data => {
        setFactors(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch factors:', err);
        setLoading(false);
      });
  }, []);

  const filteredFactors = useMemo(() => {
    return factors.filter(f => {
      const matchesSearch = 
        f.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.ref.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesScope = !selectedScope || f.scope === selectedScope;
      
      return matchesSearch && matchesScope;
    });
  }, [factors, searchTerm, selectedScope]);

  const scopes = useMemo(() => Array.from(new Set(factors.map(f => f.scope))), [factors]);

  const exportToCSV = () => {
    const headers = ['Scope', 'Section', 'Type', 'Units', 'CO2e', 'Unit', 'Ref', 'Year'];
    const rows = filteredFactors.map(f => [
      f.scope,
      f.section,
      f.type,
      f.units,
      f.co2e,
      f.unit,
      f.ref,
      f.year
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "emission_factors.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-screen flex flex-col bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0] overflow-hidden">
      {/* Header */}
      <header className="flex-none border-b border-[#141414] px-6 py-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-50">Technical Database</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none">
            Emission Factors
          </h1>
        </div>
        
        <div className="flex flex-col items-end gap-4">
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-widest opacity-50">Last Updated</p>
            <p className="font-mono text-sm">MAR 15, 2026</p>
          </div>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar / Filters */}
        <aside className="w-full lg:w-80 flex-none border-b lg:border-b-0 lg:border-r border-[#141414] p-6 space-y-8 overflow-y-auto">
          <div className="space-y-4">
            <label className="text-[11px] font-bold uppercase tracking-widest opacity-50 block">Search Database</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
              <input 
                type="text"
                placeholder="Type, Section, or Ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border border-[#141414] px-10 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#141414] placeholder:opacity-30"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-bold uppercase tracking-widest opacity-50 block">Filter by Scope</label>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setSelectedScope(null)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-[#141414] transition-colors ${!selectedScope ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/10'}`}
              >
                All Scopes
              </button>
              {scopes.map(scope => (
                <button 
                  key={scope}
                  onClick={() => setSelectedScope(scope)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-[#141414] transition-colors ${selectedScope === scope ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/10'}`}
                >
                  {scope}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-[#141414]/10">
            <div className="bg-[#141414] text-[#E4E3E0] p-4 rounded-sm">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Database Stats</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] uppercase opacity-50">Total Factors</p>
                  <p className="font-mono text-xl">{factors.length}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase opacity-50">Filtered</p>
                  <p className="font-mono text-xl">{filteredFactors.length}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Data Grid */}
        <section className="flex-1 overflow-auto">
          <div className="min-w-[1100px]">
            {/* Table Header */}
            <div className="grid grid-cols-[80px_120px_1fr_80px_80px_80px_80px_100px_40px] px-6 py-4 border-b border-[#141414] bg-[#141414]/5">
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">Scope</div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">Section</div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">Type / Source</div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 text-right">CO2e</div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 text-right">CO2</div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 text-right">CH4</div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 text-right">NO2</div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 text-right">Unit</div>
              <div></div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-[#141414]/10">
              {loading ? (
                <div className="p-12 text-center opacity-30 italic animate-pulse">
                  Loading database from API...
                </div>
              ) : filteredFactors.map((factor) => (
                <motion.div 
                  layout
                  key={factor.id}
                  onClick={() => setSelectedFactor(factor)}
                  className="grid grid-cols-[80px_120px_1fr_80px_80px_80px_80px_100px_40px] px-6 py-4 items-center hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors cursor-pointer group"
                >
                  <div><ScopeBadge scope={factor.scope} /></div>
                  <div className="flex items-center gap-2 text-[11px] font-medium">
                    <SectionIcon section={factor.section} />
                    {factor.section}
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-sm font-bold tracking-tight">{factor.type}</div>
                    <div className="text-[10px] opacity-50 font-mono truncate max-w-md">{factor.ref} ({factor.year})</div>
                  </div>
                  <div className="text-right font-mono text-sm font-bold">
                    {typeof factor.co2e === 'number' ? factor.co2e.toLocaleString(undefined, { minimumFractionDigits: 2 }) : factor.co2e}
                  </div>
                  <div className="text-right font-mono text-[11px] opacity-50 group-hover:opacity-100">
                    {factor.co2 || '-'}
                  </div>
                  <div className="text-right font-mono text-[11px] opacity-50 group-hover:opacity-100">
                    {factor.ch4 || '-'}
                  </div>
                  <div className="text-right font-mono text-[11px] opacity-50 group-hover:opacity-100">
                    {factor.no2 || '-'}
                  </div>
                  <div className="text-right text-[10px] font-bold uppercase tracking-widest opacity-50 group-hover:opacity-100">
                    {factor.unit}
                  </div>
                  <div className="flex justify-end">
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ))}
              {!loading && filteredFactors.length === 0 && (
                <div className="p-12 text-center opacity-30 italic">
                  No emission factors matching your criteria.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedFactor && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFactor(null)}
              className="fixed inset-0 bg-[#141414]/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-[#E4E3E0] border-l border-[#141414] z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-8 space-y-12">
                <div className="flex justify-between items-start">
                  <button 
                    onClick={() => setSelectedFactor(null)}
                    className="text-[10px] font-bold uppercase tracking-[0.3em] hover:underline"
                  >
                    [ Close ]
                  </button>
                  <ScopeBadge scope={selectedFactor.scope} />
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest opacity-50">{selectedFactor.section}</p>
                  <h2 className="text-4xl font-serif italic leading-tight">{selectedFactor.type}</h2>
                </div>

                <div className="grid grid-cols-2 gap-12 border-y border-[#141414] py-8">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest opacity-50 mb-2">CO2e Factor</p>
                    <p className="text-5xl font-mono font-bold tracking-tighter">
                      {typeof selectedFactor.co2e === 'number' ? selectedFactor.co2e.toLocaleString() : selectedFactor.co2e}
                    </p>
                    <p className="text-[11px] font-bold uppercase tracking-widest mt-2">{selectedFactor.unit}</p>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Input Unit</p>
                      <p className="font-bold">{selectedFactor.units}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Reference Year</p>
                      <p className="font-mono">{selectedFactor.year}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest">Component Breakdown</h3>
                  <div className="space-y-4 font-mono text-sm">
                    <div className="flex justify-between border-b border-[#141414]/10 pb-2">
                      <span className="opacity-50">CO2</span>
                      <span>{selectedFactor.co2 || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#141414]/10 pb-2">
                      <span className="opacity-50">CH4</span>
                      <span>{selectedFactor.ch4 || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#141414]/10 pb-2">
                      <span className="opacity-50">NO2</span>
                      <span>{selectedFactor.no2 || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-8">
                  <p className="text-[11px] font-bold uppercase tracking-widest opacity-50">Source Documentation</p>
                  <div className="p-4 border border-[#141414] bg-[#141414]/5 italic text-sm">
                    "{selectedFactor.ref}"
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
