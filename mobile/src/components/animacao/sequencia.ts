import { scheduleOnRN } from 'react-native-worklets';

export function aoTerminar(proximo: () => void) {
  return (terminou?: boolean) => {
    'worklet';
    if (terminou) scheduleOnRN(proximo);
  };
}
