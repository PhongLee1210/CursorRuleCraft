import { z } from 'zod';

/**
 * Validation schema for creating cursor rules
 */
export const createCursorRuleSchema = z.object({
  fileName: z
    .string()
    .min(1, 'File name is required')
    .max(100, 'File name must be less than 100 characters')
    .regex(
      /^[a-zA-Z0-9-_\s]+$/,
      'File name can only contain letters, numbers, spaces, hyphens, and underscores'
    )
    .transform((val) => val.trim().toLowerCase().replace(/\s+/g, '-')),

  content: z
    .string()
    .min(1, 'Content is required')
    .max(50000, 'Content must be less than 50,000 characters'),

  selectedFolder: z.enum(['rules', 'command', 'user'], {
    errorMap: () => ({ message: 'Please select a valid folder' }),
  }),

  applyMode: z.enum(['always', 'intelligent', 'specific', 'manual']).optional(),

  globPatterns: z
    .array(z.string().min(1, 'Pattern cannot be empty'))
    .optional()
    .refine(
      (_patterns) => {
        // If applyMode is 'specific', at least one pattern is required
        // This will be checked in the dialog component with additional context
        return true;
      },
      {
        message: 'At least one file pattern is required for specific apply mode',
      }
    ),
});

/**
 * Type for the validation schema
 */
export type CreateCursorRuleFormData = z.infer<typeof createCursorRuleSchema>;

/**
 * Validate individual fields
 */
export const validateFileName = (fileName: string) => {
  try {
    createCursorRuleSchema.shape.fileName.parse(fileName);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Invalid file name';
    }
    return 'Invalid file name';
  }
};

export const validateContent = (content: string) => {
  try {
    createCursorRuleSchema.shape.content.parse(content);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Invalid content';
    }
    return 'Invalid content';
  }
};

export const validateGlobPatterns = (
  patterns: string[],
  applyMode: 'always' | 'intelligent' | 'specific' | 'manual'
) => {
  if (applyMode === 'specific' && patterns.length === 0) {
    return 'At least one file pattern is required for specific apply mode';
  }
  return null;
};

/**
 * Validate the entire form
 */
export const validateCreateRuleForm = (data: {
  fileName: string;
  content: string;
  selectedFolder: 'rules' | 'command' | 'user';
  applyMode?: 'always' | 'intelligent' | 'specific' | 'manual';
  globPatterns?: string[];
}) => {
  const errors: Record<string, string> = {};

  // Validate file name (not required for user rules)
  if (data.selectedFolder !== 'user') {
    const fileNameError = validateFileName(data.fileName);
    if (fileNameError) {
      errors.fileName = fileNameError;
    }
  }

  // Validate content
  const contentError = validateContent(data.content);
  if (contentError) {
    errors.content = contentError;
  }

  // Validate glob patterns if apply mode is 'specific'
  if (data.selectedFolder === 'rules' && data.applyMode === 'specific') {
    const patternsError = validateGlobPatterns(data.globPatterns || [], data.applyMode);
    if (patternsError) {
      errors.globPatterns = patternsError;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
