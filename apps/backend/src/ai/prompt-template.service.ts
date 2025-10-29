import { readFileSync } from 'fs';
import { join } from 'path';

import { Injectable } from '@nestjs/common';

/**
 * Simple template engine service for handling {{variable}} replacements
 */
@Injectable()
export class PromptTemplateService {
  private promptsPath: string;

  constructor() {
    // Use process.cwd() to get project root, then navigate to prompts directory
    // This works reliably in both development and production builds
    this.promptsPath = join(process.cwd(), 'apps', 'backend', 'src', 'ai', 'prompts');
  }

  /**
   * Load a prompt template from a markdown file
   */
  loadTemplate(filename: string): string {
    try {
      const filePath = join(this.promptsPath, `${filename}.md`);
      return readFileSync(filePath, 'utf-8');
    } catch {
      throw new Error(`Failed to load prompt template: ${filename}.md`);
    }
  }

  /**
   * Replace template variables in the format {{variable}} with provided values
   */
  render(template: string, variables: Record<string, string> = {}): string {
    let result = template;

    // Replace all {{variable}} occurrences with their values
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value || '');
    }

    return result;
  }

  /**
   * Load and render a prompt template in one call
   */
  renderTemplate(filename: string, variables: Record<string, string> = {}): string {
    const template = this.loadTemplate(filename);
    return this.render(template, variables);
  }
}
