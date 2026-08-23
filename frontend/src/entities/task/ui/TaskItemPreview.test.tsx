import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskItemPreview } from './TaskItemPreview';

describe('TaskItemPreview', () => {
  it('renders the task name', () => {
    render(<TaskItemPreview name="My task" />);
    expect(screen.getByText('My task')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(<TaskItemPreview name="My task" description="Some details" />);
    expect(screen.getByText('Some details')).toBeInTheDocument();
  });

  it('does not render a description paragraph when none is provided', () => {
    render(<TaskItemPreview name="My task" />);
    expect(screen.queryByText(/./, { selector: 'p' })).not.toBeInTheDocument();
  });

  it('truncates descriptions longer than 100 characters and appends an ellipsis', () => {
    const longDescription = 'a'.repeat(150);
    render(<TaskItemPreview name="My task" description={longDescription} />);

    expect(screen.getByText(`${'a'.repeat(100)}...`)).toBeInTheDocument();
  });

  it('does not append an ellipsis when the description is 100 characters or fewer', () => {
    const shortDescription = 'a'.repeat(100);
    render(<TaskItemPreview name="My task" description={shortDescription} />);

    expect(screen.getByText(shortDescription)).toBeInTheDocument();
    expect(
      screen.queryByText(`${shortDescription}...`),
    ).not.toBeInTheDocument();
  });
});
