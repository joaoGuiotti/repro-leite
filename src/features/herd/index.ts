import React from 'react';
import {
  HerdScreen as RawHerdScreen,
  HerdScreenProps as RawHerdScreenProps,
} from './presentation/screens/HerdScreen';
import { getHerdUseCases } from './factory';

// Domain
export * from './domain/animal.entity';
export * from './domain/animal.repository';
export * from './domain/animal-filters';
export * from './domain/ear-tag';

// Application
export * from './application/list-animals.usecase';
export * from './application/register-animal.usecase';
export * from './application/remove-animal.usecase';

// Infra
export * from './infra/animal.mapper';
export * from './infra/animal.schema';
export * from './infra/animal.sqlite.repository';

// Presentation Components & Hooks
export * from './presentation/components/BadgeBrinco';
export * from './presentation/components/ModalCadastroAnimal';
export * from './presentation/components/ModalSaidaAnimal';
export * from './presentation/hooks/useAnimals';
export * from './presentation/hooks/useRegisterAnimal';
export * from './presentation/hooks/useRemoveAnimal';

// Factory & Types
export * from './factory';

export type HerdScreenProps = Omit<
  RawHerdScreenProps,
  'listUseCase' | 'registerUseCase' | 'removeUseCase'
> &
  Partial<
    Pick<RawHerdScreenProps, 'listUseCase' | 'registerUseCase' | 'removeUseCase'>
  >;

/**
 * HerdScreen connected with default use cases from feature composition root.
 * Custom use cases can still be passed for testing or dependency overrides.
 */
export function HerdScreen(props: HerdScreenProps) {
  const useCases = getHerdUseCases();
  return React.createElement(RawHerdScreen, {
    listUseCase: props.listUseCase ?? useCases.listUseCase,
    registerUseCase: props.registerUseCase ?? useCases.registerUseCase,
    removeUseCase: props.removeUseCase ?? useCases.removeUseCase,
    ...props,
  });
}
