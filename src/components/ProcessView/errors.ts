export class NodeNotFoundError extends Error {
  constructor(nodeId: string | number) {
    super(`节点 ${nodeId} 不存在`)
    this.name = 'NodeNotFoundError'
  }
}

export class CycleDetectedError extends Error {
  constructor(startNodeId: string | number, endNodeId: string | number) {
    super(`添加边 ${startNodeId} -> ${endNodeId} 会形成环`)
    this.name = 'CycleDetectedError'
  }
}

export class EdgeDeletionError extends Error {
  constructor(startNodeId: string | number, endNodeId: string | number) {
    super(`删除边 ${startNodeId} -> ${endNodeId} 会使节点 ${endNodeId} 无法到达开始节点`)
    this.name = 'EdgeDeletionError'
  }
}

export class NodeDeletionError extends Error {
  constructor(nodeId: string | number, reason: string) {
    super(`无法删除节点 ${nodeId}: ${reason}`)
    this.name = 'NodeDeletionError'
  }
}

export class EdgeAlreadyExistsError extends Error {
  constructor(startNodeId: string | number, endNodeId: string | number) {
    super(`边 ${startNodeId} -> ${endNodeId} 已存在`)
    this.name = 'EdgeAlreadyExistsError'
  }
}