import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { Search, Download, Share, Filter, Eye, EyeOff, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, Link2, Tag, Folder, Calendar, User, Star, Pin, Hash } from 'lucide-react';
import type { MockNote } from '../lib/mockStorage';

// Types for graph data structures
interface GraphNode {
  id: string;
  note: MockNote;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
  cluster?: string;
  degree?: number;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isPinned?: boolean;
  level?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'same-category' | 'same-tag' | 'similar-content' | 'references' | 'temporal' | 'cross-reference';
  strength: number;
  distance: number;
  isHighlighted?: boolean;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface ClusterInfo {
  id: string;
  name: string;
  type: 'category' | 'tag' | 'content' | 'time';
  color: string;
  size: number;
}

interface FilterState {
  searchTerm: string;
  selectedCategories: string[];
  selectedTags: string[];
  dateRange: [Date | null, Date | null];
  contentTypes: string[];
  showDeleted: boolean;
  minConnections: number;
}

// Force Graph Component
const ForceGraph: React.FC<{
  notes: MockNote[];
  onNodeClick?: (note: MockNote) => void;
  selectedNote?: MockNote | null;
  height?: number;
}> = ({ notes, onNodeClick, selectedNote, height = 600 }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [clusters, setClusters] = useState<ClusterInfo[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedCategories: [],
    selectedTags: [],
    dateRange: [null, null],
    contentTypes: [],
    showDeleted: false,
    minConnections: 0
  });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [graphStats, setGraphStats] = useState({
    nodes: 0,
    links: 0,
    clusters: 0,
    selectedNode: null as GraphNode | null
  });
  const [showControls, setShowControls] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'force' | 'radial' | 'hierarchical'>('force');

  // Color schemes for different types
  const colorSchemes = {
    category: d3.schemeCategory10,
    tag: d3.schemeSet3,
    content: d3.schemePaired,
    time: d3.schemeBlues[9]
  };

  // Build graph data from notes
  const buildGraphData = useCallback((notes: MockNote[]): GraphData => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeMap = new Map<string, GraphNode>();

    // Create nodes
    notes.forEach(note => {
      if (!filters.showDeleted && note.deleted_at) return;
      
      const node: GraphNode = {
        id: note.id,
        note,
        isSelected: selectedNote?.id === note.id,
        isPinned: note.metadata?.pinned || false
      };
      
      nodes.push(node);
      nodeMap.set(note.id, node);
    });

    // Build connections based on relationships
    const categoryGroups = d3.group(nodes, d => d.note.category || 'Uncategorized');
    const tagMap = new Map<string, GraphNode[]>();
    
    // Analyze tags and build relationships
    notes.forEach(note => {
      if (note.metadata?.tags) {
        note.metadata.tags.forEach(tag => {
          if (!tagMap.has(tag)) tagMap.set(tag, []);
          const node = nodeMap.get(note.id);
          if (node) tagMap.get(tag)!.push(node);
        });
      }
    });

    // Create links based on same category
    categoryGroups.forEach((categoryNodes) => {
      for (let i = 0; i < categoryNodes.length; i++) {
        for (let j = i + 1; j < categoryNodes.length; j++) {
          links.push({
            source: categoryNodes[i].id,
            target: categoryNodes[j].id,
            type: 'same-category',
            strength: 1,
            distance: 50
          });
        }
      }
    });

    // Create links based on same tags
    tagMap.forEach(tagNodes => {
      for (let i = 0; i < tagNodes.length; i++) {
        for (let j = i + 1; j < tagNodes.length; j++) {
          links.push({
            source: tagNodes[i].id,
            target: tagNodes[j].id,
            type: 'same-tag',
            strength: 0.8,
            distance: 60
          });
        }
      }
    });

    // Create content similarity links (simplified)
    const contentWords = new Map<string, GraphNode[]>();
    nodes.forEach(node => {
      const words = node.note.text.toLowerCase().split(/\W+/).filter(word => word.length > 3);
      words.forEach(word => {
        if (!contentWords.has(word)) contentWords.set(word, []);
        contentWords.get(word)!.push(node);
      });
    });

    contentWords.forEach(wordNodes => {
      if (wordNodes.length > 1) {
        for (let i = 0; i < wordNodes.length; i++) {
          for (let j = i + 1; j < wordNodes.length; j++) {
            // Check if link already exists
            const existingLink = links.find(link => 
              (link.source === wordNodes[i].id && link.target === wordNodes[j].id) ||
              (link.source === wordNodes[j].id && link.target === wordNodes[i].id)
            );
            if (!existingLink) {
              links.push({
                source: wordNodes[i].id,
                target: wordNodes[j].id,
                type: 'similar-content',
                strength: 0.3,
                distance: 100
              });
            }
          }
        }
      }
    });

    // Create temporal links (notes created around same time)
    nodes.sort((a, b) => new Date(a.note.created_at).getTime() - new Date(b.note.created_at).getTime());
    for (let i = 0; i < nodes.length - 1; i++) {
      const timeDiff = Math.abs(new Date(nodes[i].note.created_at).getTime() - 
                               new Date(nodes[i + 1].note.created_at).getTime());
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      
      if (daysDiff <= 7) { // Within a week
        links.push({
          source: nodes[i].id,
          target: nodes[i + 1].id,
          type: 'temporal',
          strength: Math.max(0.1, 0.5 - (daysDiff / 14)),
          distance: 80
        });
      }
    }

    // Calculate node degrees
    nodes.forEach(node => {
      node.degree = links.filter(link => 
        (typeof link.source === 'string' ? link.source : link.source.id) === node.id ||
        (typeof link.target === 'string' ? link.target : link.target.id) === node.id
      ).length;
    });

    return { nodes, links };
  }, [notes, filters, selectedNote]);

  // Build clusters from graph data
  const buildClusters = useCallback((graphData: GraphData): ClusterInfo[] => {
    const clusters: ClusterInfo[] = [];
    
    // Category clusters
    const categories = new Set(graphData.nodes.map(n => n.note.category || 'Uncategorized'));
    const categoryColors = d3.schemeCategory10;
    let colorIndex = 0;
    
    categories.forEach(category => {
      const nodesInCategory = graphData.nodes.filter(n => (n.note.category || 'Uncategorized') === category);
      if (nodesInCategory.length > 0) {
        clusters.push({
          id: `category-${category}`,
          name: category,
          type: 'category',
          color: categoryColors[colorIndex % categoryColors.length],
          size: nodesInCategory.length
        });
        colorIndex++;
      }
    });

    // Tag clusters (top tags only)
    const tagCounts = new Map<string, number>();
    graphData.nodes.forEach(node => {
      node.note.metadata?.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const topTags = Array.from(tagCounts.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const tagColors = d3.schemeSet3;
    colorIndex = 0;

    topTags.forEach(([tag, count]) => {
      clusters.push({
        id: `tag-${tag}`,
        name: tag,
        type: 'tag',
        color: tagColors[colorIndex % tagColors.length],
        size: count
      });
      colorIndex++;
    });

    return clusters;
  }, []);

  // Initialize D3 force simulation
  const initializeSimulation = useCallback(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Create main group for zooming
    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create force simulation
    const simulation = d3.forceSimulation(graphData.nodes)
      .force('link', d3.forceLink(graphData.links)
        .id((d: any) => d.id)
        .distance(d => d.distance)
        .strength(d => d.strength)
      )
      .force('charge', d3.forceManyBody()
        .strength((d: any) => -Math.max(50, 100 - (d.degree || 0) * 10))
        .distanceMax(300)
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide()
        .radius((d: any) => Math.max(15, (d.degree || 0) * 3 + 10))
        .strength(0.7)
      );

    // Add cluster forces for radial view
    if (viewMode === 'radial') {
      const clusterGroups = d3.group(graphData.nodes, n => n.note.category || 'Uncategorized');
      const angleStep = (2 * Math.PI) / Array.from(clusterGroups.keys()).length;
      
      Array.from(clusterGroups.entries()).forEach(([category, nodes], index) => {
        const angle = index * angleStep;
        const radius = 150;
        const centerX = width / 2 + Math.cos(angle) * radius;
        const centerY = height / 2 + Math.sin(angle) * radius;
        
        simulation.force(`cluster-${category}`, d3.forceCenter(centerX, centerY).strength(0.1));
      });
    }

    simulationRef.current = simulation;

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(graphData.links)
      .join('line')
      .attr('stroke', d => {
        const colors = {
          'same-category': '#10B981',
          'same-tag': '#8B5CF6',
          'similar-content': '#F59E0B',
          'references': '#EF4444',
          'temporal': '#6B7280',
          'cross-reference': '#3B82F6'
        };
        return colors[d.type] || '#94A3B8';
      })
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.max(1, d.strength * 3));

    // Create nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(graphData.nodes)
      .join('circle')
      .attr('r', d => Math.max(6, Math.min(20, (d.degree || 1) * 2 + 6)))
      .attr('fill', d => {
        const category = d.note.category || 'Uncategorized';
        const categoryIndex = Array.from(new Set(graphData.nodes.map(n => n.note.category || 'Uncategorized'))).indexOf(category);
        return d3.schemeCategory10[categoryIndex % 10];
      })
      .attr('stroke', d => {
        if (d.isSelected) return '#EF4444';
        if (d.isHighlighted) return '#F59E0B';
        return '#ffffff';
      })
      .attr('stroke-width', d => d.isSelected || d.isHighlighted ? 3 : 1)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
        onNodeClick?.(d.note);
      })
      .on('mouseover', (event, d) => {
        setHoveredNode(d);
        // Highlight connected nodes
        const connectedNodes = new Set<string>();
        graphData.links.forEach(link => {
          if (link.source === d.id || link.target === d.id) {
            const otherId = link.source === d.id ? link.target : link.source;
            connectedNodes.add(typeof otherId === 'string' ? otherId : otherId.id);
          }
        });

        // Update node highlights
        node.attr('opacity', n => n.id === d.id || connectedNodes.has(n.id) ? 1 : 0.3);
        link.attr('stroke-opacity', l => l.source === d.id || l.target === d.id ? 0.8 : 0.1);
      })
      .on('mouseout', () => {
        setHoveredNode(null);
        node.attr('opacity', 1);
        link.attr('stroke-opacity', 0.6);
      });

    // Add drag behavior
    const drag = d3.drag<SVGCircleElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        // Keep node pinned if user double-clicked
        if (!event.sourceEvent.detail || event.sourceEvent.detail !== 2) {
          d.fx = null;
          d.fy = null;
        }
      });

    node.call(drag);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);
    });

    // Add legends and labels for clusters
    addClusterLabels(g, clusters);

  }, [graphData, clusters, viewMode]);

  // Add cluster labels
  const addClusterLabels = (g: d3.Selection<SVGGElement, unknown, null, undefined>, clusters: ClusterInfo[]) => {
    const labelGroup = g.append('g').attr('class', 'cluster-labels');
    
    const categories = new Set(graphData.nodes.map(n => n.note.category || 'Uncategorized'));
    const categoryArray = Array.from(categories);
    
    categoryArray.forEach((category, index) => {
      const nodesInCategory = graphData.nodes.filter(n => (n.note.category || 'Uncategorized') === category);
      if (nodesInCategory.length > 0) {
        const avgX = d3.mean(nodesInCategory, n => n.x || 0) || 0;
        const avgY = d3.mean(nodesInCategory, n => n.y || 0) || 0;
        
        labelGroup.append('text')
          .attr('x', avgX)
          .attr('y', avgY - 30)
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .attr('fill', '#374151')
          .style('pointer-events', 'none')
          .text(category);
      }
    });
  };

  // Update graph when data changes
  useEffect(() => {
    const newGraphData = buildGraphData(notes);
    const newClusters = buildClusters(newGraphData);
    setGraphData(newGraphData);
    setClusters(newClusters);
    setGraphStats({
      nodes: newGraphData.nodes.length,
      links: newGraphData.links.length,
      clusters: newClusters.length,
      selectedNode: selectedNode
    });
  }, [notes, filters, selectedNode, buildGraphData, buildClusters]);

  // Initialize simulation when graph data changes
  useEffect(() => {
    if (graphData.nodes.length > 0) {
      initializeSimulation();
    }
  }, [graphData, initializeSimulation]);

  // Filter graph data based on current filters
  const filteredGraphData = useMemo(() => {
    let filteredNodes = [...graphData.nodes];
    let filteredLinks = [...graphData.links];

    // Search filter
    if (filters.searchTerm) {
      const searchRegex = new RegExp(filters.searchTerm, 'i');
      filteredNodes = filteredNodes.filter(node => 
        node.note.title?.match(searchRegex) ||
        node.note.text.match(searchRegex) ||
        node.note.category?.match(searchRegex) ||
        node.note.metadata?.tags?.some(tag => tag.match(searchRegex))
      );
    }

    // Category filter
    if (filters.selectedCategories.length > 0) {
      filteredNodes = filteredNodes.filter(node => 
        filters.selectedCategories.includes(node.note.category || 'Uncategorized')
      );
    }

    // Tag filter
    if (filters.selectedTags.length > 0) {
      filteredNodes = filteredNodes.filter(node => 
        node.note.metadata?.tags?.some(tag => filters.selectedTags.includes(tag))
      );
    }

    // Content type filter
    if (filters.contentTypes.length > 0) {
      filteredNodes = filteredNodes.filter(node => 
        filters.contentTypes.includes(node.note.content_type)
      );
    }

    // Date range filter
    if (filters.dateRange[0] && filters.dateRange[1]) {
      filteredNodes = filteredNodes.filter(node => {
        const noteDate = new Date(node.note.created_at);
        return noteDate >= filters.dateRange[0]! && noteDate <= filters.dateRange[1]!;
      });
    }

    // Min connections filter
    filteredNodes = filteredNodes.filter(node => (node.degree || 0) >= filters.minConnections);

    // Update links to only include connections between filtered nodes
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    filteredLinks = filteredLinks.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, filters]);

  // Export graph as image
  const exportGraph = async () => {
    if (!svgRef.current) return;
    
    setIsExporting(true);
    try {
      const svg = svgRef.current;
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = svg.clientWidth * 2;
      canvas.height = svg.clientHeight * 2;
      
      img.onload = () => {
        if (ctx) {
          ctx.scale(2, 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `tradejournal-graph-${new Date().toISOString().split('T')[0]}.png`;
              a.click();
              URL.revokeObjectURL(url);
            }
            setIsExporting(false);
          });
        }
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };

  // Share graph configuration
  const shareGraph = async () => {
    const config = {
      filters,
      viewMode,
      timestamp: new Date().toISOString(),
      stats: graphStats
    };
    
    const shareData = {
      title: 'TradeJournal AI - Note Relationship Graph',
      text: `Explore ${graphStats.nodes} interconnected notes with ${graphStats.links} relationships`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      alert('Graph configuration copied to clipboard!');
    }
  };

  // Control functions
  const resetZoom = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().duration(500).call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        d3.zoomIdentity
      );
    }
  };

  const centerGraph = () => {
    if (svgRef.current && graphData.nodes.length > 0) {
      const svg = d3.select(svgRef.current);
      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight;
      
      const centerX = d3.mean(graphData.nodes, d => d.x || 0) || width / 2;
      const centerY = d3.mean(graphData.nodes, d => d.y || 0) || height / 2;
      
      const transform = d3.zoomIdentity
        .translate(width / 2 - centerX, height / 2 - centerY)
        .scale(1);
      
      svg.transition().duration(500).call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        transform
      );
    }
  };

  const highlightIsolatedNodes = () => {
    const isolatedNodes = graphData.nodes.filter(node => (node.degree || 0) === 0);
    alert(`${isolatedNodes.length} isolated nodes found. These notes have no connections to other notes.`);
  };

  // Get unique values for filter dropdowns
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(notes.map(note => note.category || 'Uncategorized')));
  }, [notes]);

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => {
      note.metadata?.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [notes]);

  const uniqueContentTypes = useMemo(() => {
    return Array.from(new Set(notes.map(note => note.content_type)));
  }, [notes]);

  return (
    <div className={`relative bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Force Graph Visualization
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span>{graphStats.nodes} nodes</span>
            <span>•</span>
            <span>{graphStats.links} connections</span>
            <span>•</span>
            <span>{graphStats.clusters} clusters</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Toggle Filters"
          >
            <Filter className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowControls(!showControls)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Toggle Controls"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={exportGraph}
            disabled={isExporting}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            title="Export Graph"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={shareGraph}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Share Graph"
          >
            <Share className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Controls Panel */}
      {showControls && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* View Mode Selector */}
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="force">Force Directed</option>
                <option value="radial">Radial</option>
                <option value="hierarchical">Hierarchical</option>
              </select>

              {/* Zoom Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={resetZoom}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={centerGraph}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Center Graph"
                >
                  <Link2 className="w-4 h-4" />
                </button>
                <button
                  onClick={highlightIsolatedNodes}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Highlight Isolated Nodes"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-64"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categories
              </label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {uniqueCategories.map(category => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.selectedCategories.includes(category)}
                      onChange={(e) => {
                        setFilters(prev => ({
                          ...prev,
                          selectedCategories: e.target.checked
                            ? [...prev.selectedCategories, category]
                            : prev.selectedCategories.filter(c => c !== category)
                        }));
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {uniqueTags.slice(0, 10).map(tag => (
                  <label key={tag} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.selectedTags.includes(tag)}
                      onChange={(e) => {
                        setFilters(prev => ({
                          ...prev,
                          selectedTags: e.target.checked
                            ? [...prev.selectedTags, tag]
                            : prev.selectedTags.filter(t => t !== tag)
                        }));
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <Hash className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Content Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content Types
              </label>
              <div className="space-y-1">
                {uniqueContentTypes.map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.contentTypes.includes(type)}
                      onChange={(e) => {
                        setFilters(prev => ({
                          ...prev,
                          contentTypes: e.target.checked
                            ? [...prev.contentTypes, type]
                            : prev.contentTypes.filter(t => t !== type)
                        }));
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Min Connections */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Min Connections: {filters.minConnections}
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={filters.minConnections}
                onChange={(e) => setFilters(prev => ({ ...prev, minConnections: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.showDeleted}
                  onChange={(e) => setFilters(prev => ({ ...prev, showDeleted: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Show deleted</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Graph SVG */}
      <div className="relative" style={{ height: `${height}px` }}>
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
        />
        
        {/* Node Details Panel */}
        {hoveredNode && (
          <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm z-10">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {hoveredNode.note.title || 'Untitled Note'}
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {hoveredNode.note.category}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {hoveredNode.note.text.slice(0, 100)}...
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{hoveredNode.degree} connections</span>
              <span>{new Date(hoveredNode.note.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {graphData.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 bg-opacity-80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Building graph...</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Connection Types:</strong>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Same Category</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Same Tags</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Similar Content</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Temporal</span>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Node size = connection count | Red stroke = selected | Yellow stroke = highlighted
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForceGraph;