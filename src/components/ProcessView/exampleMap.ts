import type { ProcessNodeType } from './types';

export const TestMap: Record<string, ProcessNodeType> = {

}

export const BasicMap: Record<string, ProcessNodeType> = {
  'start': {
    status: 'completed',
    name: '开始',
    canUndo: false,
    canDelete: false,
    prevNodes: [],
    nextNodes: ['mid', 'mid-2'],
    id: 'start',
    visible: true,
  },
  'mid': {
    status: 'in_progress',
    name: '中间节点',
    canUndo: true,
    canDelete: true,
    prevNodes: ['start'],
    nextNodes: ['end'],
    id: 'mid',
    visible: true,
  },
  'mid-2': {
    status: 'pending',
    name: '中间节点2',
    canUndo: true,
    canDelete: true,
    prevNodes: ['start'],
    nextNodes: ['end'],
    id: 'mid-2',
    visible: true,
  },
  'end': {
    status: 'pending',
    name: '结束',
    canUndo: true,
    canDelete: false,
    prevNodes: ['mid', 'mid-2'],
    nextNodes: [],
    id: 'end',
    visible: true,
  }
}