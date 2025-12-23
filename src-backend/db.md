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

工作项(workItem)
- sid(space[pk])
- id[pk]
- name
- tasks(task[])
- icon
- fields(field[])

任务(task)
- wid(workItem[pk])
- id[pk]
- taskType(taskType)
- nodeStatusList(nodeStatus[])
- fieldStatusList(fieldStatus[])
- comments(comment[])
- timestamp

任务类型(taskType)
- id[pk]
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

评论(comment)
- id[pk]
- tid(task[pk])
- uid(user[pk])
- rid?(comment[pk])
- content
- timestamp

收藏(favorite)
