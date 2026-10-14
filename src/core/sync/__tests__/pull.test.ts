import { PullEngine } from '../pull';
import { FakeRemoteSyncGateway } from '../../network/api-client';

describe('Sync: PullEngine', () => {
  let gateway: FakeRemoteSyncGateway;
  const farmId = '00000000-0000-4000-a000-000000000001';

  let mockRawDb: {
    execSync: jest.Mock;
    runSync: jest.Mock;
    getFirstSync: jest.Mock;
  };

  let mockDrizzleDb: {
    select: jest.Mock;
    update: jest.Mock;
    insert: jest.Mock;
  };

  beforeEach(() => {
    gateway = new FakeRemoteSyncGateway();
    jest.restoreAllMocks();

    mockRawDb = {
      execSync: jest.fn(),
      runSync: jest.fn(),
      getFirstSync: jest.fn().mockReturnValue(null),
    };

    mockDrizzleDb = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ serverRev: 0, lastPulledAt: null }]),
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      }),
    };
  });

  test('quando não há alterações remotas, retorna 0 puxados e sem transação de escrita', async () => {
    const result = await PullEngine.pull(farmId, gateway, 100, {
      rawDb: mockRawDb as any,
      db: mockDrizzleDb as any,
    });
    expect(result.pulledCount).toBe(0);
    expect(result.newRev).toBe(0);
    expect(result.hasMore).toBe(false);
    expect(mockRawDb.execSync).not.toHaveBeenCalledWith('BEGIN TRANSACTION;');
  });

  test('deve aplicar mudanças remotas dentro de transação e avançar cursor de revisão', async () => {
    gateway.seedRemoteRecord(
      'animals',
      'anim-200',
      farmId,
      { ear_tag: '200', name: 'Margarida', breed: 'Jersey' },
      '2026-10-14T11:00:00.000Z'
    );

    const result = await PullEngine.pull(farmId, gateway, 100, {
      rawDb: mockRawDb as any,
      db: mockDrizzleDb as any,
    });

    expect(result.pulledCount).toBe(1);
    expect(mockRawDb.execSync).toHaveBeenCalledWith('BEGIN TRANSACTION;');
    expect(mockRawDb.runSync).toHaveBeenCalled();
    expect(mockRawDb.execSync).toHaveBeenCalledWith('COMMIT;');
  });

  test('deve propagar exclusão suave quando deletedAt vier preenchido do servidor', async () => {
    mockRawDb.getFirstSync.mockReturnValue({
      id: 'anim-300',
      name: 'Animal a Deletar',
      updated_at: '2026-10-14T09:00:00.000Z',
    });

    gateway.seedRemoteRecord(
      'animals',
      'anim-300',
      farmId,
      { name: 'Animal a Deletar' },
      '2026-10-14T11:30:00.000Z',
      '2026-10-14T11:30:00.000Z' // deletedAt
    );

    const result = await PullEngine.pull(farmId, gateway, 100, {
      rawDb: mockRawDb as any,
      db: mockDrizzleDb as any,
    });

    expect(result.pulledCount).toBe(1);
    expect(mockRawDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE animals SET deleted_at = ?'),
      expect.arrayContaining(['2026-10-14T11:30:00.000Z', 'anim-300'])
    );
  });

  test('em caso de falha durante a aplicação, executa ROLLBACK e propaga o erro', async () => {
    gateway.seedRemoteRecord(
      'animals',
      'anim-error',
      farmId,
      { ear_tag: '999' },
      '2026-10-14T12:00:00.000Z'
    );

    mockRawDb.runSync.mockImplementation(() => {
      throw new Error('SQLite disk I/O error');
    });

    await expect(
      PullEngine.pull(farmId, gateway, 100, {
        rawDb: mockRawDb as any,
        db: mockDrizzleDb as any,
      })
    ).rejects.toThrow('SQLite disk I/O error');
    expect(mockRawDb.execSync).toHaveBeenCalledWith('ROLLBACK;');
  });
});
