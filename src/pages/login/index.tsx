import  { useEffect, useState } from 'react'
import { Input, Button, List, Avatar, Spin, Typography, message } from 'antd'
import { AppstoreOutlined, UserOutlined, LockOutlined } from '@ant-design/icons'

type Mode = 'login' | 'register' | 'list'

const sampleSpaces = [
	{ id: '1', title: '设计团队空间', desc: '用于存放设计稿、交互文档与设计资源' },
	{ id: '2', title: '前端工作区', desc: '组件库、样式规范、以及前端任务分配' },
	{ id: '3', title: '后端服务仓库', desc: '接口文档、服务架构图与部署脚本' },
	{ id: '4', title: '产品讨论区', desc: '产品需求、会议纪要与版本计划' },
]

export default function LoginPage() {
	const [mode, setMode] = useState<Mode>('login')
	const [account, setAccount] = useState('')
	const [password, setPassword] = useState('')
	const [loadingSpaces, setLoadingSpaces] = useState(false)
	const [spaces, setSpaces] = useState<typeof sampleSpaces>([])

	useEffect(() => {
		if (mode === 'list') {
			setLoadingSpaces(true)
			setSpaces([])
			// 模拟请求延迟
			const t = setTimeout(() => {
				setSpaces(sampleSpaces)
				setLoadingSpaces(false)
			}, 1200)
			return () => clearTimeout(t)
		}
	}, [mode])

	function onLogin() {
		// 这里只做样式展示，假装登录成功
		setMode('list')
	}

	function onRegister() {
		// 模拟注册成功并切回登录
		message.success('注册成功，已切换到登录')
		setAccount('')
		setPassword('')
		setMode('login')
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100">
			<div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 relative">
				{mode !== 'list' && (
					<div>
						<h2 className="text-2xl font-semibold text-gray-800 mb-4">{mode === 'login' ? '账号登录' : '新用户注册'}</h2>

						<div className="space-y-4">
							<Input
								size="large"
								placeholder="账号"
								prefix={<UserOutlined />}
								value={account}
								onChange={(e) => setAccount(e.target.value)}
							/>

							<Input.Password
								size="large"
								placeholder="密码"
								prefix={<LockOutlined />}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>

							<Button type="primary" block size="large" onClick={mode === 'login' ? onLogin : onRegister}>
								{mode === 'login' ? '登录' : '注册'}
							</Button>
						</div>

						<div className="flex mt-4">
							<Button type="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
								{mode === 'login' ? '去注册' : '去登录'}
							</Button>
						</div>
					</div>
				)}

				{mode === 'list' && (
					<div>
						<div className="flex items-center justify-between mb-4">
							<div>
								<Typography.Title level={4} className="mb-0">请选择一个空间</Typography.Title>
								<Typography.Text type="secondary">登录成功 — 请选择下面的一个空间继续</Typography.Text>
							</div>
							<div>
								<Button size="small" onClick={() => setMode('login')}>退出</Button>
							</div>
						</div>

						<div className="rounded-lg bg-white shadow-inner p-4">
							{loadingSpaces ? (
								<div className="flex items-center justify-center py-12">
									<Spin size="large" />
								</div>
							) : (
								<List
									itemLayout="horizontal"
									dataSource={spaces}
									renderItem={(item) => (
										<List.Item className="py-3">
											<List.Item.Meta
												avatar={<Avatar size={48} icon={<AppstoreOutlined />} />}
												title={<div className="font-medium text-gray-800">{item.title}</div>}
												description={<div className="text-sm text-gray-500 truncate">{item.desc}</div>}
											/>
										</List.Item>
									)}
								/>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

