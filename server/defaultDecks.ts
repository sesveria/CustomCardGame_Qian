import { FileStore } from './FileStore.js';
import type { Deck } from '../shared/protocol.js';

const sampleDeck: Deck = {
  meta: { name: '初中物理 — 力学', description: '覆盖牛顿定律、力、运动等核心概念的关系', author: '系统', version: '1.0' },
  cards: [
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
    { id: 'charles', name: '阿基米德原理', description: '浸在液体中的物体受到的浮力等于排开液体的重力', category: '定律' },
    { id: 'buoyancy', name: '浮力', description: '液体对浸在其中物体的向上托力', category: '概念' },
    { id: 'density', name: '密度', description: '单位体积内物质的质量，ρ = m/V', category: '概念' },
    { id: 'equilibrium', name: '二力平衡', description: '两个力大小相等、方向相反、作用在同一直线上', category: '概念' },
    { id: 'freebody', name: '受力分析', description: '分析物体受到的所有外力', category: '方法' },
  ],
  relations: [
    { cardA: 'newton1', cardB: 'inertia', type: 'generalization', explanation: '牛顿第一定律又称惯性定律' },
    { cardA: 'newton2', cardB: 'fma', type: 'application', explanation: 'F=ma 是牛顿第二定律的数学表达式' },
    { cardA: 'newton2', cardB: 'force', type: 'causal', explanation: '牛顿第二定律定量描述了力与运动的关系' },
    { cardA: 'newton2', cardB: 'accel', type: 'causal', explanation: '牛顿第二定律指出力是产生加速度的原因' },
    { cardA: 'newton2', cardB: 'mass', type: 'application', explanation: '牛顿第二定律建立了力、质量、加速度的定量关系' },
    { cardA: 'force', cardB: 'accel', type: 'causal', explanation: '力是产生加速度的原因' },
    { cardA: 'mass', cardB: 'inertia', type: 'analogy', explanation: '质量越大，惯性越大——质量是惯性的量度' },
    { cardA: 'newton3', cardB: 'force', type: 'application', explanation: '牛顿第三定律描述了力的相互作用本质' },
    { cardA: 'gravity', cardB: 'gformula', type: 'application', explanation: 'G=mg 是重力大小的计算公式' },
    { cardA: 'gravity', cardB: 'force', type: 'generalization', explanation: '重力是一种特殊的力' },
    { cardA: 'gravity', cardB: 'mass', type: 'application', explanation: '物体重力与质量成正比' },
    { cardA: 'friction', cardB: 'force', type: 'generalization', explanation: '摩擦力是一种力' },
    { cardA: 'friction', cardB: 'newton1', type: 'prerequisite', explanation: '理解摩擦力需要先掌握牛顿第一定律' },
    { cardA: 'velocity', cardB: 'displacement', type: 'prerequisite', explanation: '速度的定义依赖于位移的概念' },
    { cardA: 'momentum', cardB: 'mass', type: 'application', explanation: '动量 = 质量 × 速度，质量是动量的组成部分' },
    { cardA: 'momentum', cardB: 'velocity', type: 'application', explanation: '动量 = 质量 × 速度，速度是动量的组成部分' },
    { cardA: 'energy', cardB: 'work', type: 'prerequisite', explanation: '功是能量转化的量度' },
    { cardA: 'work', cardB: 'force', type: 'application', explanation: '功 = 力 × 位移，力是做功的主体' },
    { cardA: 'work', cardB: 'displacement', type: 'application', explanation: '功 = 力 × 位移，必须有位移才能做功' },
    { cardA: 'hooke', cardB: 'spring', type: 'application', explanation: '胡克定律描述了弹力的变化规律' },
    { cardA: 'spring', cardB: 'force', type: 'generalization', explanation: '弹力是一种力' },
    { cardA: 'pressure', cardB: 'force', type: 'application', explanation: '压强 = 力 / 面积，力是压强的决定因素之一' },
    { cardA: 'charles', cardB: 'buoyancy', type: 'prerequisite', explanation: '阿基米德原理揭示了浮力的本质' },
    { cardA: 'buoyancy', cardB: 'density', type: 'causal', explanation: '物体密度与液体密度的关系决定浮沉' },
    { cardA: 'density', cardB: 'mass', type: 'application', explanation: '密度 = 质量 / 体积，质量是密度的决定因素之一' },
    { cardA: 'equilibrium', cardB: 'newton1', type: 'application', explanation: '二力平衡是牛顿第一定律的具体体现' },
    { cardA: 'freebody', cardB: 'force', type: 'prerequisite', explanation: '受力分析以力的概念为基础' },
    { cardA: 'freebody', cardB: 'equilibrium', type: 'application', explanation: '受力分析常用于判断二力平衡状态' },
    { cardA: 'freebody', cardB: 'friction', type: 'application', explanation: '受力分析时摩擦力是常见考虑的力之一' },
    { cardA: 'newton1', cardB: 'force', type: 'causal', explanation: '牛顿第一定律说明了力不是维持运动的原因' },
    { cardA: 'accel', cardB: 'velocity', type: 'prerequisite', explanation: '加速度是速度的变化率' },
    { cardA: 'energy', cardB: 'mass', type: 'application', explanation: 'E=mc² 揭示了质量与能量之间的关系' },
  ],
};

export async function ensureDefaultDecks(store: FileStore): Promise<void> {
  const existing = store.listJSON('decks');
  if (existing.length === 0) {
    await store.writeJSON('decks/初中物理 — 力学.json', sampleDeck);
    console.log('  ✓ 已创建默认卡组: 初中物理 — 力学');
  }
}
