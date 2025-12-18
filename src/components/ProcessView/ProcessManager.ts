import type { ProcessNodeType } from './types'
import { cloneDeep } from 'lodash-es'

export interface ParsedNode extends Omit<ProcessNodeType, 'prevNodes' | 'nextNodes'> {
  prevNodes: ParsedNode[]
  nextNodes: ParsedNode[]
}

class MapParser {
  sourceMap: Record<string, ProcessNodeType>
  currentHandleMap: { starts: ParsedNode[], ends: ParsedNode[], maps: Record<string, ParsedNode> }

  getDeepClone() {
    return cloneDeep(this.sourceMap)
  }

  constructor(sourceMap: Record<string, ProcessNodeType>) {
    this.sourceMap = cloneDeep(sourceMap)
    this.currentHandleMap = this._generateParsedNodeMap()
  }

  _generateParsedNodeMap() {
    const starts: ParsedNode[] = []
    const ends: ParsedNode[] = []
    const deepClone = this.getDeepClone()
    const handleMap = Object.fromEntries(Object.values(deepClone).map((v) => [v.id, ({
      ...v,
      prevNodes: v.prevNodes.map((v) => deepClone[v]),
      nextNodes: v.nextNodes.map((v) => deepClone[v]),
    })])) as unknown as Record<string, ParsedNode>

    const maps: Record<string, ParsedNode> = {}

    Object.values(handleMap).forEach((v) => {
      if (v.prevNodes.length === 0) {
        starts.push(v)
      }
      if (v.nextNodes.length === 0) {
        ends.push(v)
      }
      maps[v.id] = v
    })

    return {
      starts,
      maps,
      ends,
    }
  }

  refresh() {
    this._generateParsedNodeMap()
  }

  /**
   * 每次都是重新计算，
   * @param duty 职责数组
   */
  setHideNodeByRelativeDuty(duty: string[]) {
    function dfs(nodes: ParsedNode[]) {
      nodes.forEach((v) => {
        v.visible = true
        if (duty.includes(v.relativeDuty || Math.random() + '')) {
          v.visible = false
        }
      })
    }

    dfs(this.currentHandleMap.starts)

    return this
  }

  /**
   * 生成新图
   */
  calculateNewMap() {
    // 处理隐藏节点
    const { ends } = this.currentHandleMap
    const handleQueue: ParsedNode[] = [...ends]
    const node = handleQueue[0]

    while (node) {
      const hiddenNodesCount = node.prevNodes.reduce((p, c) => p + Number(!c.visible), 0)
      const totalNodesCount = node.prevNodes.length
      const visibleNodesCount = totalNodesCount - hiddenNodesCount
      // 只有一个前置节点且被隐藏
      // 向前寻找任何未被隐藏的节点
      if (totalNodesCount === 1 && totalNodesCount === hiddenNodesCount) {

      }
      // 所有前置节点都被隐藏了
      else if (hiddenNodesCount === totalNodesCount) {

      }
      // 前置节点有部分隐藏，但还有部分保持连线
      else if (totalNodesCount > hiddenNodesCount && hiddenNodesCount !== 0) {

      }
    }
  }
}

class ProcessManager {
  map: Record<string, ProcessNodeType>

  constructor(map: ProcessNodeType[]) {
    this.map = Object.fromEntries(map.map((v) => ([v.id, v])))
  }

  getMapParser() { }

  addNode() { }

  removeNode() { }

  modifyNode() { }

  getNode() { }
}

export default ProcessManager
