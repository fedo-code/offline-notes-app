import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NoteCard from '../components/NoteCard';

test('NoteCard is accessible and clickable', () => {
  const note = { id: '1', title: 'Test', content: 'Test content', pinned: false, createdAt: '', updatedAt: '', tags: [], syncStatus: 'synced' };
  const onEdit = jest.fn();
  render(<NoteCard note={note} onEdit={onEdit} />);
  const card = screen.getByRole('button', { name: /edit note/i });
  expect(card).toBeInTheDocument();
  userEvent.click(card);
  expect(onEdit).toHaveBeenCalled();
});
