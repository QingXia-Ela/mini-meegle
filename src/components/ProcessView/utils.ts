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

  nodes.forEach((n) => {
    const id = String(n.id)
    const layer = nodeLayerMap[id] ?? 0
    const layerOrder = nodeYAxisOrderMap[layer] ?? []
    const yIndex = layerOrder.indexOf(id)
    const x = layer * 120
    const y = ((yIndex === -1 ? 0 : yIndex) * 60) - ((layerOrder.length - 1) * 30)

    // 将 position 加入到节点的原始数据副本中（不直接修改原对象）
    const vanillaWithPos = { ...n, position: { x, y } }

    elements.push({ data: { id: String(n.id) }, position: { x, y }, scratch: { vanillaData: vanillaWithPos }, ...DEFAULT_OPTIONS, selectable: false })

    // 边
    if (n.nextNodes && n.nextNodes.length) {
      n.nextNodes.forEach((v, idx) => {
        elements.push({ data: { id: `${n.id}-${v}-${idx}`, source: n.id, target: v }, ...DEFAULT_OPTIONS })
      })
    }
  })

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