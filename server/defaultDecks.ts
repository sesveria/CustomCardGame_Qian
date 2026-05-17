import { FileStore } from './FileStore.js';
import type { Deck } from '../shared/protocol.js';

const physicsDeck: Deck = {
  meta: { name: '初中物理 — 力学', description: '覆盖牛顿定律、力、运动、电学等核心概念的关系', author: '系统', version: '2.0' },
  cards: [
    // 力学
    { id: 'newton1', name: '牛顿第一定律', description: '一切物体在不受外力时总保持匀速直线运动或静止状态', category: '定律' },
    { id: 'inertia', name: '惯性', description: '物体保持原来运动状态不变的性质', category: '概念' },
    { id: 'newton2', name: '牛顿第二定律', description: '物体加速度的大小与合外力成正比，与质量成反比', category: '定律' },
    { id: 'fma', name: 'F = ma', description: '力 = 质量 × 加速度', category: '公式' },
    { id: 'force', name: '力', description: '物体对物体的作用', category: '概念' },
    { id: 'accel', name: '加速度', description: '速度变化的快慢，a = Δv/Δt', category: '概念' },
    { id: 'mass', name: '质量', description: '物体所含物质的多少，国际单位是千克', category: '概念' },
    { id: 'newton3', name: '牛顿第三定律', description: '作用力与反作用力大小相等、方向相反', category: '定律' },
    { id: 'gravity', name: '重力', description: '地球对物体的吸引力，G = mg', category: '概念' },
    { id: 'gformula', name: 'G = mg', description: '重力 = 质量 × 重力加速度', category: '公式' },
    { id: 'friction', name: '摩擦力', description: '两个相互接触的物体相对滑动时产生的阻力', category: '概念' },
    { id: 'velocity', name: '速度', description: '单位时间内物体移动的距离，v = s/t', category: '概念' },
    { id: 'displacement', name: '位移', description: '物体位置变化的有向线段', category: '概念' },
    { id: 'momentum', name: '动量', description: '物体的质量与速度的乘积，p = mv', category: '概念' },
    { id: 'energy', name: '能量', description: '物体做功的本领', category: '概念' },
    { id: 'work', name: '功', description: '力与在力方向上位移的乘积，W = Fs', category: '概念' },
    { id: 'hooke', name: '胡克定律', description: '弹簧的弹力与形变量成正比，F = kx', category: '定律' },
    { id: 'spring', name: '弹力', description: '物体发生弹性形变时产生的力', category: '概念' },
    { id: 'pressure', name: '压强', description: '单位面积上受到的压力，p = F/S', category: '概念' },
    { id: 'archimedes', name: '阿基米德原理', description: '浸在液体中的物体受到的浮力等于排开液体的重力', category: '定律' },
    { id: 'buoyancy', name: '浮力', description: '液体对浸在其中物体的向上托力', category: '概念' },
    { id: 'density', name: '密度', description: '单位体积内物质的质量，ρ = m/V', category: '概念' },
    { id: 'equilibrium', name: '二力平衡', description: '两个力大小相等、方向相反、作用在同一直线上', category: '概念' },
    { id: 'freebody', name: '受力分析', description: '分析物体受到的所有外力', category: '方法' },
    { id: 'power', name: '功率', description: '单位时间内所做的功，P = W/t', category: '概念' },
    { id: 'kinetic', name: '动能', description: '物体由于运动而具有的能量，Ek = ½mv²', category: '概念' },
    { id: 'potential', name: '势能', description: '物体由于位置或形变而具有的能量', category: '概念' },
    // 电学
    { id: 'ohm', name: '欧姆定律', description: '导体中的电流与电压成正比，与电阻成反比', category: '定律' },
    { id: 'current', name: '电流', description: '单位时间内通过导体截面的电荷量，I = Q/t', category: '概念' },
    { id: 'voltage', name: '电压', description: '电路两点间的电位差', category: '概念' },
    { id: 'resistance', name: '电阻', description: '导体对电流的阻碍作用', category: '概念' },
    { id: 'powerlaw', name: 'P = UI', description: '电功率 = 电压 × 电流', category: '公式' },
    { id: 'joule', name: '焦耳定律', description: '电流通过导体产生的热量与电流平方、电阻和时间成正比', category: '定律' },
    { id: 'circuit', name: '电路', description: '电流流通的路径，包括电源、导线、负载', category: '概念' },
    { id: 'series', name: '串联电路', description: '电流依次流过各元件的电路连接方式', category: '概念' },
    { id: 'parallel', name: '并联电路', description: '电流分多路流过各元件的电路连接方式', category: '概念' },
    { id: 'emag', name: '电磁感应', description: '变化的磁场在导体中产生电动势的现象', category: '概念' },
    { id: 'magnetic', name: '磁场', description: '磁体周围对磁极有力的作用的空间', category: '概念' },
  ],
  relations: [
    // --- 力学关联 ---
    { cardA: 'newton1', cardB: 'inertia', type: 'prerequisite', explanation: '牛顿第一定律也称为惯性定律' },
    { cardA: 'newton2', cardB: 'fma', type: 'prerequisite', explanation: 'F=ma 是牛顿第二定律的数学表达' },
    { cardA: 'newton2', cardB: 'force', type: 'causal', explanation: '牛顿第二定律揭示了力是产生加速度的原因' },
    { cardA: 'newton2', cardB: 'accel', type: 'causal', explanation: '加速度与合外力成正比' },
    { cardA: 'newton2', cardB: 'mass', type: 'causal', explanation: '加速度与质量成反比' },
    { cardA: 'fma', cardB: 'force', type: 'application', explanation: 'F=ma 定量描述力与加速度关系' },
    { cardA: 'fma', cardB: 'mass', type: 'application', explanation: 'F=ma 中 m 是物体惯性大小的量度' },
    { cardA: 'fma', cardB: 'accel', type: 'application', explanation: 'F=ma 中 a 与 F 同向' },
    { cardA: 'newton3', cardB: 'force', type: 'causal', explanation: '牛顿第三定律说明力的作用是相互的' },
    { cardA: 'newton1', cardB: 'newton3', type: 'prerequisite', explanation: '牛顿三大定律构成经典力学基础' },
    { cardA: 'newton2', cardB: 'newton3', type: 'prerequisite', explanation: '牛顿三大定律构成经典力学基础' },
    { cardA: 'gravity', cardB: 'gformula', type: 'prerequisite', explanation: 'G=mg 是重力的计算公式' },
    { cardA: 'gravity', cardB: 'mass', type: 'causal', explanation: '重力与物体质量成正比' },
    { cardA: 'gformula', cardB: 'mass', type: 'application', explanation: 'G=mg 中 m 越大 G 越大' },
    { cardA: 'friction', cardB: 'force', type: 'generalization', explanation: '摩擦力是力的常见形式' },
    { cardA: 'friction', cardB: 'velocity', type: 'causal', explanation: '摩擦力阻碍物体的相对运动' },
    { cardA: 'velocity', cardB: 'displacement', type: 'prerequisite', explanation: '速度 = 位移 / 时间' },
    { cardA: 'velocity', cardB: 'accel', type: 'prerequisite', explanation: '加速度是速度的变化率' },
    { cardA: 'momentum', cardB: 'mass', type: 'causal', explanation: '动量与物体质量成正比' },
    { cardA: 'momentum', cardB: 'velocity', type: 'causal', explanation: '动量与物体速度成正比' },
    { cardA: 'energy', cardB: 'work', type: 'prerequisite', explanation: '功是能量转化的量度' },
    { cardA: 'kinetic', cardB: 'velocity', type: 'causal', explanation: '动能与速度的平方成正比' },
    { cardA: 'potential', cardB: 'gravity', type: 'causal', explanation: '重力势能与重力相关' },
    { cardA: 'work', cardB: 'force', type: 'causal', explanation: '功 = 力 × 位移' },
    { cardA: 'work', cardB: 'displacement', type: 'causal', explanation: '功 = 力 × 位移' },
    { cardA: 'power', cardB: 'work', type: 'prerequisite', explanation: '功率是单位时间内的功' },
    { cardA: 'hooke', cardB: 'spring', type: 'prerequisite', explanation: '胡克定律描述弹力与形变量的关系' },
    { cardA: 'hooke', cardB: 'spring', type: 'application', explanation: '胡克定律：F=kx 描述弹力' },
    { cardA: 'pressure', cardB: 'force', type: 'causal', explanation: '压强 = 压力 / 面积' },
    { cardA: 'archimedes', cardB: 'buoyancy', type: 'prerequisite', explanation: '阿基米德原理说明浮力等于排开液体的重力' },
    { cardA: 'buoyancy', cardB: 'density', type: 'causal', explanation: '浮力与液体密度有关' },
    { cardA: 'density', cardB: 'mass', type: 'causal', explanation: '密度 = 质量 / 体积' },
    { cardA: 'equilibrium', cardB: 'force', type: 'generalization', explanation: '二力平衡是力的特例' },
    { cardA: 'freebody', cardB: 'force', type: 'application', explanation: '受力分析是分析力的方法' },

    // --- 电学关联 ---
    { cardA: 'ohm', cardB: 'current', type: 'causal', explanation: '欧姆定律：电流与电压成正比' },
    { cardA: 'ohm', cardB: 'voltage', type: 'causal', explanation: '欧姆定律：电压是产生电流的原因' },
    { cardA: 'ohm', cardB: 'resistance', type: 'causal', explanation: '欧姆定律：电流与电阻成反比' },
    { cardA: 'powerlaw', cardB: 'current', type: 'application', explanation: '电功率与电流成正比' },
    { cardA: 'powerlaw', cardB: 'voltage', type: 'application', explanation: '电功率与电压成正比' },
    { cardA: 'joule', cardB: 'current', type: 'application', explanation: '焦耳定律：热量与电流平方成正比' },
    { cardA: 'joule', cardB: 'resistance', type: 'application', explanation: '焦耳定律：热量与电阻成正比' },
    { cardA: 'circuit', cardB: 'current', type: 'generalization', explanation: '电路是电流的流通路径' },
    { cardA: 'series', cardB: 'circuit', type: 'generalization', explanation: '串联电路是电路的基本连接方式' },
    { cardA: 'parallel', cardB: 'circuit', type: 'generalization', explanation: '并联电路是电路的基本连接方式' },
    { cardA: 'series', cardB: 'parallel', type: 'analogy', explanation: '串联和并联是电路连接的两种基本方式' },
    { cardA: 'emag', cardB: 'magnetic', type: 'causal', explanation: '电磁感应是磁场变化产生的现象' },
    { cardA: 'emag', cardB: 'current', type: 'causal', explanation: '电磁感应可以产生感应电流' },

    // 跨领域关联
    { cardA: 'power', cardB: 'powerlaw', type: 'analogy', explanation: '力学功率与电功率都是能量转化的量度' },
    { cardA: 'energy', cardB: 'joule', type: 'generalization', explanation: '焦耳定律描述的是电能转化为热能的过程' },
    { cardA: 'force', cardB: 'voltage', type: 'analogy', explanation: '力是力学中的"驱动力"，电压是电学中的"驱动力"' },
    { cardA: 'current', cardB: 'velocity', type: 'analogy', explanation: '电流类比于水流速度，都是某种"流动"的快慢' },

    // 三卡关联
    { cardA: 'newton2', cardB: 'force', cardC: 'accel', type: 'causal', explanation: '牛顿第二定律关联力、质量与加速度，三者构成力学核心三角', score: 8 },
    { cardA: 'newton2', cardB: 'force', cardC: 'mass', type: 'application', explanation: 'F=ma 将力、质量、加速度三者定量关联', score: 8 },
    { cardA: 'newton2', cardB: 'accel', cardC: 'mass', type: 'application', explanation: 'F=ma 建立了加速度、力、质量的三者关系', score: 8 },
    { cardA: 'fma', cardB: 'force', cardC: 'mass', type: 'application', explanation: 'F=ma 公式直接表达了力、质量、加速度的定量关系', score: 10 },
    { cardA: 'fma', cardB: 'force', cardC: 'accel', type: 'application', explanation: 'F=ma 公式直接表达了力与加速度的正比关系', score: 10 },
    { cardA: 'fma', cardB: 'mass', cardC: 'accel', type: 'application', explanation: 'F=ma 公式表达了质量与加速度的反比关系', score: 8 },
    { cardA: 'momentum', cardB: 'mass', cardC: 'velocity', type: 'application', explanation: '动量 = 质量 × 速度，三个物理量的经典关系', score: 8 },
    { cardA: 'work', cardB: 'force', cardC: 'displacement', type: 'application', explanation: '功 = 力 × 位移，三个物理量的定量关系', score: 8 },
    { cardA: 'kinetic', cardB: 'mass', cardC: 'velocity', type: 'application', explanation: '动能 = ½mv²，三个物理量的定量关系', score: 8 },
    { cardA: 'gformula', cardB: 'gravity', cardC: 'mass', type: 'application', explanation: 'G=mg 将重力、质量、重力加速度三者关联', score: 6 },
    { cardA: 'potential', cardB: 'gravity', cardC: 'mass', type: 'application', explanation: '重力势能 = mgh，三个物理量的关系', score: 6 },
    { cardA: 'ohm', cardB: 'current', cardC: 'voltage', type: 'causal', explanation: '欧姆定律：电压与电流、电阻形成定量关系', score: 8 },
    { cardA: 'ohm', cardB: 'current', cardC: 'resistance', type: 'causal', explanation: '欧姆定律：电流与电压、电阻形成定量关系', score: 8 },
    { cardA: 'ohm', cardB: 'voltage', cardC: 'resistance', type: 'causal', explanation: '欧姆定律：电压与电流、电阻形成定量关系', score: 8 },
    { cardA: 'powerlaw', cardB: 'current', cardC: 'voltage', type: 'application', explanation: 'P=UI 关联电功率、电流、电压', score: 8 },
    { cardA: 'joule', cardB: 'current', cardC: 'resistance', type: 'application', explanation: '焦耳定律：Q=I²Rt，三者定量关系', score: 8 },
    { cardA: 'circuit', cardB: 'series', cardC: 'parallel', type: 'generalization', explanation: '串联与并联是电路分析的两种基本连接方式', score: 4 },
    { cardA: 'newton1', cardB: 'force', cardC: 'inertia', type: 'causal', explanation: '牛顿第一定律揭示力与惯性的关系', score: 6 },
    { cardA: 'newton3', cardB: 'newton1', cardC: 'newton2', type: 'generalization', explanation: '牛顿三大定律构成经典力学的完整理论体系', score: 10 },
  ],
};

// === 英语主题词汇牌组 ===
const englishDeck: Deck = {
  meta: { name: '高考英语 — 话题词汇', description: '按高考常见话题分类的英语词汇，涵盖环境、科技、教育、健康、社会等主题', author: '系统', version: '1.0' },
  cards: [
    // 环境
    { id: 'env_pollution', name: 'pollution', description: '污染，指有害物质进入环境', category: '环境' },
    { id: 'env_climate', name: 'climate change', description: '气候变化，全球性环境问题', category: '环境' },
    { id: 'env_eco', name: 'eco-friendly', description: '环保的，对环境友好的', category: '环境' },
    { id: 'env_recycle', name: 'recycle', description: '回收利用，循环使用资源', category: '环境' },
    { id: 'env_sustain', name: 'sustainable', description: '可持续的，能长期维持的', category: '环境' },
    { id: 'env_carbon', name: 'carbon emission', description: '碳排放，温室气体排放', category: '环境' },
    { id: 'env_energy', name: 'renewable energy', description: '可再生能源（如太阳能、风能）', category: '环境' },

    // 科技
    { id: 'tech_ai', name: 'artificial intelligence', description: '人工智能，机器模拟人类智能', category: '科技' },
    { id: 'tech_innovate', name: 'innovation', description: '创新，创造新事物或方法', category: '科技' },
    { id: 'tech_digital', name: 'digital', description: '数字化的，使用电子技术的', category: '科技' },
    { id: 'tech_device', name: 'device', description: '设备，装置，电子器械', category: '科技' },
    { id: 'tech_network', name: 'network', description: '网络，互联系统', category: '科技' },
    { id: 'tech_data', name: 'data', description: '数据，信息', category: '科技' },
    { id: 'tech_breakthrough', name: 'breakthrough', description: '突破，重大进展', category: '科技' },

    // 教育
    { id: 'edu_curriculum', name: 'curriculum', description: '课程，学校的教学科目', category: '教育' },
    { id: 'edu_knowledge', name: 'knowledge', description: '知识，通过学习获得的信息', category: '教育' },
    { id: 'edu_academic', name: 'academic', description: '学术的，与学校教育相关的', category: '教育' },
    { id: 'edu_skill', name: 'skill', description: '技能，通过训练获得的能力', category: '教育' },
    { id: 'edu_tuition', name: 'tuition', description: '学费，教育费用', category: '教育' },
    { id: 'edu_scholar', name: 'scholarship', description: '奖学金，资助学生学习的资金', category: '教育' },
    { id: 'edu_graduate', name: 'graduate', description: '毕业生；毕业', category: '教育' },

    // 健康
    { id: 'hlth_nutrition', name: 'nutrition', description: '营养，食物对健康的作用', category: '健康' },
    { id: 'hlth_exercise', name: 'exercise', description: '锻炼，体育活动', category: '健康' },
    { id: 'hlth_mental', name: 'mental health', description: '心理健康，精神福祉', category: '健康' },
    { id: 'hlth_diet', name: 'balanced diet', description: '均衡饮食，各类营养合理搭配', category: '健康' },
    { id: 'hlth_stress', name: 'stress', description: '压力，精神紧张状态', category: '健康' },
    { id: 'hlth_immune', name: 'immune system', description: '免疫系统，身体抵御疾病的机制', category: '健康' },

    // 社会文化
    { id: 'soc_diversity', name: 'diversity', description: '多样性，多元共存', category: '社会' },
    { id: 'soc_volunteer', name: 'volunteer', description: '志愿者；自愿的', category: '社会' },
    { id: 'soc_community', name: 'community', description: '社区，社会群体', category: '社会' },
    { id: 'soc_tradition', name: 'tradition', description: '传统，代代相传的习俗', category: '社会' },
    { id: 'soc_global', name: 'globalization', description: '全球化，世界范围的互联互通', category: '社会' },
    { id: 'soc_charity', name: 'charity', description: '慈善，帮助他人的行为', category: '社会' },

    // 职业
    { id: 'job_career', name: 'career', description: '职业，长期从事的工作', category: '职业' },
    { id: 'job_interview', name: 'interview', description: '面试，求职面谈', category: '职业' },
    { id: 'job_qualify', name: 'qualification', description: '资格，学历或能力证明', category: '职业' },
    { id: 'job_profession', name: 'profession', description: '专业，需要专门训练的职业', category: '职业' },
  ],
  relations: [
    // 环境 — 主题内关联
    { cardA: 'env_pollution', cardB: 'env_carbon', type: 'causal', explanation: '碳排放是导致污染的主要因素之一' },
    { cardA: 'env_pollution', cardB: 'env_climate', type: 'causal', explanation: '污染加剧气候变化' },
    { cardA: 'env_carbon', cardB: 'env_climate', type: 'causal', explanation: '碳排放导致全球气候变化' },
    { cardA: 'env_recycle', cardB: 'env_eco', type: 'application', explanation: '回收利用是环保行为的具体做法' },
    { cardA: 'env_recycle', cardB: 'env_pollution', type: 'causal', explanation: '回收利用可以减少污染' },
    { cardA: 'env_sustain', cardB: 'env_eco', type: 'prerequisite', explanation: '可持续发展是环保的核心理念' },
    { cardA: 'env_energy', cardB: 'env_eco', type: 'application', explanation: '可再生能源是环保的能源方案' },
    { cardA: 'env_energy', cardB: 'env_sustain', type: 'causal', explanation: '可再生能源促进可持续发展' },
    { cardA: 'env_energy', cardB: 'env_carbon', type: 'causal', explanation: '可再生能源可减少碳排放' },
    { cardA: 'env_climate', cardB: 'env_sustain', type: 'generalization', explanation: '应对气候变化需要可持续发展' },

    // 科技 — 主题内关联
    { cardA: 'tech_ai', cardB: 'tech_innovate', type: 'generalization', explanation: '人工智能是创新的重要领域' },
    { cardA: 'tech_ai', cardB: 'tech_digital', type: 'prerequisite', explanation: '人工智能建立在数字技术基础之上' },
    { cardA: 'tech_device', cardB: 'tech_digital', type: 'generalization', explanation: '电子设备是数字技术的载体' },
    { cardA: 'tech_device', cardB: 'tech_network', type: 'application', explanation: '设备通过网络互联' },
    { cardA: 'tech_network', cardB: 'tech_data', type: 'application', explanation: '网络用于传输数据' },
    { cardA: 'tech_ai', cardB: 'tech_data', type: 'causal', explanation: 'AI 依赖大量数据进行学习' },
    { cardA: 'tech_breakthrough', cardB: 'tech_innovate', type: 'prerequisite', explanation: '突破往往源于持续创新' },
    { cardA: 'tech_breakthrough', cardB: 'tech_ai', type: 'generalization', explanation: 'AI 是近年科技的重大突破' },

    // 教育 — 主题内关联
    { cardA: 'edu_curriculum', cardB: 'edu_academic', type: 'prerequisite', explanation: '课程是学术教育的基础' },
    { cardA: 'edu_curriculum', cardB: 'edu_knowledge', type: 'causal', explanation: '课程设计旨在传授知识' },
    { cardA: 'edu_knowledge', cardB: 'edu_skill', type: 'prerequisite', explanation: '知识是技能的基础' },
    { cardA: 'edu_skill', cardB: 'edu_academic', type: 'application', explanation: '技能是在学术环境中的应用能力' },
    { cardA: 'edu_tuition', cardB: 'edu_scholar', type: 'generalization', explanation: '奖学金可以减轻学费负担' },
    { cardA: 'edu_graduate', cardB: 'edu_academic', type: 'generalization', explanation: '毕业是完成学业的标志' },
    { cardA: 'edu_graduate', cardB: 'edu_curriculum', type: 'prerequisite', explanation: '完成课程方可毕业' },

    // 健康 — 主题内关联
    { cardA: 'hlth_nutrition', cardB: 'hlth_diet', type: 'prerequisite', explanation: '营养是均衡饮食的核心内容' },
    { cardA: 'hlth_diet', cardB: 'hlth_exercise', type: 'analogy', explanation: '饮食与锻炼都是保持健康的关键' },
    { cardA: 'hlth_exercise', cardB: 'hlth_mental', type: 'causal', explanation: '体育锻炼有助于改善心理健康' },
    { cardA: 'hlth_stress', cardB: 'hlth_mental', type: 'causal', explanation: '压力直接影响心理健康' },
    { cardA: 'hlth_stress', cardB: 'hlth_exercise', type: 'causal', explanation: '锻炼可以缓解压力' },
    { cardA: 'hlth_immune', cardB: 'hlth_nutrition', type: 'causal', explanation: '营养充足有助于维持免疫系统' },
    { cardA: 'hlth_immune', cardB: 'hlth_exercise', type: 'causal', explanation: '适度锻炼增强免疫力' },

    // 社会 — 主题内关联
    { cardA: 'soc_diversity', cardB: 'soc_community', type: 'prerequisite', explanation: '社区由多样化的成员构成' },
    { cardA: 'soc_diversity', cardB: 'soc_global', type: 'generalization', explanation: '全球化促进了文化多样性' },
    { cardA: 'soc_volunteer', cardB: 'soc_charity', type: 'application', explanation: '志愿者是慈善活动的重要力量' },
    { cardA: 'soc_volunteer', cardB: 'soc_community', type: 'causal', explanation: '志愿者服务社区' },
    { cardA: 'soc_charity', cardB: 'soc_community', type: 'causal', explanation: '慈善促进社区发展' },
    { cardA: 'soc_tradition', cardB: 'soc_community', type: 'prerequisite', explanation: '传统是社区文化的重要组成部分' },
    { cardA: 'soc_tradition', cardB: 'soc_global', type: 'generalization', explanation: '全球化背景下传统面临保护与传承' },

    // 职业 — 主题内关联
    { cardA: 'job_career', cardB: 'job_profession', type: 'prerequisite', explanation: '职业常建立在专业知识基础之上' },
    { cardA: 'job_interview', cardB: 'job_career', type: 'application', explanation: '面试是进入职业生涯的关键一步' },
    { cardA: 'job_qualify', cardB: 'job_interview', type: 'prerequisite', explanation: '资格是获得面试机会的前提' },
    { cardA: 'job_qualify', cardB: 'job_career', type: 'causal', explanation: '资格影响职业发展' },

    // 跨主题关联
    { cardA: 'edu_skill', cardB: 'job_career', type: 'causal', explanation: '教育中的技能培养直接服务职业发展' },
    { cardA: 'edu_skill', cardB: 'job_qualify', type: 'prerequisite', explanation: '技能是获得职业资格的基础' },
    { cardA: 'edu_knowledge', cardB: 'tech_innovate', type: 'causal', explanation: '知识积累推动科技创新' },
    { cardA: 'edu_academic', cardB: 'tech_ai', type: 'application', explanation: '学术研究推动 AI 发展' },
    { cardA: 'tech_innovate', cardB: 'env_energy', type: 'application', explanation: '技术创新推动可再生能源发展' },
    { cardA: 'tech_ai', cardB: 'hlth_mental', type: 'application', explanation: 'AI 技术在心理健康领域有广泛应用' },
    { cardA: 'env_pollution', cardB: 'hlth_immune', type: 'causal', explanation: '环境污染会削弱人体免疫系统' },
    { cardA: 'env_eco', cardB: 'soc_community', type: 'application', explanation: '环保行动需要社区层面的参与' },
    { cardA: 'soc_global', cardB: 'env_climate', type: 'generalization', explanation: '气候变化是全球性社会议题' },
    { cardA: 'soc_volunteer', cardB: 'job_career', type: 'analogy', explanation: '志愿者经历有助于职业发展' },
    { cardA: 'tech_digital', cardB: 'soc_global', type: 'causal', explanation: '数字化推动全球化进程' },
    { cardA: 'edu_scholar', cardB: 'soc_charity', type: 'analogy', explanation: '奖学金和慈善都体现了社会对个人的帮助' },

    // 三卡关联
    { cardA: 'env_pollution', cardB: 'env_carbon', cardC: 'env_climate', type: 'causal', explanation: '碳排放 → 污染 → 气候变化，构成环境问题的因果链', score: 10 },
    { cardA: 'env_recycle', cardB: 'env_eco', cardC: 'env_sustain', type: 'application', explanation: '回收利用 → 环保行动 → 可持续发展，构成环保实践完整路径', score: 8 },
    { cardA: 'tech_ai', cardB: 'tech_digital', cardC: 'tech_data', type: 'prerequisite', explanation: 'AI 建立在数字技术和数据的基础上', score: 8 },
    { cardA: 'edu_curriculum', cardB: 'edu_knowledge', cardC: 'edu_skill', type: 'prerequisite', explanation: '课程 → 知识 → 技能，一条完整的教育链路', score: 8 },
    { cardA: 'hlth_diet', cardB: 'hlth_exercise', cardC: 'hlth_mental', type: 'causal', explanation: '饮食、运动与心理健康三位一体的健康观', score: 8 },
    { cardA: 'soc_volunteer', cardB: 'soc_charity', cardC: 'soc_community', type: 'application', explanation: '志愿者 → 慈善 → 社区，三层递进的社会参与', score: 6 },
    { cardA: 'job_qualify', cardB: 'job_interview', cardC: 'job_career', type: 'prerequisite', explanation: '资格 → 面试 → 职业，求职三步曲', score: 7 },
  ],
};


export async function ensureDefaultDecks(store: FileStore): Promise<void> {
  const existing = store.listJSON('decks');

  if (!existing.includes('初中物理 — 力学')) {
    await store.writeJSON('decks/初中物理 — 力学.json', physicsDeck);
    console.log('  ✓ 已创建默认卡组: 初中物理 — 力学');
  }

  if (!existing.includes('高考英语 — 话题词汇')) {
    await store.writeJSON('decks/高考英语 — 话题词汇.json', englishDeck);
    console.log('  ✓ 已创建默认卡组: 高考英语 — 话题词汇');
  }
}
