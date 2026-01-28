import React from 'react';
import { AppstoreOutlined, MailOutlined, SettingOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import type { ProcessNodeIdType, ProcessNodeType } from './types';

interface NodeClickMenuProps {
  onAddNode?: (targetNodeId: ProcessNodeIdType) => void;
  onConnectNode?: (sourceNodeId: ProcessNodeIdType, targetNodeId: ProcessNodeIdType) => void;
  onDeleteNode?: (targetNodeId: ProcessNodeIdType) => void;
  onRemoveEdge?: (sourceNodeId: ProcessNodeIdType, targetNodeId: ProcessNodeIdType) => void;
  nodes: ProcessNodeType[];
  triggerNodeId: ProcessNodeIdType;
}

function parseNodes2MenuItems({
  onAddNode,
  onConnectNode,
  onDeleteNode,
  onRemoveEdge,
  nodes,
  triggerNodeId,
}: NodeClickMenuProps): MenuProps['items'] {
  const items: MenuProps['items'] = [];
  const triggerNode = nodes.find(node => node.id === triggerNodeId);
  if (!triggerNode) return items;

  items.push({
    key: 'addNode',
    label: '添加节点',
    onClick: () => onAddNode?.(triggerNodeId),
  });

  items.push({
    key: 'connectNode',
    label: '连接到',
    // onClick: onConnectNode,
    children: nodes.map(node => ({
      key: `connectTo-${node.id}`,
      label: node.name,
      onClick: () => onConnectNode?.(triggerNodeId, node.id),
    })),
  });

  // 断开连接
  if (triggerNode.nextNodes.length > 0) {
    items.push({
      key: 'removeEdge',
      label: '断开连接',
      children: triggerNode.nextNodes
        .map(node => nodes.find(n => n.id === node))
        .filter((node): node is ProcessNodeType => node !== undefined && node.type !== 'virtual_node')
        .map((node: ProcessNodeType) => ({
          key: `removeEdge-${node.id}`,
          label: node.name,
          onClick: () => onRemoveEdge?.(triggerNodeId, node.id),
        })),
    });
  }

  if (triggerNode.speicalMark !== 'startNode') {
    items.push({
      key: 'deleteNode',
      label: '删除节点',
      danger: true,
      onClick: () => onDeleteNode?.(triggerNodeId),
    });
  }

  return items
}

function NodeClickMenu({
  onAddNode,
  onConnectNode,
  onDeleteNode,
  onRemoveEdge,
  nodes,
  triggerNodeId,
}: NodeClickMenuProps) {
  return (
    <Menu mode="vertical" items={parseNodes2MenuItems({
      onAddNode,
      onConnectNode,
      onDeleteNode,
      onRemoveEdge,
      nodes,
      triggerNodeId,
    })} />
  );
}

export default NodeClickMenu;