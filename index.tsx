import React, { useState, useEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Github,
  Search,
  Star,
  GitFork,
  AlertCircle,
  Award,
  BookOpen,
  Code2,
  GitCommit,
  Layout,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
  Activity,
  Folder,
  FileCode,
  File,
  ChevronRight,
  ChevronDown,
  X,
  ExternalLink,
  Maximize2,
  Play,
  MonitorPlay,
  Terminal,
  Globe,
  Users,
  Network,
  Layers,
  Map,
  ListChecks,
  ChevronUp
} from "lucide-react";
import { 
  parseGithubUrl, 
  fetchGithubData, 
  analyzeWithGemini,
  fetchFileContent,
  type RepoAnalysis, 
  type RepoMetadata,
  type FileNode,
  type Contributor
} from "./api";

// --- Components ---

const MetricCard = ({ 
  icon: Icon, 
  label, 
  metricKey,
  data, 
  onExpand, 
  isExpanded,
  onFileClick 
}: any) => {
  const score = data?.score || 0;
  
  // Dynamic text color calculation
  const getScoreColor = (s: number) => {
      if (s >= 80) return "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]";
      if (s >= 50) return "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]";
      return "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.3)]";
  }

  // Dynamic bar color calculation
  const getBarColor = (s: number) => {
      if (s >= 80) return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
      if (s >= 50) return "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]";
      return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]";
  }

  return (
    <div 
      className={`group relative rounded-2xl transition-all duration-300 border cursor-pointer overflow-hidden ${
        isExpanded 
        ? 'border-zinc-600 bg-zinc-900 shadow-[0_10px_40px_-10px_rgba(255,255,255,0.1)]' 
        : 'border-white/5 bg-gradient-to-b from-zinc-900/60 to-black/60 hover:border-zinc-700 hover:bg-zinc-900/80 hover:shadow-xl hover:-translate-y-1'
      }`}
      onClick={() => onExpand(isExpanded ? null : metricKey)}
    >
      {/* Top Highlight for depth */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />

      <div className="p-5 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-zinc-300">
            <div className={`p-2.5 rounded-xl border shadow-inner ${
                isExpanded 
                ? 'bg-zinc-800 border-zinc-600 text-white shadow-black/20' 
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 group-hover:text-zinc-300 group-hover:border-zinc-700'
            }`}>
                <Icon size={18} />
            </div>
            <span className="font-medium text-sm tracking-wide">{label}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
                <span className={`font-mono font-bold text-lg leading-none ${getScoreColor(score)}`}>{score}</span>
                <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">/100</span>
            </div>
            <div className={`p-1 rounded-full transition-colors ${isExpanded ? 'bg-zinc-800 text-white' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                 <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>
        
        {/* Progress Bar Container with inner shadow */}
        <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${getBarColor(score)}`} 
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-5 pb-5 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="pt-5 border-t border-zinc-800/80">
            
            {/* Score Breakdown */}
            {data?.breakdown && data.breakdown.length > 0 && (
                <div className="mb-6 grid grid-cols-1 gap-4">
                    {data.breakdown.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs group/item">
                            <span className="text-zinc-400 font-medium">{item.label}</span>
                            <div className="flex items-center gap-3">
                                <div className="w-24 h-1.5 bg-zinc-950 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                                    <div 
                                        className="h-full rounded-full bg-zinc-500 group-hover/item:bg-zinc-300 transition-colors" 
                                        style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                                    />
                                </div>
                                <span className="text-zinc-300 font-mono w-8 text-right font-bold">{item.score}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="relative pl-4 border-l-2 border-zinc-700/50 mb-6">
                <p className="text-sm text-zinc-400 leading-relaxed">
                {data?.reasoning || "No detailed reasoning available."}
                </p>
            </div>
            
            {data?.relevantFiles?.length > 0 && (
              <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block mb-3 flex items-center gap-2">
                  <FileCode size={12} /> Evidence Files
                </span>
                <div className="flex flex-wrap gap-2">
                  {data.relevantFiles.map((file: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileClick(file);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800/50 hover:bg-zinc-700 hover:text-white hover:border-zinc-600 border border-zinc-800 rounded-md text-[11px] text-zinc-400 transition-all font-mono group shadow-sm"
                    >
                      <span className="truncate max-w-[200px]">{file}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const HorizontalRoadmap = ({ items }: { items: any[] }) => {
    return (
        <div className="w-full overflow-x-auto pb-8 pt-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent px-1">
            <div className="flex gap-6 min-w-max px-2">
                {items?.map((item, i) => (
                    <div key={i} className="w-80 relative group pt-10">
                        {/* Connecting Line */}
                        {i !== items.length - 1 && (
                            <div className="absolute top-[52px] left-10 w-full h-[2px] bg-zinc-900 -z-10 group-hover:bg-zinc-800 transition-colors" />
                        )}
                        
                        <div className="flex flex-col gap-4">
                             {/* Number Badge */}
                             <div className="w-8 h-8 rounded-full bg-black border border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 z-10 group-hover:border-zinc-500 group-hover:text-white transition-all shadow-[0_0_10px_rgba(0,0,0,0.8)] ring-4 ring-black">
                                {i + 1}
                             </div>
                             
                             {/* Card */}
                             <div className="p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900/80 to-black/80 hover:from-zinc-900 hover:to-zinc-900 hover:border-zinc-700 hover:shadow-2xl transition-all group-hover:-translate-y-2 duration-300 h-48 flex flex-col backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-white/10 transition-colors" />
                                
                                <div className="mb-3 flex justify-between items-start relative z-10">
                                    <h4 className="font-semibold text-sm text-zinc-200 line-clamp-1 pr-2" title={item.title}>{item.title}</h4>
                                    <span className={`text-[9px] uppercase border px-2 py-0.5 rounded-full font-bold shadow-sm ${
                                        item.priority === 'High' ? 'border-zinc-700 text-zinc-100 bg-zinc-800' :
                                        item.priority === 'Medium' ? 'border-zinc-800 text-zinc-400 bg-zinc-900' :
                                        'border-zinc-900 text-zinc-600 bg-black'
                                    }`}>
                                        {item.priority}
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-5 relative z-10">{item.description}</p>
                             </div>
                        </div>
                    </div>
                ))}
                 {(!items || items.length === 0) && (
                    <div className="text-center p-12 w-full text-zinc-600 text-sm font-medium border border-dashed border-zinc-900 rounded-xl">
                        No roadmap generated.
                    </div>
                )}
            </div>
        </div>
    );
};

const TabButton = ({ active, label, icon: Icon, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 overflow-hidden ${
            active 
            ? 'text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
            : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
        }`}
    >
        {active && (
            <div className="absolute inset-0 bg-white" />
        )}
        <span className="relative z-10 flex items-center gap-2">
            <Icon size={14} className={active ? "text-black" : "text-zinc-500 group-hover:text-zinc-300"} />
            {label}
        </span>
    </button>
);

// --- SVG Graph Component ---
const FileGraphView = ({ tree, onFileSelect }: { tree: FileNode[], onFileSelect: (path: string) => void }) => {
    const nodes = useMemo(() => {
        const rootNodes = tree.filter(n => !n.path.includes('/'));
        const level1Nodes = tree.filter(n => n.path.split('/').length === 2).slice(0, 15);
        return { roots: rootNodes, children: level1Nodes };
    }, [tree]);

    return (
        <div className="w-full h-full bg-black overflow-hidden flex items-center justify-center relative">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_70%)] pointer-events-none" />
             
             <div className="relative w-full h-full min-h-[600px] min-w-[600px] flex items-center justify-center overflow-auto p-8">
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {nodes.roots.map((node, i) => {
                        const angle = (i / nodes.roots.length) * 2 * Math.PI;
                        const x = 50 + 50 * Math.cos(angle);
                        const y = 50 + 50 * Math.sin(angle);
                        return (
                            <line 
                                key={node.path}
                                x1="50%" y1="50%" 
                                x2={`${x}%`} y2={`${y}%`}
                                stroke="#3f3f46" 
                                strokeWidth="1"
                                strokeDasharray="4 4"
                                className="opacity-30"
                            />
                        );
                    })}
                </svg>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                     <div className="w-20 h-20 rounded-full bg-zinc-900 shadow-[0_0_40px_rgba(255,255,255,0.1)] flex items-center justify-center border-4 border-black z-20 relative">
                        <div className="absolute inset-0 rounded-full border border-white/20" />
                        <Code2 size={32} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                     </div>
                </div>

                {nodes.roots.map((node, i) => {
                     const angle = (i / nodes.roots.length) * 2 * Math.PI;
                     const radius = 220;
                     const x = Math.cos(angle) * radius;
                     const y = Math.sin(angle) * radius;
                     const isFolder = node.type === 'tree';

                     return (
                         <div 
                            key={node.path}
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                            style={{ 
                                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                            }}
                            onClick={() => !isFolder && onFileSelect(node.path)}
                         >
                            <div className={`
                                flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300 shadow-xl
                                ${isFolder 
                                    ? 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-500 backdrop-blur-sm' 
                                    : 'bg-black/80 border-zinc-800 hover:border-white hover:bg-zinc-900 hover:scale-110 backdrop-blur-sm'}
                            `}>
                                {isFolder ? <Folder size={24} className="text-zinc-600 group-hover:text-zinc-300" /> : <FileCode size={24} className="text-zinc-500 group-hover:text-white" />}
                                <span className="text-[10px] font-bold text-zinc-500 group-hover:text-white max-w-[120px] truncate text-center px-2 py-0.5 rounded-full">
                                    {node.path}
                                </span>
                            </div>
                         </div>
                     );
                })}
             </div>
        </div>
    );
};


// Recursive Tree Component (Standard)
const FileTreeItem = ({ node, tree, depth = 0, onSelect, selectedPath }: { 
    node: FileNode; 
    tree: FileNode[]; 
    depth?: number; 
    onSelect: (path: string) => void;
    selectedPath: string | null;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const isFolder = node.type === 'tree';
    
    const children = useMemo(() => {
        if (!isFolder) return [];
        const prefix = node.path + '/';
        return tree.filter(n => {
            if (!n.path.startsWith(prefix)) return false;
            const relativePath = n.path.slice(prefix.length);
            return !relativePath.includes('/');
        }).sort((a, b) => {
            if (a.type === 'tree' && b.type !== 'tree') return -1;
            if (a.type !== 'tree' && b.type === 'tree') return 1;
            return a.path.localeCompare(b.path);
        });
    }, [tree, node.path, isFolder]);

    const handleSelect = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFolder) setIsOpen(!isOpen);
        else onSelect(node.path);
    };

    useEffect(() => {
        if (selectedPath && selectedPath.startsWith(node.path + '/')) setIsOpen(true);
    }, [selectedPath, node.path]);

    const isSelected = selectedPath === node.path;

    return (
        <div>
            <div 
                className={`flex items-center gap-2 py-1.5 px-3 cursor-pointer transition-all text-sm rounded-lg whitespace-nowrap overflow-hidden my-0.5
                    ${isSelected ? 'bg-white/10 text-white shadow-sm font-medium' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'}
                `}
                style={{ paddingLeft: `${depth * 16 + 12}px` }}
                onClick={handleSelect}
            >
                {isFolder ? (
                    <span className="text-zinc-600">
                         {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                ) : <span className="w-3.5" />}
                
                {isFolder ? (
                     isOpen ? <Folder size={14} className="text-zinc-200" /> : <Folder size={14} className="text-zinc-600" />
                ) : (
                    <FileCode size={14} className={isSelected ? "text-white" : "text-zinc-600"} />
                )}
                <span className="truncate font-mono text-xs tracking-tight">{node.path.split('/').pop()}</span>
            </div>
            {isOpen && children.map(child => (
                <FileTreeItem 
                    key={child.sha} 
                    node={child} 
                    tree={tree} 
                    depth={depth + 1} 
                    onSelect={onSelect} 
                    selectedPath={selectedPath}
                />
            ))}
        </div>
    );
};

const LivePreviewModal = ({ 
    isOpen, 
    onClose, 
    deployUrl, 
    owner, 
    repo 
}: any) => {
    const [mode, setMode] = useState<'deploy' | 'stackblitz'>('deploy');
    useEffect(() => {
        if (deployUrl) setMode('deploy');
        else setMode('stackblitz');
    }, [deployUrl, isOpen]);

    if (!isOpen) return null;

    const stackblitzUrl = `https://stackblitz.com/github/${owner}/${repo}?embed=1&view=preview&hideExplorer=1&hidedevtools=1&theme=dark`;
    const activeUrl = mode === 'deploy' ? deployUrl : stackblitzUrl;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full h-full max-w-7xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10">
                <div className="h-16 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-6 shrink-0 backdrop-blur-sm">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                             <div className="p-2 bg-zinc-800 rounded-lg border border-zinc-700">
                                <MonitorPlay size={18} className="text-white" />
                             </div>
                             <span className="font-semibold text-zinc-200 tracking-tight">Live Preview</span>
                        </div>
                        <div className="flex bg-black p-1 rounded-lg border border-zinc-800/50 shadow-inner">
                             {deployUrl && (
                                 <button 
                                    onClick={() => setMode('deploy')}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
                                        mode === 'deploy' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-500 hover:text-white'
                                    }`}
                                 >
                                    <Globe size={12} />
                                    Deployed
                                 </button>
                             )}
                             <button 
                                onClick={() => setMode('stackblitz')}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
                                    mode === 'stackblitz' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-500 hover:text-white'
                                }`}
                             >
                                <Terminal size={12} />
                                Dev Env
                             </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <a href={activeUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-colors text-xs flex items-center gap-2 border border-transparent hover:border-zinc-700">
                            <ExternalLink size={16} /> <span className="hidden sm:inline">Open in New Tab</span>
                        </a>
                        <button onClick={onClose} className="p-2.5 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 rounded-xl text-zinc-500 transition-colors"><X size={20} /></button>
                    </div>
                </div>
                <div className="flex-1 bg-zinc-950 relative">
                    {!activeUrl ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                            <AlertCircle size={48} className="mb-4 opacity-50" />
                            <p>No deployment URL found.</p>
                        </div>
                    ) : (
                        <iframe src={activeUrl} className="w-full h-full border-0" title="Live Preview" allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking" sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts" />
                    )}
                </div>
            </div>
        </div>
    );
}

const RepoBrowserModal = ({ 
    isOpen, 
    onClose, 
    repoName, 
    tree, 
    initialFile, 
    owner, 
    repo 
}: any) => {
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string>("");
    const [isLoadingFile, setIsLoadingFile] = useState(false);
    const [viewMode, setViewMode] = useState<'tree' | 'graph'>('tree');

    useEffect(() => {
        if (isOpen && initialFile) {
            handleFileSelect(initialFile);
        } else if (isOpen && !selectedPath && tree.length > 0) {
            const readme = tree.find((n: FileNode) => n.path.toLowerCase().includes('readme'));
            if (readme) handleFileSelect(readme.path);
        }
    }, [isOpen, initialFile]);

    const handleFileSelect = async (path: string) => {
        setSelectedPath(path);
        // Switch to tree mode if checking a file
        if (viewMode === 'graph') setViewMode('tree');
        
        setIsLoadingFile(true);
        const content = await fetchFileContent(owner, repo, path);
        setFileContent(content);
        setIsLoadingFile(false);
    };

    const rootNodes = useMemo(() => {
        return tree.filter((n: FileNode) => !n.path.includes('/')).sort((a: any, b: any) => {
             if (a.type === 'tree' && b.type !== 'tree') return -1;
             if (a.type !== 'tree' && b.type === 'tree') return 1;
             return a.path.localeCompare(b.path);
        });
    }, [tree]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full h-full max-w-7xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10">
                <div className="h-16 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-6 shrink-0 backdrop-blur-sm">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                                <Code2 size={18} className="text-white" />
                            </div>
                            <span className="font-semibold text-zinc-200 tracking-tight text-lg">{repoName}</span>
                        </div>
                        <div className="flex bg-black p-1 rounded-lg border border-zinc-800/50 shadow-inner">
                            <button 
                                onClick={() => setViewMode('tree')} 
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${viewMode === 'tree' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-500 hover:text-white'}`}
                            >
                                <Layout size={12} /> Explorer
                            </button>
                            <button 
                                onClick={() => setViewMode('graph')} 
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${viewMode === 'graph' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-500 hover:text-white'}`}
                            >
                                <Network size={12} /> Graph
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {viewMode === 'graph' ? (
                        <FileGraphView tree={tree} onFileSelect={handleFileSelect} />
                    ) : (
                        <>
                            <div className="w-80 border-r border-zinc-800 bg-black/40 flex flex-col shrink-0 backdrop-blur-sm">
                                <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">File Explorer</span>
                                    <span className="text-[10px] text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{tree.length} files</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                                    {rootNodes.map((node: FileNode) => (
                                        <FileTreeItem 
                                            key={node.sha} 
                                            node={node} 
                                            tree={tree} 
                                            onSelect={handleFileSelect}
                                            selectedPath={selectedPath}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden bg-zinc-950 relative flex flex-col">
                                {isLoadingFile ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-zinc-500 gap-3">
                                        <Loader2 className="animate-spin" size={20} />
                                        <span className="text-sm font-mono tracking-tight">Reading file contents...</span>
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-auto p-8 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                                        <pre className="font-mono text-sm text-zinc-300 leading-relaxed tab-4 selection:bg-white/20">
                                            <code>{fileContent}</code>
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- CheckList Component ---
const ComplianceChecklist = ({ items }: { items: any[] }) => {
    return (
        <div className="p-4">
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-5 flex items-center gap-2">
                Standard Compliance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items?.map((check, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                        <span className="text-sm text-zinc-300 font-medium">{check.item}</span>
                        {check.status === 'Pass' ? (
                            <div className="flex items-center gap-1.5 text-emerald-200 px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20 text-[10px] font-bold shadow-sm">
                                <CheckCircle2 size={10} className="text-emerald-400" /> PASS
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-red-200 px-2 py-0.5 bg-red-500/10 rounded border border-red-500/20 text-[10px] font-bold shadow-sm">
                                <XCircle size={10} className="text-red-400" /> FAIL
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Contributors Component ---
const ContributorsPanel = ({ contributors }: { contributors: Contributor[] }) => {
    return (
        <div className="p-4">
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-5 flex items-center gap-2">
                 Top Contributors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contributors.slice(0, 10).map((c, i) => (
                    <div key={i} className="flex items-center justify-between group p-3 rounded-xl bg-zinc-900/20 hover:bg-zinc-900/60 transition-colors border border-transparent hover:border-zinc-800 cursor-default">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img src={c.avatar_url} alt={c.login} className="w-8 h-8 rounded-full border border-zinc-800 group-hover:border-zinc-500 transition-colors" />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-black rounded-full flex items-center justify-center text-[9px] border border-zinc-800 font-bold text-zinc-500 group-hover:text-white group-hover:border-white transition-colors">
                                    {i + 1}
                                </div>
                            </div>
                            <a href={c.html_url} target="_blank" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                                {c.login}
                            </a>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono bg-black px-2 py-0.5 rounded border border-zinc-900 group-hover:border-zinc-700 group-hover:text-zinc-300 transition-colors">
                            {c.contributions}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Main App Component ---

const App = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ 
      metadata: RepoMetadata, 
      analysis: RepoAnalysis,
      fileTree: FileNode[],
      contributors: Contributor[] 
  } | null>(null);

  // Interaction State
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [isLivePreviewOpen, setIsLivePreviewOpen] = useState(false);
  const [initialBrowserFile, setInitialBrowserFile] = useState<string | null>(null);
  
  // UI Tabs State
  const [activeTab, setActiveTab] = useState<'roadmap' | 'metrics' | 'details'>('roadmap');
  
  // Executive Summary Collapse
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setData(null);
    setExpandedMetric(null);
    setActiveTab('roadmap');
    setIsSummaryCollapsed(false);
    
    try {
      const repoInfo = parseGithubUrl(url);
      if (!repoInfo) {
        throw new Error("Invalid GitHub URL. Please use format: https://github.com/owner/repo");
      }

      setLoadingStep("Fetching repository data...");
      const { metadata, fileTree, readmeContent, recentCommits, contributors } = await fetchGithubData(repoInfo.owner, repoInfo.repo);
      
      // Sort Contributors: Owner first, then by contributions
      const sortedContributors = [...contributors].sort((a, b) => {
          if (a.login === metadata.owner.login) return -1;
          if (b.login === metadata.owner.login) return 1;
          return b.contributions - a.contributions;
      });

      setLoadingStep("Analyzing codebase...");
      const analysis = await analyzeWithGemini(metadata, fileTree, readmeContent, recentCommits);
      
      setData({ metadata, analysis, fileTree, contributors: sortedContributors });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const openRepoBrowser = (filePath: string | null = null) => {
      setInitialBrowserFile(filePath);
      setIsBrowserOpen(true);
  };

  // Score Gradient Helper
  const getGradientColors = (s: number) => {
    if (s >= 80) return { start: "#10b981", end: "#34d399", text: "text-emerald-400" }; // Emerald
    if (s >= 50) return { start: "#eab308", end: "#facc15", text: "text-yellow-400" }; // Yellow
    return { start: "#ef4444", end: "#f87171", text: "text-red-400" }; // Red
  };

  const scoreColors = data ? getGradientColors(data.analysis.score) : { start: "#fff", end: "#fff", text: "text-white" };

  return (
    <div className="min-h-screen bg-black text-zinc-100 selection:bg-white/20 font-sans overflow-x-hidden">
      {/* Ambient Background Lights */}
      <div className="fixed top-[-20%] left-[20%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[10%] w-[600px] h-[600px] bg-zinc-800/10 rounded-full blur-[128px] pointer-events-none z-0" />
      
      {/* Repo Browser Modal */}
      {data && (
        <>
          <RepoBrowserModal 
            isOpen={isBrowserOpen} 
            onClose={() => setIsBrowserOpen(false)}
            repoName={data.metadata.name}
            tree={data.fileTree}
            initialFile={initialBrowserFile}
            owner={data.metadata.owner.login}
            repo={data.metadata.name}
          />
          <LivePreviewModal
             isOpen={isLivePreviewOpen}
             onClose={() => setIsLivePreviewOpen(false)}
             deployUrl={data.metadata.homepage}
             owner={data.metadata.owner.login}
             repo={data.metadata.name}
          />
        </>
      )}

      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-white to-zinc-400 p-1 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              <Code2 size={20} className="text-black" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white drop-shadow-sm">GitGrade</span>
          </div>
          <a href="https://github.com" target="_blank" className="text-zinc-500 hover:text-white transition-colors">
            <Github size={20} />
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        {/* Search Section */}
        <section className={`max-w-2xl mx-auto transition-all duration-700 ease-out ${data ? 'mb-8' : 'mb-32 mt-20'}`}>
          {!data && (
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-400 mb-6">
                    <Star size={12} className="text-yellow-500" /> AI-Powered Code Audit
                </div>
                <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white tracking-tighter drop-shadow-2xl">
                    Evaluate<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-zinc-200 to-zinc-600">Codebases.</span>
                </h1>
                <p className="text-zinc-400 text-lg max-w-lg mx-auto leading-relaxed">
                    Instant deep-dive analysis, compliance checks, and actionable roadmaps for any public GitHub repository.
                </p>
            </div>
          )}
          
          <form onSubmit={handleAnalyze} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-zinc-500/10 to-white/10 rounded-3xl blur-2xl group-hover:opacity-100 opacity-50 transition-opacity duration-1000" />
            <div className="relative flex items-center bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden focus-within:border-white/30 focus-within:bg-zinc-900/80 transition-all group-hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.05)]">
              <Search className="ml-5 text-zinc-500" size={20} />
              <input 
                type="text" 
                placeholder="https://github.com/username/repository"
                className="w-full bg-transparent border-none py-5 px-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-0 text-lg"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={loading}
                className="mr-2 px-6 py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Analyze"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center justify-center gap-3 text-red-400 animate-in fade-in slide-in-from-top-2 text-sm backdrop-blur-sm">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          
          {loading && (
            <div className="mt-8 flex flex-col items-center gap-3 text-zinc-500 animate-pulse">
               <span className="text-xs font-mono uppercase tracking-widest">{loadingStep}</span>
            </div>
          )}
        </section>

        {/* Dashboard */}
        {data && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 space-y-8">
            
            {/* Score Card */}
            <div className="rounded-3xl bg-gradient-to-br from-zinc-900 via-black to-zinc-950 border border-white/10 p-8 md:p-10 relative overflow-hidden shadow-2xl ring-1 ring-white/5">
                <div className="absolute top-0 right-0 p-40 bg-white/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_50%)] pointer-events-none" />
                
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
                    {/* Score Circle */}
                    <div className="md:col-span-1 flex flex-col items-center md:items-start">
                         <div className="relative mb-6 group cursor-default">
                             <div className="absolute inset-0 bg-white/5 blur-xl rounded-full scale-90" />
                            <svg className="w-32 h-32 transform -rotate-90 drop-shadow-xl overflow-visible">
                                <defs>
                                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor={scoreColors.start} />
                                        <stop offset="100%" stopColor={scoreColors.end} />
                                    </linearGradient>
                                </defs>
                                <circle className="text-black/50" strokeWidth="10" stroke="currentColor" fill="transparent" r="56" cx="64" cy="64" />
                                <circle 
                                    stroke="url(#scoreGradient)" 
                                    strokeWidth="10" 
                                    strokeDasharray={351} 
                                    strokeDashoffset={351 - (351 * (data.analysis.score || 0)) / 100} 
                                    strokeLinecap="round" 
                                    fill="transparent" 
                                    r="56" cx="64" cy="64" 
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                <span className={`text-4xl font-bold block tracking-tighter drop-shadow-md ${scoreColors.text}`}>{data.analysis.score}</span>
                                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Score</span>
                            </div>
                         </div>
                         
                         <div className="flex flex-col items-center md:items-start">
                             <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">{data.metadata.name}</h2>
                             
                             <div className="flex flex-wrap items-center gap-3 mb-4 justify-center md:justify-start">
                                 <span className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider shadow-lg border ${
                                     data.analysis.medal === 'Gold' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200' :
                                     data.analysis.medal === 'Silver' ? 'bg-zinc-400/20 border-zinc-400/50 text-zinc-200' :
                                     'bg-orange-700/20 border-orange-600/50 text-orange-300'
                                 }`}>
                                     {data.analysis.medal} Tier
                                 </span>
                                 <div className="flex gap-3 text-zinc-400 text-xs font-medium">
                                     <span className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800"><Star size={10} className="text-white" /> {data.metadata.stargazers_count}</span>
                                     <span className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800"><GitFork size={10} className="text-white" /> {data.metadata.forks_count}</span>
                                 </div>
                             </div>
                             
                             <div className="flex gap-3 w-full md:w-auto">
                                <button onClick={() => setIsLivePreviewOpen(true)} className="flex-1 md:flex-none text-xs flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"><Play size={12} fill="currentColor" /> Live Demo</button>
                                <button onClick={() => openRepoBrowser(null)} className="flex-1 md:flex-none text-xs flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 font-medium hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700"><Maximize2 size={12} /> Code</button>
                             </div>
                         </div>
                    </div>

                    {/* Executive Summary (Collapsible) */}
                    <div className="md:col-span-2 flex flex-col h-full justify-center">
                        <div className="bg-zinc-900/40 rounded-2xl border border-white/5 p-1 transition-all hover:bg-zinc-900/60 hover:border-white/10 group">
                            <div 
                                className="flex items-center justify-between cursor-pointer p-4"
                                onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)}
                            >
                                 <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 group-hover:text-white transition-colors">
                                    <TrendingUp size={16} /> Executive Summary
                                </h3>
                                <button className="text-zinc-500 hover:text-white transition-colors bg-zinc-800/50 p-1.5 rounded-lg group-hover:bg-zinc-800">
                                    {isSummaryCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                </button>
                            </div>
                            
                            <div className={`overflow-hidden transition-all duration-500 ease-in-out px-4 ${isSummaryCollapsed ? 'max-h-0 opacity-0 pb-0' : 'max-h-96 opacity-100 pb-4'}`}>
                                 <p className="text-zinc-300 text-sm leading-7 border-t border-white/5 pt-4">
                                    {data.analysis.summary}
                                 </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center mb-8 sticky top-20 z-30">
                <div className="bg-black/60 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 flex gap-1 shadow-2xl ring-1 ring-black">
                    <TabButton active={activeTab === 'roadmap'} onClick={() => setActiveTab('roadmap')} label="Roadmap" icon={Map} />
                    <TabButton active={activeTab === 'metrics'} onClick={() => setActiveTab('metrics')} label="Metrics" icon={Activity} />
                    <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')} label="Details" icon={ListChecks} />
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {activeTab === 'roadmap' && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <div className="mb-6 px-4">
                             <h3 className="text-xl font-bold text-white tracking-tight">Recommended Path</h3>
                             <p className="text-zinc-500 text-sm mt-1">Strategic improvements to elevate code quality and maintainability.</p>
                        </div>
                        <HorizontalRoadmap items={data.analysis.roadmap} />
                    </div>
                )}

                {activeTab === 'metrics' && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 grid grid-cols-1 gap-5 max-w-4xl mx-auto">
                         <MetricCard 
                            icon={BookOpen} 
                            label="Documentation & Readme" 
                            metricKey="readme"
                            data={data.analysis.metrics?.readme}
                            onExpand={setExpandedMetric}
                            isExpanded={expandedMetric === 'readme'}
                            onFileClick={openRepoBrowser}
                        />
                        <MetricCard 
                            icon={Code2} 
                            label="Code Quality & Style" 
                            metricKey="quality"
                            data={data.analysis.metrics?.quality}
                            onExpand={setExpandedMetric}
                            isExpanded={expandedMetric === 'quality'}
                            onFileClick={openRepoBrowser}
                        />
                        <MetricCard 
                            icon={GitCommit} 
                            label="Commit History & Activity" 
                            metricKey="history"
                            data={data.analysis.metrics?.history}
                            onExpand={setExpandedMetric}
                            isExpanded={expandedMetric === 'history'}
                            onFileClick={openRepoBrowser}
                        />
                        <MetricCard 
                            icon={Layout} 
                            label="Project Structure" 
                            metricKey="structure"
                            data={data.analysis.metrics?.structure}
                            onExpand={setExpandedMetric}
                            isExpanded={expandedMetric === 'structure'}
                            onFileClick={openRepoBrowser}
                        />
                        <MetricCard 
                            icon={ShieldCheck} 
                            label="Testing & CI" 
                            metricKey="tests"
                            data={data.analysis.metrics?.tests}
                            onExpand={setExpandedMetric}
                            isExpanded={expandedMetric === 'tests'}
                            onFileClick={openRepoBrowser}
                        />
                    </div>
                )}

                {activeTab === 'details' && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-8">
                            {/* Stack */}
                            <div className="p-6 rounded-3xl border border-white/5 bg-zinc-900/20 backdrop-blur-sm">
                                <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-5 flex items-center gap-2">
                                    <Layers size={14} /> Technology Stack
                                </h3>
                                <div className="flex flex-wrap gap-2.5">
                                {data.analysis.techStack?.map((tech, i) => (
                                    <span key={i} className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 shadow-sm hover:border-zinc-600 transition-colors cursor-default">
                                    {tech}
                                    </span>
                                ))}
                                </div>
                            </div>
                            
                            {/* Checklist */}
                            <div className="p-2 rounded-3xl border border-white/5 bg-zinc-900/20 backdrop-blur-sm">
                                <ComplianceChecklist items={data.analysis.checklist} />
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Contributors */}
                            <div className="p-2 rounded-3xl border border-white/5 bg-zinc-900/20 backdrop-blur-sm">
                                <ContributorsPanel contributors={data.contributors} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);