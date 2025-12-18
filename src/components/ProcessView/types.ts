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
  [key: string]: any
}

export interface ProcessViewTypes {
  start: ProcessNodeIdType[]
  end: ProcessNodeIdType[]
  maps: Record<string, ProcessNodeType>
  showDutys: string[]
}
