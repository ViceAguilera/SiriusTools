import { describe, expect, it } from 'vitest';
import { ipKey } from './ip';

describe('ipKey', () => {
  it('deja igual las IPv4, también escritas como IPv6', () => {
    expect(ipKey('203.0.113.7')).toBe('203.0.113.7');
    expect(ipKey('::ffff:203.0.113.7')).toBe('203.0.113.7');
  });

  it('agrupa las IPv6 del mismo /64', () => {
    const key = ipKey('2001:db8:aa:1::1');
    expect(key).toBe('2001:db8:aa:1::/64');
    expect(ipKey('2001:0db8:00aa:0001:ffff:1:2:3')).toBe(key);
    expect(ipKey('2001:db8:aa:2::1')).not.toBe(key);
    expect(ipKey('::1')).toBe('0:0:0:0::/64');
  });
});
