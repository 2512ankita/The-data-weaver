import { describe, it, expect, beforeEach } from 'vitest';
import { MCPConfigParser } from '../src/MCPConfigParser.js';

describe('MCPConfigParser', () => {
  let parser;

  beforeEach(() => {
    parser = new MCPConfigParser('/.kiro');
  });

  it('should create an instance with the correct config path', () => {
    expect(parser.configPath).toBe('/.kiro');
    expect(parser.config).toBeNull();
  });

  it('should throw error when accessing data source before loading config', () => {
    expect(() => parser.getDataSource('airQuality')).toThrow('Configuration not loaded');
  });

  it('should throw error when getting data source names before loading config', () => {
    expect(() => parser.getDataSourceNames()).toThrow('Configuration not loaded');
  });

  it('should return null for config before loading', () => {
    expect(parser.getConfig()).toBeNull();
  });

  describe('removeComments', () => {
    it('should remove single-line comments', () => {
      const text = '{\n  "key": "value" // comment\n}';
      const cleaned = parser.removeComments(text);
      expect(cleaned).not.toContain('// comment');
    });

    it('should remove multi-line comments', () => {
      const text = '{\n  /* multi\n  line\n  comment */\n  "key": "value"\n}';
      const cleaned = parser.removeComments(text);
      expect(cleaned).not.toContain('/* multi');
    });
  });

  describe('validateDataSource', () => {
    beforeEach(() => {
      parser.config = { dataSources: {} };
    });

    it('should throw error for missing required fields', () => {
      const invalidSource = {
        name: 'Test Source'
        // missing endpoint, method, transformation
      };
      
      expect(() => parser.validateDataSource('test', invalidSource))
        .toThrow("missing required field: endpoint");
    });

    it('should throw error for invalid HTTP method', () => {
      const invalidSource = {
        name: 'Test Source',
        endpoint: 'https://api.example.com',
        method: 'INVALID',
        transformation: {
          timestampField: 'ts',
          valueField: 'val'
        }
      };
      
      expect(() => parser.validateDataSource('test', invalidSource))
        .toThrow('has invalid method');
    });

    it('should throw error for missing transformation fields', () => {
      const invalidSource = {
        name: 'Test Source',
        endpoint: 'https://api.example.com',
        method: 'GET',
        transformation: {
          timestampField: 'ts'
          // missing valueField
        }
      };
      
      expect(() => parser.validateDataSource('test', invalidSource))
        .toThrow('transformation missing required field: valueField');
    });

    it('should throw error for invalid rate limit strategy', () => {
      const invalidSource = {
        name: 'Test Source',
        endpoint: 'https://api.example.com',
        method: 'GET',
        transformation: {
          timestampField: 'ts',
          valueField: 'val'
        },
        rateLimit: {
          requestsPerMinute: 60,
          strategy: 'invalid'
        }
      };
      
      expect(() => parser.validateDataSource('test', invalidSource))
        .toThrow('has invalid strategy');
    });

    it('should validate a correct data source without errors', () => {
      const validSource = {
        name: 'Test Source',
        endpoint: 'https://api.example.com',
        method: 'GET',
        transformation: {
          timestampField: 'ts',
          valueField: 'val'
        },
        authentication: {
          type: 'query_param'
        },
        rateLimit: {
          requestsPerMinute: 60,
          strategy: 'throttle'
        }
      };
      
      expect(() => parser.validateDataSource('test', validSource)).not.toThrow();
    });
  });

  describe('validateConfig', () => {
    it('should throw error when no config is loaded', () => {
      parser.config = null;
      expect(() => parser.validateConfig()).toThrow('No configuration loaded');
    });

    it('should throw error for missing mcpVersion', () => {
      parser.config = {
        projectName: 'test',
        dataSources: {}
      };
      expect(() => parser.validateConfig()).toThrow('Missing required field: mcpVersion');
    });

    it('should throw error for missing projectName', () => {
      parser.config = {
        mcpVersion: '1.0',
        dataSources: {}
      };
      expect(() => parser.validateConfig()).toThrow('Missing required field: projectName');
    });

    it('should throw error for missing dataSources', () => {
      parser.config = {
        mcpVersion: '1.0',
        projectName: 'test'
      };
      expect(() => parser.validateConfig()).toThrow('Missing required field: dataSources');
    });

    it('should throw error for empty dataSources', () => {
      parser.config = {
        mcpVersion: '1.0',
        projectName: 'test',
        dataSources: {}
      };
      expect(() => parser.validateConfig()).toThrow('must contain at least one data source');
    });
  });
});
