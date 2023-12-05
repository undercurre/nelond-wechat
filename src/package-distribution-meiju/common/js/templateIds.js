//设备长期订阅modelId 长期订阅模板id 一次性订阅模板id 维护文件 需要调用新增的modelid 和templateid 请在这里新增维护引用

//设备长期订阅modelID
export let modelIds = {
  1: 'RJf9-0QwY1z7vPG8dZfOVA', //生活电器-干衣/鞋机
  2: 'HuKvfwUhJVvxg17suXFqoQ', //生活电器-洗衣机
  3: 'lOaz2Si5l9qhA05kKYkCVA', //生活电器-扫地机器人 型号M7 Pro 净菌扫拖
  4: 'QeqJ7V9ubtkEHeppl8OKPg', //厨房电器-净水机
  5: 'R27v0hjBcU9jOIq52ymN5Q', //厨房电器-净饮机
  6: '7gUOH0R5iVLybi-JCjbb6Q', //厨房电器-饮水机
  7: 'eZpF9koqmIl65rNVTpNjmQ', //厨房电器-茶吧机
  8: '2RWl19wUzaz1N4-vazFNcg', //厨房电器-管线机
  9: 'CyW-aUA8wCznryJDnFQ8Ig', //波轮洗衣机
  10: 'LYDTYm027TtpVBRX7vWtDg', //冰箱
  11: 'flu0BqiKL5EPaA2rcO3NAQ', //环境电器-空调
  12: 'LV9TrLj4Z4Ris_LXew3OdA', //复式洗衣机
  13: 'jKZ0JAdG9B2ML_q_AXhQVw', //抽油烟机
  14: 'GjxBD3NmsC94IVkHrMGfzg', //集成灶
  15: 'OQp7pB2glL1ljP6EQ61lJw', //灶具
  16: 'A28rjML6dHwXaJEYG2f3kw', //洗碗机
  17: 'xBbP98b1o1Oc6guscc2kWg', //燃热
  18: 'YIpslobiUDUI3nAAUo4s7w', //电热
}

//设备长期订阅模板id
export let templateIds = {
  1: ['zMpFA2a3ofzzdn-GZw7F-RlKp4LU8dZlwWjSQC1RYCg', '干衣完成'],
  2: ['coooHLjn9BvIFfB173U4G_BRkC0Vruv1qXiNKG469CY', '干衣机故障'],
  3: ['HC2vm_EESJ37f84pfNzjCxh1KeZb43u4o4MjrHUfE0I', '洗衣完成'],
  4: ['nHVKqGKMI1RWKMcPt19682NlT9jXAw_b9Hb7EOB-oCQ', '洗衣机故障'],
  5: ['PRtqMxWCAgYFsaibbZPxfiDojHQJqKQdvvdQyJvrV20', '洗衣机清洁提醒'],
  6: ['S9x1jfMzQXhW-8bL9H3fJvJyzvMgsdiF2qlW_zwE-v0', '扫地机器人电量不足'],
  7: ['IRn0X6Q9I4M9YW1H6oW0aqJk0QuI0_Bv0cncRvK7n20', '扫地机器人故障提醒'],
  8: ['o5ojTzIGdkNgSbP3z1LzR9sKSOudPHaW1ms1_5P3ffY', '洗衣液余量不足提醒'],
  9: ['YlbiOq0yz4AvkvpBb5H3BfadngDkBKG9ZAIzMcbys4M', '净水机故障提醒'],
  10: ['5oBIM41ccjGiKPhOJYz_eZjPkq7pwsmkmq_Zeyorfzs', '净饮机故障提醒'],
  11: ['uiZ_JHm3C9tJem2Xzg86lWxPPy3NHWUZ_mGdPU9sHNk', '净饮机滤芯更换提醒'],
  12: ['-Sh1ZbDMvFfHllg-4ZT6oFq9uqEqHIs6sYbmM9sG8qY', '管线机故障提醒'],
  13: ['6HbnRLez_u3NPZ34viofn5fDcMFjHAZ8LPT8ZjdX7Zc', '茶吧机故障提醒'],
  14: ['27xBVX62yopmJCtvoTYqW9rWg8ReqeraEoGFbPhBOCA', '饮水机故障提醒'],
  15: ['zTdr70su2-M_cu0WUbj31dPhAARftMpuMqX_c5SuIKM', '饮水机滤芯更换提醒'],
  16: ['XVS8MnMG79rbjeWi2FjAoGt05BKhwpZIxS_wKz6djJs', '冰箱故障提醒'],
  17: ['EccXPYPiXoNaq8UcMT93T7UPjd_cCfvR23ErimPinRA', '冰箱关门提醒'],
  18: ['kpjirvOR1vXCjUTofg_UnO4N4L-lqcjhZ-2Fw43YHwU', '空调故障提醒'],
  19: ['XHRM7zB_K1zB3ic6HP5N-9JLk69l2X0qoIb8kcjwR7M', '儿童踢被子提醒'],
  20: ['HMoUPWeZ1xr5pf8WJR0Ypq3umc5vsD8Z-9SdAfSVn9E', '空调清洁提醒'],
  21: ['PpXTCSVCBXZMzMNAzPbveOxAP7LJ4Zt1VothnO5y3rI', '空调关机提醒'],
  22: ['0FwkK8C8_L0NI_et-S9u8TGPoMFe1YHwHZGhNLehJe8', '洗衣机耗材提醒'],
  23: ['BjfB4hCvhA0NDj4YbQ1Rr9AyVTMTOMNuLslQqdMlszU', '净水机滤芯更换提醒'],
  24: ['TFaO_mR5VW4CxeosMMAf35uyU2f5nHWkGOMgGZCYn-M', '抽油烟机故障提醒'],
  25: ['AZkHg-6zqjI119hOFDqT_sxmWrIW6QoOnth6C-Z_k3k', '集成灶故障提醒'],
  26: ['WlgLxadJkC1wz_FVvbh1DtwBbRCif_Onf2wNeCaRfz4', '洗碗机耗材提醒'],
  27: ['hKdZeDUFcssR5-7tLIMCo8p5BMgt6bp84BwRPwfO2Pw', '消毒柜故障提醒'],
  28: ['e_cjRp7urLMcQczMUzfBjDxDqcOhRvdzD__fdYnpr9Q', '洗碗机烘干提醒'],
  29: ['2mlLiKFBB1pgj_ZnZOgCYQPEUUuqQuK05-Y7tYwBCcA', '热水器零冷水已预热完成，现在可以用水了'],
  30: ['A4hbyCWmPp8DU2RDpIftp99y64PuuppLrGiPcjTuEQk', '热水器加热完成，现在可以用水了'],
  31: ['MmwaT_b3dmaiSk8SJpJEvAdhFDH4ZkxUlL_cqjEWXYA', '热水器滤芯即将到期，建议立即更换'],
  32: ['V4MgtWe7CpBCLo5Xf9zGnkbnkEtb0KOSahOE-2jWd_s', '衣物忘取提醒'],
}

//长期订阅故障模板名字 用于从微信服务信息进入小程序，判断是否是故障信息，跳转故障信息页
export let faultTemplate = [
  templateIds[2][1],
  templateIds[4][1],
  templateIds[7][1],
  templateIds[9][1],
  templateIds[10][1],
  templateIds[12][1],
  templateIds[13][1],
  templateIds[14][1],
  templateIds[16][1],
  templateIds[18][1],
]

//跳转洗衣机清洁剂购买页面的模板名字集合
export let jumpCleanBuy = [templateIds[5][1], templateIds[8][1], templateIds[22][1]]

//一次性订阅模板id
export let disposableInfo = {
  1: ['SdJF1miD67oxrzgeAcUYvoWVxT7Q-7_g3tm-ndMPdfQ', '设备状态通知'],
}
