


const mockRedis = {
  get:      jest.fn(),
  set:      jest.fn(),
  del:      jest.fn(),
  scan:     jest.fn(),
  pipeline: jest.fn(),
};

jest.mock('../../config/redis', () => mockRedis);


const cache = require('../../utils/cache');


beforeEach(() => {
  jest.clearAllMocks();
});


describe('generateKey', () => {
  it('joins parts with colons', () => {
    expect(cache.generateKey('projects', 'userId123')).toBe('projects:userId123');
  });

  it('handles multiple parts', () => {
    expect(cache.generateKey('tasks', 'userId', 'page', '1')).toBe('tasks:userId:page:1');
  });
});


describe('hashQuery', () => {
  it('returns an 8-char hex string', () => {
    const h = cache.hashQuery({ status: 'todo' });
    expect(h).toMatch(/^[a-f0-9]{8}$/);
  });

  it('produces the same hash regardless of key order', () => {
    const h1 = cache.hashQuery({ status: 'todo', priority: 'high' });
    const h2 = cache.hashQuery({ priority: 'high', status: 'todo' });
    expect(h1).toBe(h2);
  });

  it('produces different hashes for different queries', () => {
    const h1 = cache.hashQuery({ status: 'todo' });
    const h2 = cache.hashQuery({ status: 'done' });
    expect(h1).not.toBe(h2);
  });
});


describe('get', () => {
  it('returns parsed JSON on cache HIT', async () => {
    const data = { name: 'Test Project' };
    mockRedis.get.mockResolvedValue(JSON.stringify(data));

    const result = await cache.get('project:abc');
    expect(mockRedis.get).toHaveBeenCalledWith('project:abc');
    expect(result).toEqual(data);
  });

  it('returns null on cache MISS (key not found)', async () => {
    mockRedis.get.mockResolvedValue(null);

    const result = await cache.get('project:missing');
    expect(result).toBeNull();
  });

  it('returns null and does not throw when Redis errors', async () => {
    mockRedis.get.mockRejectedValue(new Error('Redis connection refused'));

    await expect(cache.get('project:abc')).resolves.toBeNull();
  });
});


describe('set', () => {
  it('stores JSON-stringified data with correct TTL', async () => {
    mockRedis.set.mockResolvedValue('OK');
    const data = [{ _id: '1', title: 'Task A' }];

    await cache.set('tasks:userId:abc123', data, 120);

    expect(mockRedis.set).toHaveBeenCalledWith(
      'tasks:userId:abc123',
      JSON.stringify(data),
      'EX',
      120
    );
  });

  it('uses default TTL of 300 seconds when not specified', async () => {
    mockRedis.set.mockResolvedValue('OK');

    await cache.set('task:xyz', { id: 'xyz' });

    expect(mockRedis.set).toHaveBeenCalledWith(
      'task:xyz',
      expect.any(String),
      'EX',
      300
    );
  });

  it('does not throw when Redis errors', async () => {
    mockRedis.set.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(cache.set('key', {}, 60)).resolves.toBeUndefined();
  });
});


describe('del', () => {
  it('calls redis.del with the correct key', async () => {
    mockRedis.del.mockResolvedValue(1);

    await cache.del('project:abc');
    expect(mockRedis.del).toHaveBeenCalledWith('project:abc');
  });

  it('does not throw when Redis errors', async () => {
    mockRedis.del.mockRejectedValue(new Error('timeout'));
    await expect(cache.del('project:abc')).resolves.toBeUndefined();
  });
});


describe('delByPattern', () => {
  it('scans and deletes all matched keys', async () => {
    
    
    mockRedis.scan
      .mockResolvedValueOnce(['42', ['tasks:uid:aaa', 'tasks:uid:bbb']])
      .mockResolvedValueOnce(['0',  ['tasks:uid:ccc']]);

    
    const mockExec = jest.fn().mockResolvedValue([]);
    const mockPipelineDel = jest.fn().mockReturnThis();
    mockRedis.pipeline.mockReturnValue({ del: mockPipelineDel, exec: mockExec });

    await cache.delByPattern('tasks:uid:*');

    
    expect(mockRedis.scan).toHaveBeenCalledTimes(2);
    
    expect(mockPipelineDel).toHaveBeenCalledTimes(3);
    expect(mockExec).toHaveBeenCalled();
  });

  it('does nothing when no keys match', async () => {
    mockRedis.scan.mockResolvedValue(['0', []]); 
    mockRedis.pipeline.mockReturnValue({ del: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) });

    await cache.delByPattern('tasks:ghost:*');
    
    expect(mockRedis.pipeline().exec).not.toHaveBeenCalled();
  });

  it('does not throw when Redis errors', async () => {
    mockRedis.scan.mockRejectedValue(new Error('Redis error'));
    await expect(cache.delByPattern('tasks:*')).resolves.toBeUndefined();
  });
});
