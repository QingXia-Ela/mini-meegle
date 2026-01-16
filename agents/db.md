空间(space)
- id[pk]
- icon
- name
- workItems
- managers(user[])
- members(user[])

用户(user)
- id[pk]
- name
- email
- md5pwd
- avatar
- joinSpaces(space[])
- favorites(favorite[])

空间-用户关系(space_user)
- uid[user]
- sid[space]

工作项(workItem)
- sid(space[pk])
- id[pk]
- name
- tasks(task[])
- icon
- fields(field[])

工作项-空间关系(workItem_space)
- sid[space]
- wid[workItem]

任务(task)
- wid(workItem[pk])
- id[pk]
- workflowType(workflowType)
- nodeStatusList(nodeStatus[])
- fieldStatusList(fieldStatus[])
- comments(comment[])
- timestamp

工作项-任务(workItem_task)
- wid[workItem]
- id[pk]
- tid[task]

流程类型(workflowType)
- id[pk]
- wid[workItem]
- name
- nodeMap(node[])

节点(node)
- id[pk]
- name
- prevIds(node[])
- nextIds(node[])

节点状态(nodeStatus)
- tid(task[pk])
- id[pk]
- status
- subTasks(subTask[])
- schedule
- maintainers(user[])

节点子任务(subTask)
- id[pk]
- status
- schedule
- maintainers(user[])

工作项字段(field)
- wid(workItem[pk])
- id[pk]
- name
- fieldType
- fieldOptions[JSON[fieldType]]

工作项字段状态(fieldStatus)
- id[pk]
- fid(field[pk])
- fieldValue[JSON[field[fieldType]]]

任务评论(taskComment)
- id[pk]
- tid(task[pk])
- uid(user[pk])
- rid?(taskComment[pk])
- content
- additionData[JSONObject]

收藏(favorite)
