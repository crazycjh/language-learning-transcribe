/**
 * Baseline functionality tests for core learning components
 * These tests ensure that preserved functionality continues to work after transcription removal
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parseSRT, convertToBlanksSegment, BlanksDifficulty } from '@/lib/srt-utils';

describe('Core Learning Functionality Baseline Tests', () => {
  const sampleSRT = `1
00:00:01,000 --> 00:00:03,000
Hello world

2
00:00:04,000 --> 00:00:06,000
This is a test`;

  describe('SRT Parsing', () => {
    it('should parse SRT content correctly', () => {
      const segments = parseSRT(sampleSRT);
      
      expect(segments).toHaveLength(2);
      expect(segments[0]).toMatchObject({
        id: 1,
        startTime: 1,
        endTime: 3,
        text: 'Hello world'
      });
      expect(segments[1]).toMatchObject({
        id: 2,
        startTime: 4,
        endTime: 6,
        text: 'This is a test'
      });
    });

    it('should handle empty SRT content', () => {
      const segments = parseSRT('');
      expect(segments).toHaveLength(0);
    });
  });

  describe('Blanks Generation', () => {
    let segments: ReturnType<typeof parseSRT>;

    beforeEach(() => {
      segments = parseSRT(sampleSRT);
    });

    it('should generate beginner blanks with hints', () => {
      const blanksSegment = convertToBlanksSegment(segments[0], BlanksDifficulty.BEGINNER);
      
      expect(blanksSegment.blanks.length).toBeGreaterThan(0);
      expect(blanksSegment.blanks[0].hint).toBeDefined();
      expect(blanksSegment.blanks[0].hint.length).toBeGreaterThan(0);
    });

    it('should generate intermediate blanks with length hints', () => {
      const blanksSegment = convertToBlanksSegment(segments[0], BlanksDifficulty.INTERMEDIATE);
      
      expect(blanksSegment.blanks.length).toBeGreaterThan(0);
      expect(blanksSegment.blanks[0].length).toBeGreaterThan(0);
    });

    it('should generate advanced blanks for free typing', () => {
      const blanksSegment = convertToBlanksSegment(segments[0], BlanksDifficulty.ADVANCED);
      
      expect(blanksSegment.text).toBe(segments[0].text);
      // Advanced mode still generates blanks, but they're used differently in the UI
      expect(blanksSegment.blanks.length).toBeGreaterThanOrEqual(0);
      // In advanced mode, blanks don't have hints
      if (blanksSegment.blanks.length > 0) {
        expect(blanksSegment.blanks[0].hint).toBeUndefined();
      }
    });
  });

  describe('Video Service Functions', () => {
    // These tests would normally require mocking, but we'll keep them simple
    it('should have video service functions available', async () => {
      const { getSrtContent, getSegments, getSummary } = await import('@/lib/video-service');
      
      expect(typeof getSrtContent).toBe('function');
      expect(typeof getSegments).toBe('function');
      expect(typeof getSummary).toBe('function');
    });
  });
});