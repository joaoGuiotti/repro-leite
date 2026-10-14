import { CalvesOutboxEnqueuer, CalvesRepository } from '../../domain/calves.repository';
import { RegisterCalfUseCase } from '../register-calf.usecase';

describe('RegisterCalfUseCase', () => {
  let repo: jest.Mocked<CalvesRepository>;
  let outbox: jest.Mocked<CalvesOutboxEnqueuer>;
  let txRunner: { run: jest.Mock };
  let useCase: RegisterCalfUseCase;

  beforeEach(() => {
    repo = {
      listCalvesByFarm: jest.fn().mockResolvedValue([]),
      findCalfById: jest.fn().mockResolvedValue(null),
      findByEarTag: jest.fn().mockResolvedValue(null),
      saveCalf: jest.fn().mockResolvedValue(undefined),
      updateCalf: jest.fn().mockResolvedValue(undefined),
      softDeleteCalf: jest.fn().mockResolvedValue(undefined),
      listWeighingsByAnimal: jest.fn().mockResolvedValue([]),
      saveWeighing: jest.fn().mockResolvedValue(undefined),
      softDeleteWeighing: jest.fn().mockResolvedValue(undefined),
      getAvailableBulls: jest.fn().mockResolvedValue([]),
      getAvailableCows: jest.fn().mockResolvedValue([]),
    };

    outbox = {
      enqueue: jest.fn().mockResolvedValue(undefined),
    };

    txRunner = {
      run: jest.fn().mockImplementation(async (cb) => cb()),
    };

    useCase = new RegisterCalfUseCase(repo, outbox, txRunner);
  });

  it('cadastra bezerra com sucesso aplicando peso padrão de 40kg e salvando na outbox', async () => {
    const res = await useCase.execute({
      farmId: 'farm-1',
      earTag: '501',
      name: 'Princesa',
      sex: 'femea',
      birthDate: '2026-11-11',
      // birthWeightKg omitido -> deve assumir 40
      sireName: 'Jaguar TE do Gavião',
      damName: 'Estrela (104)',
      maternalGranddamName: 'Cigana',
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.earTag).toBe('501');
      expect(res.value.id).toBeDefined();
    }

    expect(repo.saveCalf).toHaveBeenCalledWith(
      expect.objectContaining({
        farmId: 'farm-1',
        earTag: '501',
        name: 'Princesa',
        birthWeightKg: 40,
        sireName: 'Jaguar TE do Gavião',
        damName: 'Estrela (104)',
        maternalGrandsireName: 'Cigana',
      })
    );

    expect(outbox.enqueue).toHaveBeenCalledWith(
      'farm-1',
      'animals',
      expect.any(String),
      'INSERT',
      expect.any(Object)
    );
  });

  it('rejeita cadastro se o brinco já estiver em uso por animal ativo', async () => {
    repo.findByEarTag.mockResolvedValue({
      id: 'existing-id',
      farmId: 'farm-1',
      earTag: '501',
      earTagNormalized: '501',
      breed: 'Girolando',
      sex: 'femea',
      birthDate: '2026-01-01',
      birthWeightKg: 40,
      lifeStage: 'bezerra',
      reproStatus: 'vazia',
      exitStatus: 'ativo',
      createdAt: '',
      updatedAt: '',
    });

    const res = await useCase.execute({
      farmId: 'farm-1',
      earTag: '501',
      sex: 'femea',
      birthDate: '2026-11-11',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe('EAR_TAG_ALREADY_EXISTS');
    }
    expect(repo.saveCalf).not.toHaveBeenCalled();
  });

  it('rejeita cadastro sem brinco ou sem data de nascimento', async () => {
    const resNoTag = await useCase.execute({
      farmId: 'farm-1',
      earTag: '',
      sex: 'femea',
      birthDate: '2026-11-11',
    });
    expect(resNoTag.ok).toBe(false);

    const resNoDate = await useCase.execute({
      farmId: 'farm-1',
      earTag: '501',
      sex: 'femea',
      birthDate: '',
    });
    expect(resNoDate.ok).toBe(false);
  });
});
