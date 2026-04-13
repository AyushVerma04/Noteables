import React, { useState, useEffect, useRef, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import SourceManager from '../components/SourceManager';

export default function Brain() {
  const { user } = useAuth();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const fgRef = useRef();

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/ai/graph/all');
      setGraphData(res.data);
    } catch (err) {
      console.error('Failed to fetch graph:', err);
      toast.error('Failed to load semantic brain');
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = useCallback(node => {
    // Aim at node from outside it
    const distance = 40;
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

    if (fgRef.current) {
      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new pos
        node, // lookAt pos
        3000  // ms transition duration
      );
    }
    setSelectedNode(node);
  }, [fgRef]);

  // Bloom effect for that "AI Glow"
  useEffect(() => {
    if (fgRef.current) {
      const bloomPass = new UnrealBloomPass();
      bloomPass.strength = 1.5;
      bloomPass.radius = 1;
      bloomPass.threshold = 0.1;
      fgRef.current.postProcessingComposer().addPass(bloomPass);
    }
  }, []);

  const filteredData = searchQuery.trim() === '' 
    ? graphData 
    : {
        nodes: graphData.nodes.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase())),
        links: graphData.links
      };

  return (
    <div className="brain-page-container">
      <div className="brain-controls">
        <div className="brain-header-card">
          <h1>Omni-Brain</h1>
          <p>Semantic Knowledge Graph of all approved notes</p>
        </div>
        
        <input 
          type="text" 
          placeholder="Search concepts..." 
          className="brain-search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <button className="btn btn-secondary btn-sm" onClick={fetchGraphData}>
          <span className="material-symbols-outlined">refresh</span>
          Refresh View
        </button>

        <button className="btn btn-ai btn-sm" onClick={() => setIsManagerOpen(true)}>
          <span className="material-symbols-outlined">account_tree</span>
          Manage Knowledge
        </button>
      </div>

      <SourceManager 
        isOpen={isManagerOpen} 
        onClose={() => setIsManagerOpen(false)} 
        onRefreshGraph={fetchGraphData}
      />

      {selectedNode && (
        <div className="node-info-panel">
          <div className="info-card">
            <div className="info-card-header">
              <span className="info-card-badge">{selectedNode.type || 'Concept'}</span>
              <h2 className="info-card-title">{selectedNode.label}</h2>
            </div>
            <div className="info-card-content">
              This concept was semantically extracted from your collective knowledge base. 
              It represents a key thematic pillar in your currently approved documents.
            </div>
            <div className="info-card-actions">
              <button className="btn btn-primary btn-sm w-full" onClick={() => setSelectedNode(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="headline-md">Initializing Neural Core...</div>
            <div className="body-sm text-variant">Mapping semantic relationships</div>
          </div>
        </div>
      ) : (
        <ForceGraph3D
          ref={fgRef}
          graphData={filteredData}
          nodeThreeObject={node => {
            // Is it a "Parent" node? (Large size or high degree)
            // Note: Degree calculation is better done after data is processed, 
            // but we'll use node.val which backend populates based on mentions.
            const isParent = node.val > 25;
            
            // Create a Group to hold the Sphere and Label
            const group = new THREE.Group();

            // 1. The Sphere mesh
            const sphereGeom = new THREE.SphereGeometry(isParent ? 8 : 4);
            const sphereMat = new THREE.MeshLambertMaterial({ 
              color: isParent ? '#ff5f1f' : '#ffdb3c',
              transparent: true,
              opacity: 0.9,
              emissive: isParent ? '#ff5f1f' : '#000000',
              emissiveIntensity: isParent ? 0.5 : 0
            });
            const mesh = new THREE.Mesh(sphereGeom, sphereMat);
            group.add(mesh);

            // 2. The Text Sprite (Persistent Label)
            const sprite = new SpriteText(node.label);
            sprite.color = '#ffffff';
            sprite.textHeight = isParent ? 6 : 4;
            sprite.padding = 2;
            sprite.backgroundColor = 'rgba(0,0,0,0.4)';
            sprite.borderRadius = 2;
            sprite.position.y = isParent ? 12 : 8; // Move text above node
            group.add(sprite);

            return group;
          }}
          nodeLabel={null} // Disable default tooltips since we have sprites
          linkWidth={2.5}
          linkColor={() => '#ffffff'}
          linkDirectionalParticles={4}
          linkDirectionalParticleSpeed={0.006}
          linkDirectionalParticleWidth={2}
          backgroundColor="#0e0e0e"
          onNodeClick={handleNodeClick}
        />
      )}

      <div className="brain-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#ffb59c' }}></div>
          Concept
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#ffdb3c' }}></div>
          Method
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#ffb2be' }}></div>
          Result
        </div>
      </div>
    </div>
  );
}
