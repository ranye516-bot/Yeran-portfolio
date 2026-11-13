export const media = (file) => `${import.meta.env.BASE_URL}media/${file}`

export const experience = [
  {
    period: '2024.10 —',
    company: '浙江耶气满满科技有限公司',
    description: '拍摄品牌视频、电商产品视频和信息流短片。',
  },
  {
    period: '2021.07 — 2024.08',
    company: '杭州妙当家科技有限公司',
    description: '参与商业广告的创意与脚本，协调置景、布光和拍摄，并参与剪辑与调色。',
  },
  {
    period: '2020.05 — 2021.06',
    company: '杭州天道视觉摄影工作室',
    description: '参与美丽乡村宣传片、活动摄影与短视频拍摄。',
  },
]

export const metrics = [
  { value: '约 20 万', unit: '秒', label: '累计成片时长' },
  { value: '62', unit: '条', label: '品牌 Social 视频' },
  { value: '186', unit: '条', label: '电商主图视频' },
]

export const strengths = [
  { title: '前期策划', details: '广告创意、产品卖点提炼、脚本撰写' },
  { title: '商业拍摄', details: '品牌短片、电商主图视频、信息流视频' },
  { title: '片场执行', details: '置景、产品布光、演员指导、现场协调' },
  { title: '后期制作', details: '广告剪辑、成片调色（DaVinci Resolve、Premiere Pro）' },
]

export const screening = [
  {
    id: 'zojirushi',
    label: '象印',
    frame: '02.webp',
    companion: '03.webp',
    description: '先用厨房场景交代产品如何使用，再用扫光和特写呈现内锅的纹理、金属锅沿和开盖动作。',
  },
  {
    id: 'rose',
    label: '16 开',
    frame: 'cover.webp',
    companion: '02.webp',
    detail: '04.webp',
    description: '柔雾玫瑰咖啡杯的竖屏广告。用暖棕背景、枝叶和岩石衬出杯身的哑光质感。',
  },
  {
    id: 'yiyuan',
    label: '一原得物',
    frame: 'cover.webp',
    companion: '03.webp',
    description: '把器物花纹的近景和窗边饮茶的人物场景交错剪接，带出传家壶在日常里的用法。',
  },
]

export const featuredArchiveIds = ['thai-origin', 'sports-product']

export const projects = [
  {
    id: 'zojirushi',
    title: '象印炎舞电饭煲',
    category: 'TVC',
    count: 4,
    duration: '01:50',
    cardImage: '03.webp',
    note: '通过扫光表现电饭煲的表面质感，场景、服装与道具共同服务于产品呈现。',
    caseStills: [
      { index: 2, title: '材质特写', caption: '扫光掠过深色内锅，让锅沿的金属反光和表面纹理浮现。' },
      { index: 1, title: '使用场景', caption: '人物在厨房中操作电饭煲，食材和餐具交代它所处的生活场景。' },
      { index: 3, title: '操作细节', caption: '切到开盖和取放内锅的近景，把使用动作拍清楚。' },
    ],
  },
  {
    id: 'yiyuan',
    title: '一原得物 · 传家壶',
    category: '品牌 Social',
    count: 7,
    duration: '00:59',
  },
  {
    id: 'rose',
    title: '感觉生活 × 16 开',
    subtitle: '柔雾玫瑰咖啡杯',
    category: '产品广告',
    count: 4,
    duration: '00:29',
    portrait: true,
  },
  {
    id: 'mbb',
    title: 'MBB × 张柏芝',
    category: '艺人拍摄',
    count: 3,
    duration: '04:43',
  },
  {
    id: 'jia-bing',
    title: '呜咔实验室 × 贾冰',
    category: '艺人拍摄',
    count: 7,
    cardImage: '01.webp',
  },
  {
    id: 'dream',
    title: '寻梦原野',
    category: '个人创意短片',
    count: 4,
    duration: '00:59',
  },
]
