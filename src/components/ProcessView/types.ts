export type ProcessNodeStatusType = 'pending' | 'in_progress' | 'completed'

export type ProcessNodeIdType = string | number

export interface ProcessNodeType {
  id: ProcessNodeIdType
  name: string
  visible: boolean
  relativeDuty?: string
  status: ProcessNodeStatusType
  canDelete: boolean
  canUndo: boolean
  prevNodes: ProcessNodeIdType[]
  nextNodes: ProcessNodeIdType[]
  speicalMark?: 'startNode' | string
  type?: string
  [key: string]: any
}

export interface ProcessVirtualNodeType {
  type: 'virtual_node'
  id: ProcessNodeIdType
  prevNodes: ProcessNodeIdType[]
  nextNodes: ProcessNodeIdType[]
  [key: string]: any
}

export interface ProcessViewTypes {
  start: ProcessNodeIdType[]
  end: ProcessNodeIdType[]
  maps: Record<string, ProcessNodeType>
  showDutys: string[]
}

export interface AddNodeInfo {
  id: ProcessNodeIdType
  name?: string
}