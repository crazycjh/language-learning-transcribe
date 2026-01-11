/**
 * Property-based tests for transcription removal validation
 * Feature: transcription-removal
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

describe('Transcription Removal Property Tests', () => {
  
  it('Property 1: No transcription-related UI components should exist', () => {
    fc.assert(fc.property(fc.constant(true), () => {
      // Check that videotranscript directory doesn't exist
      const appDir = join(process.cwd(), 'app');
      const dirs = readdirSync(appDir);
      expect(dirs).not.toContain('videotranscript');
      
      // Check that no transcription components exist
      const componentsDir = join(process.cwd(), 'components');
      const componentFiles = readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
      
      const transcriptionComponents = [
        'TranscriptSplitter.tsx',
        'TranscriptDisplay.tsx',
        'YoutubeTranscript.tsx',
        'AudioFileTranscript.tsx'
      ];
      
      transcriptionComponents.forEach(component => {
        expect(componentFiles).not.toContain(component);
      });
      
      return true;
    }), { numRuns: 1 });
  });

  it('Property 2: No transcription-related API endpoints should exist', () => {
    fc.assert(fc.property(fc.constant(true), () => {
      const apiDir = join(process.cwd(), 'app', 'api');
      const dirs = readdirSync(apiDir);
      
      // Check that transcription-related API directories don't exist
      expect(dirs).not.toContain('openai');
      expect(dirs).not.toContain('sentence-split');
      
      return true;
    }), { numRuns: 1 });
  });

  it('Property 3: Core learning functionality should be preserved', () => {
    fc.assert(fc.property(fc.constant(true), () => {
      const componentsDir = join(process.cwd(), 'components');
      const componentFiles = readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
      
      // Check that core learning components still exist
      const coreComponents = [
        'SrtTranscriptViewer.tsx',
        'BlanksFillPractice.tsx',
        'YouTubePlayer.tsx',
        'VideoSummary.tsx'
      ];
      
      coreComponents.forEach(component => {
        expect(componentFiles).toContain(component);
      });
      
      // Check that core API endpoints exist
      const apiDir = join(process.cwd(), 'app', 'api');
      const dirs = readdirSync(apiDir);
      expect(dirs).toContain('srt');
      expect(dirs).toContain('video');
      
      return true;
    }), { numRuns: 1 });
  });

  it('Property 4: No transcription-only dependencies should remain', () => {
    fc.assert(fc.property(fc.constant(true), () => {
      const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Check that transcription-only dependencies are removed
      expect(dependencies).not.toHaveProperty('socket.io-client');
      expect(dependencies).not.toHaveProperty('openai');
      expect(dependencies).not.toHaveProperty('axios');
      
      // Check that core dependencies are preserved
      expect(dependencies).toHaveProperty('next');
      expect(dependencies).toHaveProperty('react');
      expect(dependencies).toHaveProperty('@tanstack/react-query');
      
      return true;
    }), { numRuns: 1 });
  });

  it('Property 5: No transcription references in code files', () => {
    fc.assert(fc.property(fc.constant(true), () => {
      const searchTranscriptionRefs = (dir: string): string[] => {
        const files: string[] = [];
        const items = readdirSync(dir);
        
        for (const item of items) {
          const fullPath = join(dir, item);
          const stat = statSync(fullPath);
          
          if (stat.isDirectory()) {
            // Skip certain directories
            if (['node_modules', '.next', '.git', '__tests__', 'docs', '.kiro'].includes(item)) {
              continue;
            }
            files.push(...searchTranscriptionRefs(fullPath));
          } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
            try {
              const content = readFileSync(fullPath, 'utf-8');
              const transcriptionTerms = [
                'trackTranscriptionStart',
                'trackTranscriptionComplete',
                'socketManager',
                'TranscriptSplitter',
                'TranscriptDisplay'
              ];
              
              for (const term of transcriptionTerms) {
                if (content.includes(term)) {
                  files.push(`${fullPath}: contains ${term}`);
                }
              }
            } catch (error) {
              // Skip files that can't be read
            }
          }
        }
        return files;
      };
      
      const transcriptionRefs = searchTranscriptionRefs(process.cwd());
      expect(transcriptionRefs).toHaveLength(0);
      
      return true;
    }), { numRuns: 1 });
  });

  it('Property 6: Analytics should only contain learning-related functions', () => {
    fc.assert(fc.property(fc.constant(true), () => {
      const analyticsPath = join(process.cwd(), 'lib', 'analytics.ts');
      const content = readFileSync(analyticsPath, 'utf-8');
      
      // Check that transcription analytics functions are removed
      expect(content).not.toContain('trackTranscriptionStart');
      expect(content).not.toContain('trackTranscriptionComplete');
      
      // Check that learning analytics functions are preserved
      expect(content).toContain('trackVideoPlay');
      expect(content).toContain('trackPracticeStart');
      expect(content).toContain('trackPracticeComplete');
      expect(content).toContain('trackLanguageSwitch');
      
      return true;
    }), { numRuns: 1 });
  });

});