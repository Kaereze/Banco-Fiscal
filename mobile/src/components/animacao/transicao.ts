import { useEffect } from 'react';
import { useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { aoTerminar } from './sequencia';

export const DURACAO_TRANSICAO = 380;

export function useTransicao(ativa: boolean, quandoTerminar?: () => void): SharedValue<number> {
  const progresso = useSharedValue(ativa ? 1 : 0);

  useEffect(() => {
    progresso.value = withTiming(
      ativa ? 1 : 0,
      { duration: DURACAO_TRANSICAO },
      ativa && quandoTerminar ? aoTerminar(quandoTerminar) : undefined,
    );
  }, [ativa, progresso, quandoTerminar]);

  return progresso;
}
