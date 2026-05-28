/**
 * LLM 服务封装
 * 统一管理 DeepSeek API 调用
 */

export interface LLMRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class LLMService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  }

  /**
   * 调用 LLM 生成文本（真实实现需要对接 DeepSeek API）
   * 当前使用 Mock 模式
   */
  async generate(request: LLMRequest): Promise<LLMResponse> {
    // Mock 实现：直接返回模拟结果
    console.log('[LLM Mock] 收到请求, prompt 长度:', request.prompt.length);

    return {
      content: this.getMockResponse(request.prompt),
      usage: {
        promptTokens: Math.ceil(request.prompt.length / 4),
        completionTokens: 200,
        totalTokens: Math.ceil(request.prompt.length / 4) + 200,
      },
    };
  }

  /**
   * 流式输出（Mock 实现）
   */
  async *generateStream(request: LLMRequest): AsyncGenerator<string> {
    const mockContent = this.getMockResponse(request.prompt);
    const chunks = mockContent.split('');
    for (const char of chunks) {
      yield char;
      await new Promise((r) => setTimeout(r, 10));
    }
  }

  /**
   * 简单的 Mock 响应，基于 prompt 内容返回不同的模拟结果
   */
  private getMockResponse(prompt: string): string {
    if (prompt.includes('跟进策略')) {
      return `【客户意向分析】
客户对面部抗衰项目有明确意向，预算充足但担心疼痛感。决策风格偏向理性，需要看到真实效果证据。

【卡点应对方案】
1. 疼痛顾虑：我院采用舒适化无痛打法，配合表麻，90%客户反馈几乎无痛感
2. 效果信任：提供我院真实案例对比照片，突出自然效果
3. 价格考量：强调性价比和长期效果，对比其他机构的隐性费用

【推荐跟进话术】
1. "关于您担心的疼痛问题，我们采用的舒适化技术已经服务了上千位客户，大家都说比想象中轻松很多"
2. "刚好这个月有周年庆活动，体验价非常划算，我帮您预留一个名额？"
3. "我整理了几个和您情况类似的客户案例，效果都很自然，发给您参考一下"

【最佳跟进时间】
建议面诊后24小时内上午10:00-11:00通过微信联系

【下一步行动】
1. 发送3个怕疼客户成功案例
2. 邀请客户预约免费面部检测
3. 推送本月热玛吉优惠活动信息
4. 预约到院时间`;
    }

    if (prompt.includes('话术')) {
      return '您好，关于您之前咨询的面部抗衰项目，我院现在采用的都是最新一代设备，效果和舒适度都得到了很大提升。很多客户反馈做一次就能看到明显改善，而且过程完全不疼。建议您可以先到院做一个免费的面部检测，我会根据您的具体情况为您定制个性化方案。';
    }

    if (prompt.includes('关怀')) {
      return '姐您好，今天是您做完项目的第7天，胶原蛋白正在加速重组，记得注意防晒和补水哦。如果有任何不适或者疑问随时联系我，祝您越来越美！';
    }

    return '这是 AI 生成的响应内容。';
  }
}

/** 单例 */
export const llmService = new LLMService();
