import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import type { EdgeSingular, NodeSingular } from 'cytoscape';
import type { ProcessNodeType, ProcessNodeIdType } from './types';
import { addEdge, getColorByStatus, parseProcessNodesIntoCytoscapeElements, calculatePanBounds, X_LAYER_WIDTH, Y_NODE_HEIGHT } from './utils';
import { message } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import cytoscapePopper from 'cytoscape-popper';
import {
  computePosition,
  flip,
  shift,
  limitShift,
} from '@floating-ui/dom';
import { popperContainerDOM, togglePopperContainer } from './popperContainer';
import type { ForwardedRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { measureTextLength } from './MeasureTextLength';
import { debounce } from 'lodash-es';
// 注册 edgehandles 扩展
cytoscape.use(edgehandles);


cytoscape.use(cytoscapePopper(function (ref, content, opts) {
  function update() {
    computePosition(
      ref,
      content,
      // see https://floating-ui.com/docs/computePosition#options
      {
        // matching the default behaviour from Popper@2
        // https://floating-ui.com/docs/migration#configure-middleware
        middleware: [
          flip(),
          shift({ limiter: limitShift() })
        ],
        ...opts,
      }
    ).then(({ x, y }) => {
      Object.assign(content.style, {
        left: `${x}px`,
        top: `${y + 16}px`,
      });
    });
  }
  update();
  return { update };
}));

interface ProcessViewProps {
  nodes: ProcessNodeType[]
  onNodeClick?: (node: ProcessNodeType) => void
  // node only
}

export interface ProcessViewWithEditModeRef {
  popupMenuAtNode: (nodeId: ProcessNodeIdType, jsxNode: ReactNode) => void
  hideNodeMenu: () => void
}

interface ProcessViewWithEditModeProps {
  nodes: ProcessNodeType[]
  onNodeClick?: (node: ProcessNodeType) => void
  onNodeMenuClick?: (node: ProcessNodeType) => void
  onEdgeClick?: (edge: EdgeSingular) => void
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

function setNodeUnselectStyle(node: NodeSingular) {
  node.style('border-color', 'gray')
  node.style('border-width', 1)
}

function setNodeSelectStyle(node: NodeSingular) {
  node.style('border-color', '#3b82f6')
  node.style('border-width', 2)
}

export const ProcessViewWithEditMode = forwardRef(function ({
  nodes,
  onNodeClick,
  onNodeMenuClick,
  onEdgeClick,
  onAddEdge,
}: ProcessViewWithEditModeProps, ref: ForwardedRef<ProcessViewWithEditModeRef>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cytoRef = useRef<cytoscape.Core | null>(null)
  const [jsxNode, setJsxNode] = useState<ReactNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<NodeSingular | null>(null)
  const hoverButtonRef = useRef<HTMLDivElement>(null)
  const hoverPopperRef = useRef<{ update: () => void } | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPanRef = useRef<{ x: number, y: number } | null>(null)

  useEffect(() => {
    if (hoveredNode && hoverButtonRef.current) {
      hoverPopperRef.current = hoveredNode.popper({
        content: hoverButtonRef.current,
        popper: {
          placement: 'bottom',
          strategy: 'fixed',
        }
      })
    } else {
      hoverPopperRef.current = null
    }
  }, [hoveredNode])

  const changePanRef = useRef(
    debounce((pan: { x: number, y: number }) => {
      lastPanRef.current = pan
    }, 100)
  ).current

  useEffect(() => {
    if (!containerRef.current) return

    const pan = lastPanRef.current || {
      x: (containerRef.current.clientWidth || 0) / 2,
      y: (containerRef.current.clientHeight || 0) / 2,
    }
    lastPanRef.current = pan

    // 计算 pan 边界
    const { maxLayerCount, maxNodesInLayer } = calculatePanBounds(nodes)
    const maxPanX = maxLayerCount * X_LAYER_WIDTH + 200
    const maxPanY = maxNodesInLayer * Y_NODE_HEIGHT + 100

    const cy = cytoscape({
      container: containerRef.current,
      elements: parseProcessNodesIntoCytoscapeElements(nodes),
      // zoom: 0.5,
      zoomingEnabled: false,
      userZoomingEnabled: false,
      panningEnabled: true,
      userPanningEnabled: true,
      pan,
      style: [
        {
          selector: 'node',
          style: {
            'shape': 'round-rectangle',
            'width': (ele: NodeSingular) => {
              const data = ele.scratch('vanillaData') as ProcessNodeType | undefined
              const textLength = measureTextLength(data?.name || '', 14)
              return textLength + 24
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
            'color': '#4a4a4a',
            'font-size': 14,
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

    cy.on('pan', () => {
      const currentPan = cy.pan()
      const newPan = { ...currentPan }
      let needUpdate = false

      // 限制 x 轴 pan
      if (Math.abs(newPan.x) > maxPanX) {
        newPan.x = newPan.x > 0 ? maxPanX : -maxPanX
        needUpdate = true
      }

      // 限制 y 轴 pan
      if (Math.abs(newPan.y) > maxPanY) {
        newPan.y = newPan.y > 0 ? maxPanY : -maxPanY
        needUpdate = true
      }

      if (needUpdate) {
        cy.pan(newPan)
      }

      changePanRef(needUpdate ? newPan : currentPan)
    })

    let selectNode: NodeSingular | null = null
    let currentMouseHoverNode: NodeSingular | null = null
    // make all nodes and edges selectable
    cy.elements('node[type != "virtual_node"]')
      .selectify()
      .on('mouseover', (event) => {
        currentMouseHoverNode = event.target as NodeSingular
        const node = event.target as NodeSingular

        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current)
          hideTimerRef.current = null
        }
        setHoveredNode(node)

        if (node.active() || node.selected()) return
        setNodeSelectStyle(node)
      })
      .on('mouseout', (event) => {
        currentMouseHoverNode = null
        // modify border color to gray
        const node = event.target as NodeSingular

        hideTimerRef.current = setTimeout(() => {
          setHoveredNode(null)
        }, 100)

        if (node.active() || node.selected()) return
        setNodeUnselectStyle(node)
      })
      .on('mousedown', (event) => {
        selectNode = event.target as NodeSingular
      })
    cy.on('mouseup', () => {
      togglePopperContainer(false)
      if (currentMouseHoverNode && selectNode) {
        const selectNodeId = selectNode.data('id') as ProcessNodeIdType
        const currentMouseHoverNodeId = currentMouseHoverNode.data('id') as ProcessNodeIdType

        if (selectNodeId === currentMouseHoverNodeId) {
          setNodeUnselectStyle(selectNode)
          selectNode.unselect()
          selectNode = null
          return
        }
        try {
          onAddEdge?.(selectNodeId, currentMouseHoverNodeId, addEdge(nodes, selectNodeId, currentMouseHoverNodeId))
        } catch (error) {
          message.error('边创建失败:' + (error as Error).message)
        }
        return
      }
      if (selectNode) {
        setNodeUnselectStyle(selectNode)
        selectNode.unselect()
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

    cy.on('click', 'node', (event) => {
      const node = event.target as NodeSingular
      node.select()
      onNodeClick?.(node.scratch('vanillaData') as ProcessNodeType)
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
  }, [nodes, onNodeClick, onEdgeClick, onAddEdge, onNodeMenuClick, changePanRef])

  useImperativeHandle(ref, () => ({
    popupMenuAtNode: (nodeId: ProcessNodeIdType, jsxNode: ReactNode) => {
      const cy = cytoRef.current as cytoscape.Core
      if (!cy) return
      const node = cy.getElementById(nodeId.toString()) as NodeSingular
      if (!node) return

      setJsxNode(jsxNode)
      node.popper({
        content: popperContainerDOM,
        popper: {
          placement: 'bottom',
          strategy: 'fixed',
        }
      })
      togglePopperContainer(true)
    },
    hideNodeMenu: () => {
      togglePopperContainer(false)
      setJsxNode(null)
    }
  }))

  const handleMouseEnterButton = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  const handleMouseLeaveButton = () => {
    hideTimerRef.current = setTimeout(() => {
      setHoveredNode(null)
    }, 100)
  }

  const handleMenuButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hoveredNode) {
      onNodeMenuClick?.(hoveredNode.scratch('vanillaData') as ProcessNodeType)
    }
  }

  return (
    <>
      <div className="h-full flex justify-center items-center flex-1 w-full" ref={containerRef}>
      </div>
      {createPortal(jsxNode, popperContainerDOM)}
      <div
        ref={hoverButtonRef}
        className="fixed z-[9998] flex items-center justify-center w-6 h-6 bg-white border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 hover:border-blue-400 text-gray-500 hover:text-blue-500 transition-all rounded-full"
        style={{ display: hoveredNode ? 'flex' : 'none' }}
        onMouseEnter={handleMouseEnterButton}
        onMouseLeave={handleMouseLeaveButton}
        onClick={handleMenuButtonClick}
      >
        <MenuOutlined style={{ fontSize: 12 }} />
      </div>
    </>
  );
})
// 此参数越大，流程图左右gap越小
const PanBasicX = 250
// 此参数越大，流程图上下gap越大
const PanBasicY = 30

function ProcessView({ nodes, onNodeClick }: ProcessViewProps) {
  const cytoRef = useRef<cytoscape.Core | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastPanRef = useRef<{ x: number, y: number } | null>(null)

  const changePanRef = useRef(
    debounce((pan: { x: number, y: number }) => {
      lastPanRef.current = pan
    }, 100)
  ).current

  // 初始化 cytoscape 实例（仅挂载时）
  useEffect(() => {
    if (!containerRef.current) return

    const pan = lastPanRef.current || {
      x: (containerRef.current.clientWidth || 0) / 3,
      y: (containerRef.current.clientHeight || 0) / 2,
    }
    lastPanRef.current = pan

    // 计算 pan 边界
    const { maxLayerCount, maxNodesInLayer } = calculatePanBounds(nodes)
    const maxPanX = maxLayerCount * X_LAYER_WIDTH / 2
    const maxPanY = maxNodesInLayer * Y_NODE_HEIGHT / 2

    cytoRef.current = cytoscape({
      container: containerRef.current,
      elements: [],
      zoomingEnabled: false,
      userZoomingEnabled: false,
      panningEnabled: true,
      userPanningEnabled: true,
      pan,
      style: [
        {
          selector: 'node[type != "virtual_node"]',
          style: {
            'shape': 'round-rectangle',
            'width': (ele: NodeSingular) => {
              const data = ele.scratch('vanillaData') as ProcessNodeType | undefined
              const textLength = measureTextLength(data?.name || '', 14)
              return textLength + 24
            },
            'height': 1,
            'padding': '16px',
            'label': (ele: NodeSingular) => {
              const data = ele.scratch('vanillaData') as ProcessNodeType | undefined
              return data?.name || ''
            },
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': 14,
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
            'height': 2,
            'padding': '16px',
            'background-color': 'rgba(255,255,255,0)',
            'label': '',
            'background-image': buildVirtualNodeLine(2),
            'background-repeat': 'no-repeat',
            'background-position-y': 17,
            'background-width': '100%',
            'background-height': 2,
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


    cytoRef.current.on('pan', () => {
      if (!cytoRef.current) return
      // if (triggerPanEvent) return
      const cy = cytoRef.current
      const currentPan = cy.pan()
      const newPan = { ...currentPan }
      const needUpdate = false
      console.log(newPan.y)

      // 限制 x 轴 pan
      if (newPan.x > maxPanX - PanBasicX * 3 || newPan.x < -maxPanX + PanBasicX * 3) {
        newPan.x = newPan.x > 0 ? maxPanX - PanBasicX * 3 : -maxPanX + PanBasicX * 3
        // needUpdate = true
      }

      // 限制 y 轴 pan
      // 居中线
      const PanYBasicMove = maxPanY * 2
      if ((newPan.y > PanYBasicMove + PanBasicY) || newPan.y < PanYBasicMove - PanBasicY) {
        newPan.y = newPan.y > PanYBasicMove ? PanYBasicMove + PanBasicY : PanYBasicMove - PanBasicY
        // needUpdate = true
      }

      if (needUpdate) {
        cy.pan(newPan)
      }

      changePanRef(needUpdate ? newPan : currentPan)
    })

    // 添加节点悬停效果
    cytoRef.current.elements('node[type != "virtual_node"]')
      .on('mouseover', (event) => {
        const node = event.target as NodeSingular
        if (node.active() || node.selected()) return
        setNodeSelectStyle(node)
      })
      .on('mouseout', (event) => {
        const node = event.target as NodeSingular
        if (node.active() || node.selected()) return
        setNodeUnselectStyle(node)
      })

    // 添加节点点击事件
    cytoRef.current.on('click', 'node[type != "virtual_node"]', (event) => {
      const node = event.target as NodeSingular
      node.select()
      onNodeClick?.(node.scratch('vanillaData') as ProcessNodeType)
    })

    return () => {
      if (cytoRef.current) {
        const cy = cytoRef.current as cytoscape.Core
        cy.removeAllListeners()
        cy.destroy()
        cytoRef.current = null
      }
    }
  }, [nodes, onNodeClick, changePanRef])

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
