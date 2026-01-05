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
    nextNodes: ['mid_0', 'mid_1', 'mid_2', 'mid_3', 'mid_4'],
    id: 'start',
    visible: true,
  },
  'mid_1': {
    status: 'in_progress',
    name: '中间节点',
    canUndo: true,
    canDelete: true,
    prevNodes: ['start'],
    nextNodes: ['mid_1_1'],
    id: 'mid_1',
    visible: true,
  },
  'mid_2': {
    status: 'in_progress',
    name: '中间节点',
    canUndo: true,
    canDelete: true,
    prevNodes: ['start'],
    nextNodes: ['end'],
    id: 'mid_2',
    visible: true,
  },
  'mid_3': {
    status: 'in_progress',
    name: '中间节点',
    canUndo: true,
    canDelete: true,
    prevNodes: ['start'],
    nextNodes: ['end'],
    id: 'mid_3',
    visible: true,
  },
  'mid_0': {
    status: 'in_progress',
    name: '中间节点',
    canUndo: true,
    canDelete: true,
    prevNodes: ['start'],
    nextNodes: ['end'],
    id: 'mid_0',
    visible: true,
  },
  'mid_1_1': {
    status: 'in_progress',
    name: '中间节点',
    canUndo: true,
    canDelete: true,
    prevNodes: ['mid_1'],
    nextNodes: ['end'],
    id: 'mid_1_1',
    visible: true,
  },
  'mid_4': {
    status: 'in_progress',
    name: '中间节点',
    canUndo: true,
    canDelete: true,
    prevNodes: ['start'],
    nextNodes: ['end'],
    id: 'mid_4',
    visible: true,
  },
  'end': {
    status: 'pending',
    name: '结束',
    canUndo: true,
    canDelete: false,
    prevNodes: ['mid_0', 'mid_1_1', 'mid_2', 'mid_3', 'mid_4'],
    nextNodes: [],
    id: 'end',
    visible: true,
  }
}