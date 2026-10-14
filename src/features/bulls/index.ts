import React from 'react';
import {
  BullsScreen as RawBullsScreen,
  BullsScreenProps as RawBullsScreenProps,
} from './presentation/screens/BullsScreen';
import { getBullsUseCases } from './factory';

// Domain
export * from './domain/bull.entity';
export * from './domain/bull.repository';
export * from './domain/bull-stock';
export * from './domain/consanguinity';

// Application
export * from './application/list-bulls.usecase';
export * from './application/register-bull.usecase';
export * from './application/adjust-bull-straws.usecase';

// Infra
export * from './infra/bull.mapper';
export * from './infra/bull.schema';
export * from './infra/bull.sqlite.repository';

// Presentation Components & Hooks
export * from './presentation/components/BadgeEstoqueDoses';
export * from './presentation/components/ModalCadastroTouro';
export * from './presentation/components/CatalogoTouros';
export * from './presentation/hooks/useBulls';
export * from './presentation/hooks/useRegisterBull';
export * from './presentation/hooks/useAdjustStraws';

// Factory & Types
export * from './factory';

export type BullsScreenProps = Omit<
  RawBullsScreenProps,
  'listUseCase' | 'registerUseCase' | 'adjustUseCase'
> &
  Partial<
    Pick<RawBullsScreenProps, 'listUseCase' | 'registerUseCase' | 'adjustUseCase'>
  >;

/**
 * BullsScreen connected with default use cases from the bulls feature composition root.
 * Custom use cases can still be passed for testing or dependency overrides.
 */
export function BullsScreen(props: BullsScreenProps) {
  const useCases = getBullsUseCases();
  return React.createElement(RawBullsScreen, {
    listUseCase: props.listUseCase ?? useCases.listUseCase,
    registerUseCase: props.registerUseCase ?? useCases.registerUseCase,
    adjustUseCase: props.adjustUseCase ?? useCases.adjustUseCase,
    ...props,
  });
}
