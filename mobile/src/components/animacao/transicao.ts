import { useEffect } from 'react';
import { Easing, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { aoTerminar } from './sequencia';

export const DURACAO_TRANSICAO = 600;

export function useTransicao(
  ativa: boolean,
  aoAtivar?: () => void,
  aoDesativar?: () => void,
  duracao = DURACAO_TRANSICAO,
): SharedValue<number> {
  const progresso = useSharedValue(ativa ? 1 : 0);

  useEffect(() => {
    const fim = ativa ? aoAtivar : aoDesativar;
    progresso.value = withTiming(
      ativa ? 1 : 0,
      { duration: duracao, easing: Easing.inOut(Easing.quad) },
      fim ? aoTerminar(fim) : undefined,
    );
  }, [ativa, progresso, aoAtivar, aoDesativar, duracao]);

  return progresso;
}
