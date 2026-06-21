import { Project } from '@/types'

export const projects: Project[] = [
  { id: 'p001', name: '光子嫩肤', category: '皮肤美容', price: 1980, isGift: false },
  { id: 'p002', name: '热玛吉第五代', category: '抗衰紧致', price: 29800, isGift: false },
  { id: 'p003', name: '超声炮', category: '抗衰紧致', price: 16800, isGift: false },
  { id: 'p004', name: '玻尿酸填充（乔雅登）', category: '注射美容', price: 6800, isGift: false },
  { id: 'p005', name: '瘦脸针（保妥适）', category: '注射美容', price: 3800, isGift: false },
  { id: 'p006', name: '双眼皮手术', category: '整形手术', price: 8800, isGift: false },
  { id: 'p007', name: '鼻综合整形', category: '整形手术', price: 28800, isGift: false },
  { id: 'p008', name: '水光针', category: '皮肤美容', price: 1280, isGift: false },
  { id: 'p009', name: '果酸换肤', category: '皮肤美容', price: 680, isGift: false },
  { id: 'p010', name: '超皮秒祛斑', category: '皮肤美容', price: 3680, isGift: false },
  { id: 'p011', name: '免费皮肤检测', category: '赠送项目', price: 0, isGift: true },
  { id: 'p012', name: '免费补水面膜', category: '赠送项目', price: 0, isGift: true },
  { id: 'p013', name: '假体隆胸', category: '整形手术', price: 58800, isGift: false },
  { id: 'p014', name: '腰腹吸脂', category: '整形手术', price: 18800, isGift: false },
  { id: 'p015', name: '线雕提升', category: '抗衰紧致', price: 12800, isGift: false }
]

export const getProjectById = (id: string): Project | undefined => {
  return projects.find(p => p.id === id)
}

export const getProjectsByIds = (ids: string[]): Project[] => {
  return projects.filter(p => ids.includes(p.id))
}

export const getGiftProjects = (): Project[] => {
  return projects.filter(p => p.isGift)
}

export const getPaidProjects = (): Project[] => {
  return projects.filter(p => !p.isGift)
}
