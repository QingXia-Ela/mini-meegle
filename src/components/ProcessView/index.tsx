import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import type { EdgeSingular, NodeSingular } from 'cytoscape';
import type { ProcessNodeType } from './types';
import { getColorByStatus, parseProcessNodesIntoCytoscapeElements } from './utils';

interface ProcessViewProps {
  editMode?: boolean;
  nodes: ProcessNodeType[]
}


function ProcessView({ nodes }: ProcessViewProps) {

  const cytoRef = useRef<cytoscape.Core | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const buildStatusDot = (status?: string) => {
    const color = getColorByStatus(status || '');
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
        <circle cx="6" cy="6" r="5" fill="${color.backgroundColor}" stroke="${color.borderColor}" stroke-width="1" />
      </svg>
    `;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  const buildVirtualNodeLine = () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="320" height="2" viewBox="0 0 320 2">
        <line x1="0" y1="1" x2="320" y2="1" stroke="#888" stroke-width="2" />
      </svg>
    `;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  // 初始化 cytoscape 实例（仅挂载时）
  useEffect(() => {
    if (!containerRef.current) return

    const pan = {
      x: (containerRef.current.clientWidth || 0) / 2,
      y: (containerRef.current.clientHeight || 0) / 2,
    }

    cytoRef.current = cytoscape({
      container: containerRef.current,
      elements: [],
      // zoomingEnabled: false,
      // userZoomingEnabled: false,
      panningEnabled: false,
      userPanningEnabled: false,
      pan,
      style: [
        {
          selector: 'node[type != "virtual_node"]',
          style: {
            'shape': 'round-rectangle',
            'width': (ele: NodeSingular) => {
              const data = ele.scratch('vanillaData') as ProcessNodeType | undefined
              return (data?.name?.length || 0) * 16 + 24
            },
            'height': 1,
            'padding': '16px',
            'label': (ele: NodeSingular) => {
              const data = ele.scratch('vanillaData') as ProcessNodeType | undefined
              return data?.name || ''
            },
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': 16,
            'color': '#4a4a4a',
            'background-color': '#ffffff',
            'background-width': '10px',
            'background-height': '10px',
            'background-position-x': '10px',
            'background-repeat': 'no-repeat',
            'background-image': (ele: NodeSingular) => {
              const data = ele.scratch('vanillaData') as ProcessNodeType | undefined
              return buildStatusDot(data?.status)
            },
            'border-width': 1,
            'border-color': 'gray',
          }
        },
        {
          selector: 'node[type = "virtual_node"]',
          style: {
            'width': 88,
            'height': 1,
            'padding': '16px',
            'background-color': 'rgba(255,255,255,0)',
            'label': '',
            'background-image': buildVirtualNodeLine(),
            'background-repeat': 'no-repeat',
            // 'background-position-x': '-32px',
            'background-width': '100%',
            'background-height': '1px',
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1,
            'line-color': '#aaa',
            'curve-style': 'unbundled-bezier',
            // 直接读取预计算的 data 值
            'control-point-distances': (ele: EdgeSingular) => ele.data('control-point-distances'),
            'control-point-weights': (ele: EdgeSingular) => ele.data('control-point-weights'),
          }
        },
        {
          selector: 'node:selected',
          style: {
            'overlay-opacity': 0,
            'active-bg-opacity': 0,
          },
        },
        {
          selector: 'edge:selected',
          style: {
            'overlay-opacity': 0,
          },
        },
        {
          selector: 'node:active',
          style: {
            'overlay-opacity': 0,
            'active-bg-opacity': 0,
          },
        },
        {
          selector: 'edge:active',
          style: {
            'overlay-opacity': 0,
          },
        },
      ]
    })

    cytoRef.current.elements('node[type = "virtual_node"]').forEach(console.log)

    return () => {
      if (cytoRef.current) {
        cytoRef.current.destroy()
        cytoRef.current = null
      }
    }
  }, [])

  // 当 nodes 变化时，更新图表元素
  useEffect(() => {
    if (!cytoRef.current) return
    const elements = parseProcessNodesIntoCytoscapeElements(nodes)
    if (elements && Array.isArray(elements)) {
      cytoRef.current.elements().remove()
      cytoRef.current.add(elements as cytoscape.ElementDefinition[])
    }
  }, [nodes])
  return (
    <div className="h-full flex justify-center items-center flex-1 w-full" ref={containerRef}>
    </div>
  );
}

export default ProcessView;
