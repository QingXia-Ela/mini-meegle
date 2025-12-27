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
    nextNodes: ['mid-1', 'end'],
    id: 'start',
    visible: true,
  },
  'mid-1': {
    status: 'in_progress',
    name: '中间节点',
    canUndo: true,
    canDelete: true,
    prevNodes: ['start'],
    nextNodes: ['end'],
    id: 'mid-1',
    visible: true,
  },
  
  // 'mid-end': {
  //   status: 'pending',
  //   name: '中间节点结束',
  //   canUndo: true,
  //   canDelete: true,
  //   visible: true,
  //   prevNodes: ['start'],
  //   nextNodes: [],
  //   id: 'mid-end',
  // },
  'end': {
    status: 'pending',
    name: '结束',
    canUndo: true,
    canDelete: false,
    prevNodes: ['mid-1', 'start'],
    nextNodes: [],
    id: 'end',
    visible: true,
  }
}