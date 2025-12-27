import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import type { ProcessNodeType } from './types';
import { PRECOMPUTED_CURVATURE_STYLES, parseProcessNodesIntoCytoscapeElements } from './utils';

interface ProcessViewProps {
  editMode?: boolean;
  nodes: ProcessNodeType[]
}


function ProcessView({ nodes }: ProcessViewProps) {

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
      zoomingEnabled: false,
      userZoomingEnabled: false,
      panningEnabled: false,
      userPanningEnabled: false,
      pan,
      style: [
        {
          selector: 'edge',
          style: {
            'width': 1,
            'line-color': '#aaa',
            'curve-style': 'unbundled-bezier',
            // 直接读取预计算的 data 值
            'control-point-distances': (ele) => {
              console.log(ele.data('control-point-distances'));
              
              return ele.data('control-point-distances')
            },
            'control-point-weights': (ele) => ele.data('control-point-weights'),
          }
        },
      ]
    })

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
