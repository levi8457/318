import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

export interface AsrResult {
  text: string;
  language?: string;
  duration?: number;
  confidence?: number;
}

@Injectable()
export class AsrService {
  private provider: string;
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor() {
    this.provider = process.env.ASR_PROVIDER || 'mock';
    this.apiKey = process.env.ASR_API_KEY || '';
    this.apiSecret = process.env.ASR_API_SECRET || '';
    this.baseUrl = process.env.ASR_BASE_URL || 'https://api.deepseek.com';
  }

  async transcribe(audioPath: string): Promise<AsrResult> {
    switch (this.provider) {
      case 'whisper':
        return this.transcribeWithWhisper(audioPath);
      case 'deepseek':
        return this.transcribeWithDeepseek(audioPath);
      case 'mock':
      default:
        return this.mockTranscribe(audioPath);
    }
  }

  private async transcribeWithWhisper(audioPath: string): Promise<AsrResult> {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(audioPath);
    const blob = new Blob([fileBuffer], { type: 'audio/mpeg' });
    formData.append('file', blob, 'audio.mp3');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      text: result.text,
      language: result.language,
      duration: result.duration,
      confidence: result.confidence || 0.9,
    };
  }

  private async transcribeWithDeepseek(audioPath: string): Promise<AsrResult> {
    const fileBuffer = fs.readFileSync(audioPath);
    const base64Audio = fileBuffer.toString('base64');

    const response = await fetch(`${this.baseUrl}/v1/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'whisper',
        file: `data:audio/mpeg;base64,${base64Audio}`,
        response_format: 'verbose_json',
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek ASR error: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      text: result.text,
      language: result.language,
      duration: result.duration,
      confidence: 0.9,
    };
  }

  private async mockTranscribe(audioPath: string): Promise<AsrResult> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockTexts = [
      '咨询师：您好王姐，很高兴见到您！今天来是想了解哪方面的项目呢？客户：你好，我最近感觉脸上皮肤有点松弛，法令纹也越来越明显了，想了解一下抗衰项目。咨询师：太好了，我们这边抗衰项目有好几种呢，热玛吉、超声炮都有，您比较倾向哪种？客户：我朋友推荐说热玛吉不错，但听说挺疼的，我比较怕疼，这个真的有效吗？咨询师：王姐您放心，我们现在用的是舒适化无痛打法，配合表麻，90%的客户都反馈几乎感觉不到疼痛。而且热玛吉的效果是公认的，一次治疗就能维持一到两年呢。客户：那价格怎么样？大概多少钱啊？咨询师：价格方面我们会根据您的面部情况制定个性化方案，有不同的档位可以选择，到时候医生会给您详细说明。客户：好的，我回去和老公商量一下，再决定。咨询师：没问题王姐，这是我的微信，您有任何问题随时可以问我。',
      '咨询师：李婷你好，今天想了解什么项目呢？客户：你好，我一直对自己的鼻子不太满意，想做个隆鼻手术，你们这里有什么方案吗？咨询师：我们这里有假体隆鼻、肋软骨隆鼻、还有玻尿酸填充，您更倾向哪种？客户：我想做假体的，但是有点担心安全问题，会不会有什么风险啊？咨询师：您完全不用担心，我们的医生都是有丰富经验的，假体隆鼻现在技术很成熟了，安全性很高的。客户：那恢复期大概多长时间？我上班请假不太方便。咨询师：一般一周左右就能基本消肿，正常上班没问题的，完全恢复需要一到三个月。客户：好的，我从抖音上看到你们医院的案例，感觉挺好的，朋友也介绍说你们不错。咨询师：感谢信任！那我给您预约个医生面诊，让医生给您设计一下具体方案？客户：好的，明天下午有空吗？咨询师：没问题，明天下午两点我帮您约好。',
    ];

    const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];

    return {
      text: randomText,
      language: 'zh',
      duration: 180,
      confidence: 0.95,
    };
  }
}
