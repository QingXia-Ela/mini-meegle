import type { ProcessNodeType } from './types';
import type cytoscape from 'cytoscape';

const DEFAULT_OPTIONS = {
  selectable: true,
  locked: true,
  grabbable: false,
  pannable: false,
}

export function parseProcessNodesIntoCytoscapeElements(nodes: ProcessNodeType[]): cytoscape.CytoscapeOptions['elements'] {
  // 构造 id -> node 映射（id 统一为字符串）
  const nodeMap: Record<string, ProcessNodeType> = {}
  nodes.forEach((n) => { nodeMap[String(n.id)] = n })

  // 记录每个节点的层数（layer），以及每层的遍历顺序
  const nodeLayerMap: Record<string, number> = {}
  const nodeYAxisOrderMap: Record<number, string[]> = {}

  // 找到起始节点：没有 prevNodes 的节点；若没有则以所有节点作为起点（覆盖环或断链）
  const startIds: string[] = nodes.filter(n => !n.prevNodes || n.prevNodes.length === 0).map(n => String(n.id))
  if (startIds.length === 0) {
    nodes.forEach(n => startIds.push(String(n.id)))
  }

  function dfs(id: string, layer: number) {
    const prevLayer = nodeLayerMap[id]
    if (prevLayer !== undefined) {
      // 若已有层数，则仅在当前层数更大时更新并继续遍历
      if (layer > prevLayer) {
        // 从旧层的顺序中移除
        const arr = nodeYAxisOrderMap[prevLayer]
        if (arr) {
          const idx = arr.indexOf(id)
          if (idx >= 0) arr.splice(idx, 1)
        }
        nodeLayerMap[id] = layer
      } else {
        return
      }
    } else {
      nodeLayerMap[id] = layer
    }

    if (!nodeYAxisOrderMap[layer]) nodeYAxisOrderMap[layer] = []
    nodeYAxisOrderMap[layer].push(id)

    const node = nodeMap[id]
    if (!node || !node.nextNodes) return
    for (const nxt of node.nextNodes) {
      dfs(String(nxt), layer + 1)
    }
  }

  // 从所有起点开始深度优先遍历
  for (const sid of startIds) dfs(sid, 0)
  // 确保每个节点都被访问（处理未连通或环的情况）
  for (const n of nodes) {
    const id = String(n.id)
    if (nodeLayerMap[id] === undefined) dfs(id, 0)
  }

  // 构建 cytoscape elements，节点包含 position 字段
  const elements: cytoscape.CytoscapeOptions['elements'] = []

  // 节点位置计算
  nodes.forEach((n) => {
    const id = String(n.id)
    const layer = nodeLayerMap[id] ?? 0
    const layerOrder = nodeYAxisOrderMap[layer] ?? []
    const yIndex = layerOrder.indexOf(id)
    const x = layer * 180
    const y = ((yIndex === -1 ? 0 : yIndex) * 50) - ((layerOrder.length - 1) * 25)

    // 将 position 加入到节点的原始数据副本中（不直接修改原对象）
    const vanillaWithPos = { ...n, position: { x, y } }

    elements.push({ data: { id: String(n.id) }, position: { x, y }, scratch: { vanillaData: vanillaWithPos }, ...DEFAULT_OPTIONS, selectable: false })
  })

  // 按照区间计算边（根据规范 59-63）
  // 建立一个点的 xy 表，key 为 x（层数），value 为 y[]（该层上的节点id数组，有序）
  const layerNodesMap: Record<number, string[]> = {}
  const maxLayer = Math.max(...Object.values(nodeLayerMap), 0)
  
  // 填充每层的节点数组（已按 y 轴顺序排列）
  for (let layer = 0; layer <= maxLayer; layer++) {
    layerNodesMap[layer] = nodeYAxisOrderMap[layer] || []
  }

  // 遍历每一个区间（相邻两层之间）
  for (let layer = 0; layer < maxLayer; layer++) {
    const leftLayerNodes = layerNodesMap[layer] || []
    const rightLayerNodes = layerNodesMap[layer + 1] || []
    
    if (leftLayerNodes.length === 0 || rightLayerNodes.length === 0) continue

    // 计算左侧节点到右侧节点的连接关系
    // 对于左侧每个节点，找到它连接的所有右侧节点
    const leftNodeConnections: Record<string, string[]> = {}
    
    leftLayerNodes.forEach((leftNodeId) => {
      const leftNode = nodeMap[leftNodeId]
      if (leftNode && leftNode.nextNodes) {
        // 找出该节点连接的所有右侧节点（在下一层的节点）
        const connectedRightNodes = leftNode.nextNodes
          .map(String)
          .filter((targetId) => {
            const targetLayer = nodeLayerMap[targetId]
            return targetLayer === layer + 1
          })
        if (connectedRightNodes.length > 0) {
          leftNodeConnections[leftNodeId] = connectedRightNodes
        }
      }
    })

    // 计算右侧节点从左侧节点的连接关系（用于计算 rightIndex）
    const rightNodeIncomingConnections: Record<string, string[]> = {}
    
    rightLayerNodes.forEach((rightNodeId) => {
      const rightNode = nodeMap[rightNodeId]
      if (rightNode && rightNode.prevNodes) {
        // 找出连接该节点的所有左侧节点（在当前层的节点）
        const connectedLeftNodes = rightNode.prevNodes
          .map(String)
          .filter((sourceId) => {
            const sourceLayer = nodeLayerMap[sourceId]
            return sourceLayer === layer
          })
        if (connectedLeftNodes.length > 0) {
          rightNodeIncomingConnections[rightNodeId] = connectedLeftNodes
        }
      }
    })

    // 为左侧每个节点计算其输出边的索引
    leftLayerNodes.forEach((leftNodeId) => {
      const connectedRightNodes = leftNodeConnections[leftNodeId] || []
      if (connectedRightNodes.length === 0) return

      // 左侧点总数：该节点所在区间的节点总数
      const leftTotal = layerNodesMap[layer].length

      // 为每条连接创建边
      connectedRightNodes.forEach((rightNodeId) => {
        // 计算右侧节点在右侧层中的 y 索引
        const rightIndex = rightLayerNodes.findIndex(node => node === rightNodeId)
        if (rightIndex === -1) return

        // 右侧点总数：该右侧节点从左侧接收的连接数（在当前区间内）
        const rightTotal = layerNodesMap[layer + 1].length

        // 计算右侧点终点序号：当前左侧节点在右侧节点的输入连接中的位置
        const leftIndex = leftLayerNodes.findIndex(node => node === leftNodeId)
        if (leftIndex === -1) return

        // 根据规范 44：边的标识信息
        // `${左侧点总数}-${当前边左侧点起点序号}-${右侧点总数}-${右侧点终点序号}`
        const edgeId = `${leftNodeId}-${rightNodeId}-${leftIndex}`

        // 预计算曲线样式（上限 16）
        const curvatureStyle = getPrecomputedCurvatureStyle(leftTotal, leftIndex, rightTotal, rightIndex)

        console.log(leftNodeId, rightNodeId, leftIndex, rightIndex, leftTotal, rightTotal, curvatureStyle);
        

        // 在边的 data 中存储预计算的样式值
        elements.push({
          data: {
            id: edgeId,
            source: leftNodeId,
            target: rightNodeId,
            'control-point-distances': curvatureStyle['control-point-distances'],
            'control-point-weights': curvatureStyle['control-point-weights'],
          },
          ...DEFAULT_OPTIONS
        })
      })
    })
  }

  return elements
}


export function getColorByStatus(status: string) {
  switch (status) {
    case 'in_progress':
      return {
        backgroundColor: 'rgb(255, 198, 10)',
        borderColor: 'rgb(219, 167, 0)',
      };
    case 'completed':
      return {
        backgroundColor: 'rgb(61, 188, 47)',
        borderColor: 'rgb(14, 138, 0)',
      }

    default:
      return {
        backgroundColor: 'rgb(208, 211, 214)',
        borderColor: 'rgb(187, 191, 196)',
      };
  }
}

function curveCaleWithoutAlign(leftTotal: number, leftIndex: number, rightTotal: number, rightIndex: number): {
  'control-point-distances': [number, number];
  'control-point-weights': [number, number];
} {
  const startAlignIndex = (leftTotal - rightTotal);
  const caseOfHeight = ((-(leftIndex * 2) + startAlignIndex + (rightIndex * 2)) / 2);
  // 最大为 6.5，每次递增或递减 1
  switch (caseOfHeight) {
    case -4.5:
      return {
        'control-point-distances': [20, -20],
        'control-point-weights': [0.34, 0.66]
      }
    case -3.5:
      return {
        'control-point-distances': [54,-54],
        'control-point-weights': [0.15,0.85]
      }
    case -2.5:
      return {
        'control-point-distances': [46,-46],
        'control-point-weights': [0.20,0.8]
      }
    case -1.5:
      return {
        'control-point-distances':[28,-28],
        'control-point-weights': [0.25,0.75]
      }
    case -0.5:
      return {
        'control-point-distances': [10,-10],
        'control-point-weights': [0.25,0.75]
      }
      case 0.5:
        return {
          'control-point-distances': [-10,10],
          'control-point-weights': [0.25,0.75]
        }
    case 1.5:
      return {
        'control-point-distances': [-28,28],
        'control-point-weights': [0.25,0.75]
      }
    case 2.5:
      return {
        'control-point-distances': [-46,46],
        'control-point-weights': [0.20,0.8]
      }
    case 3.5:     
      return {
        'control-point-distances': [-54,54],
        'control-point-weights': [0.15,0.85]
      }
    case 4.5:
      return {
        'control-point-distances': [-20,20],
        'control-point-weights': [0.34,0.66]
      }
    case -5.5:
      return {
        'control-point-distances': [28,-28],
        'control-point-weights': [0.26,0.74]
      }
    case 5.5:
      return {
        'control-point-distances': [-28,28],
        'control-point-weights': [0.26,0.74]
      }
    case -6.5:
      return {
        'control-point-distances': [32,-32],
        'control-point-weights': [0.2,0.8]
      }
    case 6.5:
      return {
        'control-point-distances': [-32,32],
        'control-point-weights': [0.2,0.8]
      }
  }
  return {
    'control-point-distances': [0,0],
    'control-point-weights': [0.5,0.5]
  }
}

function curveCaleWithAlign(leftTotal: number, leftIndex: number, rightTotal: number, rightIndex: number): {
  'control-point-distances': [number, number];
  'control-point-weights': [number, number];
} {
  // 单数可以启用 alignIndex
  const startAlignIndex = (leftTotal - rightTotal) / 2;
  const caseOfHeight = (-leftIndex + startAlignIndex + rightIndex);
  switch (caseOfHeight) {
    case -1:
      return {
        'control-point-distances': [17,-17],
        'control-point-weights': [0.2,0.8]
      }
    case 1:
      return {
        'control-point-distances': [-17,17],
        'control-point-weights': [0.2,0.8]
      }
    case -2:
      return {
        'control-point-distances': [34,-34],
        'control-point-weights': [0.2,0.8]
      }
    case 2:
      return {
        'control-point-distances': [-34,34],
        'control-point-weights': [0.2,0.8]
      }
    case -3:
      return {
        'control-point-distances': [51,-51],
        'control-point-weights': [0.2,0.8]
      }
    case 3:
      return {
        'control-point-distances': [-51,51],
        'control-point-weights': [0.2,0.8]
      }
  }


  return {
    'control-point-distances': [0,0],
    'control-point-weights': [0.5,0.5]
  }
}

/**
 * 计算贝塞尔曲线的曲率参数
 * 根据规范：边的id格式为 `${左侧点总数}-${当前边左侧点起点序号}-${左侧点起点id}-${右侧点总数}-${右侧点终点序号}-${右侧点终点id}`
 * 
 * @param leftTotal 左侧点总数（源节点的输出边数）
 * @param leftIndex 当前边左侧点起点序号（在源节点输出中的索引，从0开始）
 * @param rightTotal 右侧点总数（目标节点的输入边数）
 * @param rightIndex 右侧点终点序号（在目标节点输入中的索引，从0开始）
 * @returns 返回贝塞尔曲线的控制点距离和权重
 */
export function calculateBezierCurvature(
  leftTotal: number,
  leftIndex: number,
  rightTotal: number,
  rightIndex: number
): {
  'control-point-distances': [number, number];
  'control-point-weights': [number, number];
} {
  // 确保索引在有效范围内
  leftIndex = Math.max(0, Math.min(leftIndex, leftTotal - 1));
  rightIndex = Math.max(0, Math.min(rightIndex, rightTotal - 1));

  // 判断左右两侧的单双数情况
  const leftIsOdd = leftTotal % 2 === 1;
  const rightIsOdd = rightTotal % 2 === 1;
  const isAligned = leftIsOdd === rightIsOdd; // 两侧都为单数或都为双数

  if (isAligned) {
    if (leftTotal === rightTotal && leftIndex === rightIndex) {
      // 平行节点不需要曲率
      return {
        'control-point-distances': [0, 0],
        'control-point-weights': [0.5, 0.5]
      }
    }
    const startAlignIndex = Math.abs(leftTotal - rightTotal) / 2;
    if (leftTotal < rightTotal && leftIndex === rightIndex - startAlignIndex) {
      return {
        'control-point-distances': [0, 0],
        'control-point-weights': [0.5, 0.5]
      }
    }
    if (leftTotal > rightTotal && leftIndex - startAlignIndex === rightIndex) {
      return {
        'control-point-distances': [0, 0],
        'control-point-weights': [0.5, 0.5]
      }
    }
    return curveCaleWithAlign(leftTotal, leftIndex, rightTotal, rightIndex);
  } else {
    return curveCaleWithoutAlign(leftTotal, leftIndex, rightTotal, rightIndex);
  }
}

/**
 * 预计算所有可能的曲线样式（单侧节点数量上限 16）
 * key 格式: `${leftTotal}-${leftIndex}-${rightTotal}-${rightIndex}`
 */
export function generatePrecomputedCurvatureStyles(): Record<string, {
  'control-point-distances': [number, number];
  'control-point-weights': [number, number];
}> {
  const styles: Record<string, {
    'control-point-distances': [number, number];
    'control-point-weights': [number, number];
  }> = {}

  const MAX_NODES = 8

  for (let leftTotal = 1; leftTotal <= MAX_NODES; leftTotal++) {
    for (let leftIndex = 0; leftIndex < leftTotal; leftIndex++) {
      for (let rightTotal = 1; rightTotal <= MAX_NODES; rightTotal++) {
        for (let rightIndex = 0; rightIndex < rightTotal; rightIndex++) {
          const key = `${leftTotal}-${leftIndex}-${rightTotal}-${rightIndex}`
          styles[key] = calculateBezierCurvature(leftTotal, leftIndex, rightTotal, rightIndex)
        }
      }
    }
  }

  return styles
}

// 预计算的样式映射表
export const PRECOMPUTED_CURVATURE_STYLES = generatePrecomputedCurvatureStyles()

/**
 * 根据预计算的样式映射表获取曲线样式
 * @param leftTotal 左侧点总数
 * @param leftIndex 当前边左侧点起点序号
 * @param rightTotal 右侧点总数
 * @param rightIndex 右侧点终点序号
 * @returns 返回贝塞尔曲线的控制点距离和权重，如果不存在则返回默认值
 */
export function getPrecomputedCurvatureStyle(
  leftTotal: number,
  leftIndex: number,
  rightTotal: number,
  rightIndex: number
): {
  'control-point-distances': [number, number];
  'control-point-weights': [number, number];
} {
  // 确保索引在有效范围内（限定在 1~16）
  const safeLeftTotal = Math.max(1, Math.min(leftTotal, 8))
  const safeLeftIndex = Math.max(0, Math.min(leftIndex, safeLeftTotal - 1))
  const safeRightTotal = Math.max(1, Math.min(rightTotal, 8))
  const safeRightIndex = Math.max(0, Math.min(rightIndex, safeRightTotal - 1))

  const key = `${safeLeftTotal}-${safeLeftIndex}-${safeRightTotal}-${safeRightIndex}`
  const style = PRECOMPUTED_CURVATURE_STYLES[key]

  if (style) return style

  // 默认值
  return {
    'control-point-distances': [0,0],
    'control-point-weights': [0.5, 0.5]
  }
}