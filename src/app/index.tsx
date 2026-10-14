import { Redirect } from 'expo-router';

export default function Index() {
  // TODO Sprint 2: redirecionar para login se não houver sessão.
  return <Redirect href="/(tabs)/hoje" />;
}
