import type { NomeIcone } from '@/components/ui/icone';
import { cores } from '@/lib/theme';

export type Resultado = 'sucesso' | 'erro';

export const APARENCIA_RESULTADO: Record<Resultado, { icone: NomeIcone; cor: string; suave: string }> = {
  sucesso: { icone: 'checkmark-circle', cor: cores.entrada, suave: cores.entradaSuave },
  erro: { icone: 'close-circle', cor: cores.saida, suave: cores.saidaSuave },
};
