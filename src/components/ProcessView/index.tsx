import { useEffect, useLayoutEffect, useRef } from 'react';
import ProcessNode from './ProcessNode';
import cytoscape from 'cytoscape';
import type { ProcessNodeType } from './types';
import { getColorByStatus, parseProcessNodesIntoCytoscapeElements } from './utils';
import GrayBorderCard from '../GrayBorderCard';
import { Button, Collapse, Form, Input, Popover, Select, Table, Tabs, Tag } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import ProcessViewComment from '../TaskDetailPage/components/ProcessBottomInfo/Comment';

interface ProcessViewProps {
  editMode?: boolean;
  nodes: ProcessNodeType[]
}


function ProcessView({ editMode, nodes }: ProcessViewProps) {

  const cytoRef = useRef<cytoscape.Core>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const pan = {
      x: (containerRef.current?.clientWidth || 0) / 2,
      y: (containerRef.current?.clientHeight || 0) / 2,
    }
    cytoRef.current = cytoscape({
      container: containerRef.current,
      elements: parseProcessNodesIntoCytoscapeElements(nodes),
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
            'control-point-distances': [12, -12],
            'control-point-weights': [0.25, 0.75]
          }
        }
      ]
    })
  }, [])
  useEffect(() => {
    if (!cytoRef.current) return
    // cytoRef.current.data()
  }, [nodes])
  return (
    <div className="h-full flex justify-center items-center flex-1 w-full" ref={containerRef}>
    </div>
  );
}

export default ProcessView;
