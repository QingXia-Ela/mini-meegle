# 注意事项

涉及到模型改动时，需要对本文件做同步修改。

如果遇到无法确定的数据库关系情况，先阅读模型相关代码文件，如依然不确定，可以在对话提出疑问并让开发者补充上下文。

# 具体设计

空间(space, spaces)
- id[pk,string(10)]
- icon[text,long]
- name[text]
- users[through space_user]
- timestamps

用户(user, users)
- id[pk,int]
- name
- email[unique]
- md5pwd
- avatar?
- timestamps

空间-用户关系(space_user)
- uid[user.id][pk]
- sid[space.id][pk]
- space_permission(enum SpacePermission)
- display_permission[virtual]

工作项(workItem, workItems)
- id[pk,string(10)]
- sid[space.id]
- name
- icon?
- color?
- description?
- timestamps

工作项字段(workItemField, workItemFields)
- id[pk,string(16)]
- wid[workItem.id]
- name
- type(enum FieldType)
- config[text,long]
- systemType[virtual]
- isRequire[virtual]
- jsonConfig[virtual]
- timestamps

工作项角色(workItemRole, workItemRoles)
- id[pk,string(10)]
- wid[workItem.id]
- name
- appearance(enum RoleAppearance)
- allocation
- isSingle[bool]
- autoJoin[bool]
- timestamps

流程类型(workflowType, workflowTypes)
- id[pk,int]
- wid[workItem.id]
- name
- nodesDataRaw[text,long]
- eventsDataRaw[text,long]
- rolesDataRaw[text,long]
- nodesData[virtual json]
- eventsData[virtual json]
- rolesData[virtual json]
- timestamps

任务(task, tasks)
- id[pk,int]
- wid[workItem.id]
- workflowType[workflowTypes.id]
- fieldStatusListRaw[text,long]
- fieldStatusList[virtual json]
- creator[user.id]?
- timestamps

任务节点状态(task_node_statuses)
- id[pk,uuid]
- taskId[task.id]
- workFlowType[workflowTypes.id]
- nodeId[string]
- node_status(enum NodeStatus)
- maintainerId[user.id]?
- maintainerSchedule[text,long]?
- subTaskListRaw[text,long]?
- subTaskList[virtual json]
- timestamps

任务评论(task_comments)
- id[pk,int]
- tid[task.id]
- uid[user.id]
- rid?[task_comments.id]
- content[text]
- additionDataRaw[text,long]?
- additionData[virtual json]
- replyComment[virtual]
- timestamps

收藏(favorites)
- id[pk,int]
- type[string]
- tid[task.id]
- timestamps

通知(notices)
- id[pk,int]
- receiverId[user.id]
- senderId?[user.id]
- type(enum NoticeType)
- content[text]
- payloadRaw[text,long]?
- payload[virtual json]
- isRead[bool]
- timestamps

示例用户(example_users)
- uid[pk,int]
- name
- email[unique]
- timestamps
