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
  prevNodes: (ProcessNodeIdType | ProcessVirtualNodeType)[]
  nextNodes: (ProcessNodeIdType | ProcessVirtualNodeType)[]
  [key: string]: any
}

export interface ProcessVirtualNodeType {
  type: 'virtual_node'
  id: string
  prevNodes: (ProcessNodeIdType | ProcessVirtualNodeType)[]
  nextNodes: (ProcessNodeIdType | ProcessVirtualNodeType)[]
  [key: string]: any
}

export interface ProcessViewTypes {
  start: ProcessNodeIdType[]
  end: ProcessNodeIdType[]
  maps: Record<string, ProcessNodeType>
  showDutys: string[]
}
