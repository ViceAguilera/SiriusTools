import { describe, expect, it } from 'vitest';
import { type QueueItem, addToQueue } from './queue-store';

const item = (id: string): QueueItem => ({ id, url: `https://www.youtube.com/watch?v=${id}`, format: 'mp3', status: 'queued', percent: 0 });

describe('addToQueue', () => {
  it('agrega al principio', () => {
    expect(addToQueue([item('a')], item('b')).map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('no duplica el mismo trabajo', () => {
    expect(addToQueue([item('a'), item('b')], item('a')).map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('descarta los más viejos sobre el máximo', () => {
    const many = Array.from({ length: 30 }, (_, i) => item(String(i)));
    const result = addToQueue(many, item('nuevo'));
    expect(result).toHaveLength(30);
    expect(result[0].id).toBe('nuevo');
    expect(result.at(-1)!.id).toBe('28');
  });
});
