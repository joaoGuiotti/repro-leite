import { generateUUID, DEFAULT_FARM_ID, DEFAULT_FARM_NAME } from '../../src/db/client';
import * as schema from '../../src/db/schema';

describe('Schema & Banco Local Core', () => {
  test('generateUUID deve gerar UUIDs v4 válidos e distintos', () => {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();

    expect(uuid1).toBeDefined();
    expect(uuid2).toBeDefined();
    expect(uuid1).not.toBe(uuid2);

    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid1).toMatch(uuidV4Regex);
    expect(uuid2).toMatch(uuidV4Regex);
  });

  test('Constantes de fazenda padrão devem estar definidas', () => {
    expect(DEFAULT_FARM_ID).toBe('00000000-0000-4000-a000-000000000001');
    expect(DEFAULT_FARM_NAME).toBe('Minha Fazenda');
  });

  test('Schema farms deve conter colunas esperadas', () => {
    expect(schema.farms).toBeDefined();
    expect(schema.farms.id).toBeDefined();
    expect(schema.farms.name).toBeDefined();
    expect(schema.farms.createdAt).toBeDefined();
    expect(schema.farms.updatedAt).toBeDefined();
    expect(schema.farms.deletedAt).toBeDefined();
  });

  test('Schema settings deve conter colunas e chave estrangeira esperada', () => {
    expect(schema.settings).toBeDefined();
    expect(schema.settings.id).toBeDefined();
    expect(schema.settings.farmId).toBeDefined();
    expect(schema.settings.key).toBeDefined();
    expect(schema.settings.value).toBeDefined();
  });

  test('Schema sync_queue deve conter colunas de fila esperadas', () => {
    expect(schema.syncQueue).toBeDefined();
    expect(schema.syncQueue.tableName).toBeDefined();
    expect(schema.syncQueue.recordId).toBeDefined();
    expect(schema.syncQueue.operation).toBeDefined();
  });
});
