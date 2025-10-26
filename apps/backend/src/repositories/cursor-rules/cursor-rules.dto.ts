import type { RuleType, ApplyMode } from '@cursorrulecraft/shared-types';
import { RULE_TYPES } from '@cursorrulecraft/shared-types';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRuleDto {
  @IsNotEmpty({ message: 'File name is required' })
  @IsString()
  @MinLength(1, { message: 'File name must not be empty' })
  @MaxLength(100, { message: 'File name must be less than 100 characters' })
  @Matches(/^[a-zA-Z0-9-_\s]+$/, {
    message:
      'File name can only contain letters, numbers, spaces, hyphens, and underscores (no dots - extension is added automatically)',
  })
  file_name!: string;

  @IsNotEmpty({ message: 'Content is required' })
  @IsString()
  @MinLength(1, { message: 'Content must not be empty' })
  @MaxLength(50000, { message: 'Content must be less than 50,000 characters' })
  content!: string;

  @IsNotEmpty({ message: 'Rule type is required' })
  @IsEnum(RULE_TYPES, { message: 'Invalid rule type' })
  type!: RuleType;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  source_message_id?: string;

  @IsOptional()
  @IsEnum(['always', 'intelligent', 'specific', 'manual'], {
    message: 'Apply mode must be one of: always, intelligent, specific, manual',
  })
  apply_mode?: ApplyMode;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Glob pattern must be less than 500 characters' })
  glob_pattern?: string;
}

/**
 * DTO for updating a cursor rule
 */
export class UpdateRuleDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'File name must not be empty' })
  @MaxLength(100, { message: 'File name must be less than 100 characters' })
  @Matches(/^[a-zA-Z0-9-_\s]+$/, {
    message:
      'File name can only contain letters, numbers, spaces, hyphens, and underscores (no dots - extension is added automatically)',
  })
  file_name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Content must not be empty' })
  @MaxLength(50000, { message: 'Content must be less than 50,000 characters' })
  content?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
