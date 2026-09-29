import { useCallback } from 'react';

import { useCarregamento } from '@/components/carregamento/Carregamento';
import { useDados } from '@/lib/dados';

export function useBuscaNoBanco() {
  const { executar } = useCarregamento();
  const { sincronizarPluggy } = useDados();

  return useCallback(
    (completo = false) =>
      executar(
        () => sincronizarPluggy(completo),
        completo ? 'Recarregando 2 anos de histórico…' : 'Buscando os lançamentos no banco…',
      ),
    [executar, sincronizarPluggy],
  );
}
