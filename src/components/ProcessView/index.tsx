import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import type { EdgeSingular, NodeSingular } from 'cytoscape';
import type { ProcessNodeType, ProcessNodeIdType } from './types';
import { addEdge, getColorByStatus, parseProcessNodesIntoCytoscapeElements } from './utils';
import { message } from 'antd';

// 注册 edgehandles 扩展
cytoscape.use(edgehandles);

interface ProcessViewProps {
  nodes: ProcessNodeType[]
  // node only
  onNodeClick?: (node: ProcessNodeType) => void
}

interface ProcessViewWithEditModeProps {
  nodes: ProcessNodeType[]
  onNodeClick?: (node: ProcessNodeType) => void
  onEdgeClick?: (edge: EdgeSingular) => void
  onEdgeCreate?: (sourceNodeId: ProcessNodeIdType, targetNodeId: ProcessNodeIdType) => void
  onAddEdge?: (sourceNodeId: ProcessNodeIdType, targetNodeId: ProcessNodeIdType, newNodes: ProcessNodeType[]) => void
}


const buildStatusDot = (status?: string) => {
  const color = getColorByStatus(status || '');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
      <circle cx="6" cy="6" r="5" fill="${color.backgroundColor}" stroke="${color.borderColor}" stroke-width="1" />
    </svg>
  `;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const buildVirtualNodeLine = (height: number = 2) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="${height}" viewBox="0 0 320 ${height}">
      <line x1="0" y1="0" x2="320" y2="0" stroke="#aaa" stroke-width="${height + 1}" />
    </svg>
  `;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function ProcessViewWithEditMode({ nodes, onNodeClick, onEdgeClick, onEdgeCreate, onAddEdge }: ProcessViewWithEditModeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cytoRef = useRef<cytoscape.Core | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const pan = {
      x: (containerRef.current.clientWidth || 0) / 2,
      y: (containerRef.current.clientHeight || 0) / 2,
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: parseProcessNodesIntoCytoscapeElements(nodes),
      // zoomingEnabled: false,
      // userZoomingEnabled: false,
      panningEnabled: false,
      userPanningEnabled: false,
      pan,
      style: [
        {
          selector: 'node',
          style: {
            'shape': 'round-rectangle',
            'width': (ele: NodeSingular) => {
              const data = ele.scratch('vanillaData') as ProcessNodeType | undefined
              return (data?.name?.length || 0) * 16 + 24
            },
            // 
            'height': 1,
            padding: '16px',
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
            'width': 70,
            'height': 8,
            'background-color': 'rgba(252,252,252,0)',
            'label': '',
            'background-image': buildVirtualNodeLine(8),
            'background-repeat': 'no-repeat',
            'background-width': '100%',
            'background-height': 12,
            'background-position-x': 0,
            'background-position-y': 15,
            'border-color': 'rgba(252,252,252,0)',
            'overlay-opacity': 0,
            'active-bg-opacity': 0,
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
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
            'border-color': '#3b82f6',
            'border-width': 2,
          },
        },
        {
          selector: 'edge:selected',
          style: {
            'overlay-opacity': 0,
            'width': 3,
            'line-color': '#3b82f6',
          },
        },
        {
          selector: 'node:active[type != "virtual_node"]',
          style: {
            'overlay-opacity': 0,
            'active-bg-opacity': 0,
            'border-color': '#3b82f6',
            'border-width': 2,
          },
        },
        {
          selector: 'edge:active',
          style: {
            'overlay-opacity': 0,
            'width': 3,
            'line-color': '#3b82f6',
          },
        },
        {
          selector: '.eh-handle, .eh-preview, .eh-ghost-edge',
          style: {
            'z-index': 1000,
            'background-color': '#3b82f6',
            'curve-style': 'straight',
            'width': 4,
            'height': 4,
            'shape': 'rectangle',
            'overlay-opacity': 0,
            'border-width': 4, // makes the handle easier to hit
            'border-opacity': 0,
            'border-color': '#3b82f6',
            'line-color': '#3b82f6',
            'target-arrow-color': '#3b82f6',
            'source-arrow-color': '#3b82f6',
          }
        },
        {
          selector: '.eh-hover',
          style: {
            'border-color': '#3b82f6'
          }
        },
      ]
    })

    let selectNode: NodeSingular | null = null
    let currentMouseHoverNode: NodeSingular | null = null
    // make all nodes and edges selectable
    cy.elements('node[type != "virtual_node"]')
      .selectify()
      .on('mouseover', (event) => {
        currentMouseHoverNode = event.target as NodeSingular
        const node = event.target as NodeSingular
        if (node.active() || node.selected()) return
        node
          .style('border-color', '#3b82f6')
          .style('border-width', 2)
      })
      .on('mouseout', (event) => {
        currentMouseHoverNode = null
        // modify border color to gray
        const node = event.target as NodeSingular
        if (node.active() || node.selected()) return
        node
          .style('border-color', 'gray')
          .style('border-width', 1)
      })
      .on('mousedown', (event) => {
        selectNode = event.target as NodeSingular
      })
    cy.on('mouseup', () => {
      if (currentMouseHoverNode && selectNode) {
        const selectNodeId = selectNode.data('id') as ProcessNodeIdType
        const currentMouseHoverNodeId = currentMouseHoverNode.data('id') as ProcessNodeIdType

        try {
          onAddEdge?.(selectNodeId, currentMouseHoverNodeId, addEdge(nodes, selectNodeId, currentMouseHoverNodeId))
        } catch (error) {
          message.error('边创建失败:' + (error as Error).message)
        }
      }
      if (selectNode) {
        selectNode.style('border-color', 'gray')
        selectNode.style('border-width', 1)
        selectNode = null
      }
    })

    // 启用 edgehandles 扩展
    const eh = cy.edgehandles({
      canConnect: () => false,
      edgeParams: () => ({}),
      hoverDelay: 150, // time spent hovering over a target node before it is considered selected
      snap: true, // when enabled, the edge can be drawn by just moving close to a target node (can be confusing on compound graphs)
      snapThreshold: 50, // the target node must be less than or equal to this many pixels away from the cursor/finger
      snapFrequency: 15, // the number of times per second (Hz) that snap checks done (lower is less expensive)
      noEdgeEventsInDraw: true, // set events:no to edges during draws, prevents mouseouts on compounds
      disableBrowserGestures: true // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom
    });
    eh.enableDrawMode()

    // 监听边创建完成事件
    cy.on('ehcomplete', (_event: unknown, sourceNode: NodeSingular, targetNode: NodeSingular, addedEdge: EdgeSingular) => {
      // 立即删除 cytoscape 创建的边，因为我们要通过 addEdge 方法重新计算并创建
      addedEdge.remove()

      // 获取源节点和目标节点的实际 ID
      const sourceId = sourceNode.data('id') as ProcessNodeIdType
      const targetId = targetNode.data('id') as ProcessNodeIdType

      // 触发回调，让父组件处理边的创建
      onEdgeCreate?.(sourceId, targetId)
    })

    cy.on('click', 'node', (event) => {
      const node = event.target as NodeSingular
      node.select()
      onNodeClick?.(node.scratch('vanillaData') as ProcessNodeType)
    })

    cy.on('click', 'edge', (event) => {
      const edge = event.target as EdgeSingular
      edge.select()
      onEdgeClick?.(edge)
    })

    cytoRef.current = cy

    return () => {
      eh.destroy()
      if (cytoRef.current) {
        const cy = cytoRef.current as cytoscape.Core
        cy.removeAllListeners()
        cy.destroy()
        cytoRef.current = null
      }
    }
  }, [nodes, onNodeClick, onEdgeClick, onEdgeCreate])
  return (
    <div className="h-full flex justify-center items-center flex-1 w-full" ref={containerRef}>
    </div>
  );
}

function ProcessView({ nodes, onNodeClick }: ProcessViewProps) {
  const cytoRef = useRef<cytoscape.Core | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)


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
            'width': 72,
            'height': 1,
            'padding': '16px',
            'background-color': 'rgba(252,252,252,0)',
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
            'border-color': '#3b82f6',
            'border-width': 2,
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

    // cytoRef.current.on('click', 'node', (event) => {
    //   const node = event.target as NodeSingular
    //   node.select()
    //   onNodeClick?.(node.scratch('vanillaData') as ProcessNodeType)
    // })

    return () => {
      if (cytoRef.current) {
        const cy = cytoRef.current as cytoscape.Core
        cy.removeAllListeners()
        cy.destroy()
        cytoRef.current = null
      }
    }
  }, [nodes])

  // 当 nodes 变化时，更新图表元素
  useEffect(() => {
    if (!cytoRef.current) return
    const elements = parseProcessNodesIntoCytoscapeElements(nodes)
    if (elements && Array.isArray(elements)) {
      // 移除所有节点并重新设置元素
      cytoRef.current.elements('node').remove()
      cytoRef.current.elements('edge').remove()
      cytoRef.current.add(elements as cytoscape.ElementDefinition[])
    }
  }, [nodes])
  return (
    <div className="h-full flex justify-center items-center flex-1 w-full" ref={containerRef}>
    </div>
  );
}

export default ProcessView;
