/**
 * LLM 服务封装
 * 统一管理 DeepSeek API 调用
 * 支持真实 API 调用 + mock 降级
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
  isMock?: boolean;
}

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekChoice {
  message: { content: string };
  finish_reason: string;
}

interface DeepSeekResponse {
  choices: DeepSeekChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class LLMService {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    this.timeout = 30000;
    this.maxRetries = 3;
  }

  /** 是否有真实 API Key */
  private get isRealMode(): boolean {
    return !!this.apiKey && this.apiKey !== 'your_api_key' && this.apiKey !== '';
  }

  /**
   * 调用 LLM 生成文本
   * 有 API Key 时调用真实 DeepSeek API，否则降级为 mock
   */
  async generate(request: LLMRequest): Promise<LLMResponse> {
    if (!this.isRealMode) {
      console.log('[LLM Mock] 未配置 API Key，使用 mock 模式');
      return this.generateMock(request);
    }

    return this.generateWithRetry(request);
  }

  /**
   * 带重试的真实 API 调用
   */
  private async generateWithRetry(request: LLMRequest): Promise<LLMResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[LLM] 调用 DeepSeek API (第${attempt}次), prompt 长度: ${request.prompt.length}`);
        return await this.callDeepSeekAPI(request);
      } catch (error: any) {
        lastError = error;
        const errorMsg = error.message || '未知错误';
        console.error(`[LLM] 第${attempt}次调用失败: ${errorMsg}`);

        // 超时或限流时等待后重试
        if (attempt < this.maxRetries) {
          const waitMs = Math.pow(2, attempt) * 1000;
          console.log(`[LLM] ${waitMs}ms 后重试...`);
          await new Promise((r) => setTimeout(r, waitMs));
        }
      }
    }

    // 所有重试都失败，降级为 mock
    console.warn('[LLM] 所有重试失败，降级为 mock 模式');
    const mockResponse = this.generateMock(request);
    mockResponse.isMock = true;
    return mockResponse;
  }

  /**
   * 调用 DeepSeek API
   */
  private async callDeepSeekAPI(request: LLMRequest): Promise<LLMResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const messages: DeepSeekMessage[] = [
        { role: 'user', content: request.prompt },
      ];

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          max_tokens: request.maxTokens || 2048,
          temperature: request.temperature ?? 0.7,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API 错误 (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as DeepSeekResponse;

      return {
        content: data.choices[0]?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 流式输出（真实 API 支持）
   */
  async *generateStream(request: LLMRequest): AsyncGenerator<string> {
    if (!this.isRealMode) {
      const mockContent = this.getMockResponse(request.prompt);
      const chunks = mockContent.split('');
      for (const char of chunks) {
        yield char;
        await new Promise((r) => setTimeout(r, 10));
      }
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: request.prompt }],
          max_tokens: request.maxTokens || 2048,
          temperature: request.temperature ?? 0.7,
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`DeepSeek API 错误: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

        for (const line of lines) {
          const data = line.replace('data: ', '').trim();
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // 忽略解析错误
          }
        }
      }
    } catch (error: any) {
      console.error('[LLM Stream] 流式调用失败:', error.message);
      // 降级为 mock
      const mockContent = this.getMockResponse(request.prompt);
      for (const char of mockContent) {
        yield char;
      }
    }
  }

  /**
   * Mock 模式生成
   */
  private generateMock(request: LLMRequest): LLMResponse {
    console.log('[LLM Mock] 收到请求, prompt 长度:', request.prompt.length);
    return {
      content: this.getMockResponse(request.prompt),
      usage: {
        promptTokens: Math.ceil(request.prompt.length / 4),
        completionTokens: 200,
        totalTokens: Math.ceil(request.prompt.length / 4) + 200,
      },
      isMock: true,
    };
  }

  /**
   * Mock 响应，基于 prompt 内容返回不同的模拟结果
   */
  private getMockResponse(prompt: string): string {
    if (prompt.includes('跟进策略') || prompt.includes('follow_up')) {
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
3. 推送本月优惠活动信息
4. 预约到院时间`;
    }

    if (prompt.includes('话术') || prompt.includes('script')) {
      return '您好，关于您之前咨询的面部抗衰项目，我院现在采用的都是最新一代设备，效果和舒适度都得到了很大提升。很多客户反馈做一次就能看到明显改善，而且过程完全不疼。建议您可以先到院做一个免费的面部检测，我会根据您的具体情况为您定制个性化方案。';
    }

    if (prompt.includes('关怀') || prompt.includes('care')) {
      return '姐您好，今天是您做完项目的第7天，胶原蛋白正在加速重组，记得注意防晒和补水哦。如果有任何不适或者疑问随时联系我，祝您越来越美！';
    }

    if (prompt.includes('分析') || prompt.includes('analyze') || prompt.includes('摘要')) {
      return `【面诊摘要】
客户到院咨询面部抗衰项目，主要诉求是改善面部松弛和法令纹。客户对热玛吉项目有一定了解，但对疼痛感有顾虑。

【核心诉求】
1. 改善面部松弛和法令纹
2. 希望效果自然，不要有"假脸感"
3. 担心治疗过程中的疼痛感

【客户卡点】
- 疼痛顾虑：客户多次询问"疼不疼"，表示非常怕疼
- 价格敏感：预算在2-3万，对比了多家机构价格
- 信任度：需要看到真实案例才愿意尝试

【关键决策人】
客户本人，但提到需要和老公商量

【建议跟进策略】
1. 24小时内发送3个怕疼客户成功案例
2. 介绍舒适化无痛技术
3. 推送本月热玛吉优惠活动
4. 邀请到院免费体验`;
    }

    return '这是 AI 生成的响应内容。';
  }
}

/** 单例 */
export const llmService = new LLMService();
