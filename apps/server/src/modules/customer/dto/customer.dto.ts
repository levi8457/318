import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: '王姐' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '13900139000' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: '线上推广' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['active', 'inactive', 'lost'])
  status?: 'active' | 'inactive' | 'lost';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['high', 'medium', 'low'])
  budgetSensitivity?: 'high' | 'medium' | 'low';
}

export class AddTagDto {
  @ApiProperty({ example: '项目意向' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: '热玛吉' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class AddPreferenceDto {
  @ApiProperty({ example: '饮食偏好' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: '喜欢喝温水' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['normal', 'important', 'critical'])
  importance?: 'normal' | 'important' | 'critical';
}

export class AddProjectDto {
  @ApiProperty({ example: '热玛吉面部抗衰' })
  @IsString()
  @IsNotEmpty()
  projectName: string;

  @ApiPropertyOptional({ example: '抗衰' })
  @IsOptional()
  @IsString()
  projectType?: string;

  @ApiProperty({ example: '2026-05-25T10:00:00Z' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['planned', 'in_progress', 'completed', 'follow_up'])
  status?: 'planned' | 'in_progress' | 'completed' | 'follow_up';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
