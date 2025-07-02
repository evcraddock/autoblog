import { describe, it, expect } from 'vitest';
import type {
  BlogPost,
  BlogIndex,
  ParsedMarkdown,
} from '../../src/types/index.js';

describe('Type Definitions', () => {
  describe('BlogPost interface', () => {
    it('should accept valid BlogPost objects', () => {
      const validPost: BlogPost = {
        title: 'Test Post',
        author: 'John Doe',
        published: new Date('2024-01-01'),
        status: 'draft',
        slug: 'test-post',
        description: 'A test post description',
        content: '# Test Post\n\nThis is test content.',
        imageUrl: 'https://example.com/image.jpg',
      };

      expect(validPost.title).toBe('Test Post');
      expect(validPost.status).toBe('draft');
      expect(validPost.published).toBeInstanceOf(Date);
      expect(validPost.imageUrl).toBe('https://example.com/image.jpg');
    });

    it('should accept BlogPost without optional imageUrl', () => {
      const postWithoutImage: BlogPost = {
        title: 'Test Post Without Image',
        author: 'Jane Doe',
        published: new Date('2024-01-02'),
        status: 'published',
        slug: 'test-post-without-image',
        description: 'A test post without image',
        content: '# Test Post\n\nContent without image.',
      };

      expect(postWithoutImage.imageUrl).toBeUndefined();
      expect(postWithoutImage.status).toBe('published');
    });

    it('should validate status enum values', () => {
      const draftPost: BlogPost = {
        title: 'Draft Post',
        author: 'Author',
        published: new Date(),
        status: 'draft',
        slug: 'draft-post',
        description: 'Draft description',
        content: 'Draft content',
      };

      const publishedPost: BlogPost = {
        title: 'Published Post',
        author: 'Author',
        published: new Date(),
        status: 'published',
        slug: 'published-post',
        description: 'Published description',
        content: 'Published content',
      };

      expect(draftPost.status).toBe('draft');
      expect(publishedPost.status).toBe('published');
    });
  });

  describe('BlogIndex interface', () => {
    it('should accept valid BlogIndex objects', () => {
      const validIndex: BlogIndex = {
        posts: {
          'first-post': 'doc-id-1',
          'second-post': 'doc-id-2',
          'third-post': 'doc-id-3',
        },
        lastUpdated: new Date('2024-01-01'),
      };

      expect(Object.keys(validIndex.posts)).toHaveLength(3);
      expect(validIndex.posts['first-post']).toBe('doc-id-1');
      expect(validIndex.lastUpdated).toBeInstanceOf(Date);
    });

    it('should accept empty posts record', () => {
      const emptyIndex: BlogIndex = {
        posts: {},
        lastUpdated: new Date(),
      };

      expect(Object.keys(emptyIndex.posts)).toHaveLength(0);
      expect(emptyIndex.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('ParsedMarkdown interface', () => {
    it('should accept valid ParsedMarkdown objects', () => {
      const validParsed: ParsedMarkdown = {
        frontmatter: {
          title: 'Test Title',
          author: 'Test Author',
          published: '2024-01-01',
        },
        content: '# Heading\n\nContent here.',
      };

      expect(validParsed.frontmatter.title).toBe('Test Title');
      expect(validParsed.content).toContain('# Heading');
    });

    it('should accept empty frontmatter', () => {
      const parsedWithEmptyFrontmatter: ParsedMarkdown = {
        frontmatter: {},
        content: 'Just content without frontmatter.',
      };

      expect(Object.keys(parsedWithEmptyFrontmatter.frontmatter)).toHaveLength(
        0
      );
      expect(parsedWithEmptyFrontmatter.content).toBe(
        'Just content without frontmatter.'
      );
    });

    it('should accept null frontmatter', () => {
      const parsedWithNullFrontmatter: ParsedMarkdown = {
        frontmatter: null,
        content: 'Content with null frontmatter.',
      };

      expect(parsedWithNullFrontmatter.frontmatter).toBeNull();
      expect(parsedWithNullFrontmatter.content).toBe(
        'Content with null frontmatter.'
      );
    });
  });

  describe('Type Validation Helpers', () => {
    function isBlogPost(obj: any): obj is BlogPost {
      return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.title === 'string' &&
        typeof obj.author === 'string' &&
        obj.published instanceof Date &&
        (obj.status === 'draft' || obj.status === 'published') &&
        typeof obj.slug === 'string' &&
        typeof obj.description === 'string' &&
        typeof obj.content === 'string' &&
        (obj.imageUrl === undefined || typeof obj.imageUrl === 'string')
      );
    }

    function isBlogIndex(obj: any): obj is BlogIndex {
      return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.posts === 'object' &&
        obj.posts !== null &&
        obj.lastUpdated instanceof Date
      );
    }

    function isParsedMarkdown(obj: any): obj is ParsedMarkdown {
      return (
        typeof obj === 'object' &&
        obj !== null &&
        obj.frontmatter !== undefined &&
        typeof obj.content === 'string'
      );
    }

    it('should validate BlogPost objects with helper function', () => {
      const validPost = {
        title: 'Valid Post',
        author: 'Author',
        published: new Date(),
        status: 'draft' as const,
        slug: 'valid-post',
        description: 'Description',
        content: 'Content',
      };

      const invalidPost = {
        title: 'Invalid Post',
        author: 'Author',
        status: 'invalid-status',
        slug: 'invalid-post',
      };

      expect(isBlogPost(validPost)).toBe(true);
      expect(isBlogPost(invalidPost)).toBe(false);
    });

    it('should validate BlogIndex objects with helper function', () => {
      const validIndex = {
        posts: { 'post-1': 'id-1' },
        lastUpdated: new Date(),
      };

      const invalidIndex = {
        posts: 'not-an-object',
        lastUpdated: 'not-a-date',
      };

      expect(isBlogIndex(validIndex)).toBe(true);
      expect(isBlogIndex(invalidIndex)).toBe(false);
    });

    it('should validate ParsedMarkdown objects with helper function', () => {
      const validParsed = {
        frontmatter: { title: 'Test' },
        content: 'Content',
      };

      const invalidParsed = {
        content: 'Content only',
      };

      expect(isParsedMarkdown(validParsed)).toBe(true);
      expect(isParsedMarkdown(invalidParsed)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings in required fields', () => {
      const postWithEmptyStrings: BlogPost = {
        title: '',
        author: '',
        published: new Date(),
        status: 'draft',
        slug: '',
        description: '',
        content: '',
      };

      expect(postWithEmptyStrings.title).toBe('');
      expect(postWithEmptyStrings.author).toBe('');
      expect(postWithEmptyStrings.slug).toBe('');
    });

    it('should handle invalid dates', () => {
      const invalidDate = new Date('invalid-date');
      const postWithInvalidDate: BlogPost = {
        title: 'Test',
        author: 'Author',
        published: invalidDate,
        status: 'draft',
        slug: 'test',
        description: 'Description',
        content: 'Content',
      };

      expect(isNaN(postWithInvalidDate.published.getTime())).toBe(true);
    });
  });
});
