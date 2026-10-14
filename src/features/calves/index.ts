// Domain
export * from './domain/calves.types';
export * from './domain/calf-feeding';
export * from './domain/calf-weight';
export { calculateFeedingPlan, type FeedingPlan } from './domain/calves.entity';
export * from './domain/calves.repository';

// Application
export * from './application/list-calves.usecase';
export * from './application/get-calf-details.usecase';
export * from './application/register-calf.usecase';
export * from './application/record-weighing.usecase';
export * from './application/delete-calf.usecase';
export * from './application/get-breeding-options.usecase';

// Infra
export * from './infra/weighings.schema';
export * from './infra/calves.queries';
export * from './infra/calves.repository.impl';
export * from './infra/calves-outbox';

// Presentation Components & Screens
export * from './presentation/components/CalfGenealogyCard';
export * from './presentation/components/CalfFeedingTimelineCard';
export * from './presentation/components/CalfWeightGrowthCard';
export * from './presentation/components/CalfListCard';
export * from './presentation/components/CalfDetailPane';
export * from './presentation/components/RegisterCalfModal';
export * from './presentation/components/AddWeighingModal';
export * from './presentation/components/FeedingCalculatorCard';
export * from './presentation/screens/CalvesScreen';

// Presentation Hooks
export * from './presentation/hooks/useCalvesList';
export * from './presentation/hooks/useCalfDetails';

// Composition Root
export * from './factory';
