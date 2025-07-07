import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MarkdownRenderer from './MarkdownRenderer';

describe('MarkdownRenderer', () => {
  it('renders basic markdown content', () => {
    const content = '# Hello World\n\nThis is a test.';
    render(<MarkdownRenderer content={content} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello World');
    expect(screen.getByText('This is a test.')).toBeInTheDocument();
  });

  it('applies dark theme class when isDark is true', () => {
    const content = '# Test';
    const { container } = render(<MarkdownRenderer content={content} isDark={true} />);
    
    expect(container.firstChild).toHaveClass('prose-invert');
  });

  it('renders code blocks with syntax highlighting', () => {
    const content = '```javascript\nconst x = 1;\n```';
    render(<MarkdownRenderer content={content} />);
    
    expect(screen.getByText(/const/)).toBeInTheDocument();
    expect(screen.getByText(/x = /)).toBeInTheDocument();
    expect(screen.getByText(/1/)).toBeInTheDocument();
  });

  it('makes external links open in new tab', () => {
    const content = '[External Link](https://example.com)';
    render(<MarkdownRenderer content={content} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('handles images with lazy loading', () => {
    const content = '![Alt text](https://example.com/image.jpg)';
    render(<MarkdownRenderer content={content} />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('alt', 'Alt text');
  });

  it('sanitizes dangerous HTML content', () => {
    const content = '<script>alert("xss")</script>\n\n# Safe Content';
    render(<MarkdownRenderer content={content} />);
    
    expect(screen.queryByText('alert("xss")')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Safe Content');
  });
});