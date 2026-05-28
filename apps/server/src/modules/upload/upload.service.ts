import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsultationSession } from '../session/entities/session.entity';
import { Tag } from '../customer/entities/customer.entity';
import { AsrService, AsrResult } from './services/asr.service';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(ConsultationSession)
    private sessionRepo: Repository<ConsultationSession>,
    @InjectRepository(Tag)
    private tagRepo: Repository<Tag>,
    private asrService: AsrService,
  ) {}

  async processAudio(file: Express.Multer.File) {
    return {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: `/uploads/audio/${file.filename}`,
      url: `/uploads/audio/${file.filename}`,
    };
  }

  async processAudioAndAnalyze(file: Express.Multer.File, existingTranscript?: string): Promise<{
    audio: {
      filename: string;
      originalName: string;
      size: number;
      path: string;
    };
    asr: AsrResult | null;
    transcript: string;
  }> {
    let transcript = existingTranscript;
    let asrResult: AsrResult | null = null;

    if (!transcript) {
      asrResult = await this.asrService.transcribe(file.path);
      transcript = asrResult.text;
    }

    return {
      audio: {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        path: `/uploads/audio/${file.filename}`,
      },
      asr: asrResult,
      transcript,
    };
  }
}
