type Leitura = { descricao: string; sugestao: string | null; transferenciaPropria?: boolean };

const LEITURAS: Record<string, Leitura> = {
  'Same person transfer': {
    descricao: 'Transferência para uma conta sua',
    sugestao: null,
    transferenciaPropria: true,
  },
  'Transfer - PIX': { descricao: 'Transferência por PIX', sugestao: null },
  'Transfer - Bank Slip': { descricao: 'Pagamento de boleto', sugestao: null },
  Transfers: { descricao: 'Transferência', sugestao: null },
  'Eating out': { descricao: 'Comer fora', sugestao: 'Restaurante' },
  'Food delivery': { descricao: 'Delivery de comida', sugestao: 'Restaurante' },
  'Food and drinks': { descricao: 'Comida e bebida', sugestao: 'Restaurante' },
  Groceries: { descricao: 'Mercado', sugestao: 'Mercado' },
  'Gas stations': { descricao: 'Posto de combustível', sugestao: 'Combustível' },
  'Taxi and ride-hailing': { descricao: 'Táxi e aplicativo', sugestao: 'Transporte' },
  Parking: { descricao: 'Estacionamento', sugestao: 'Transporte' },
  Automotive: { descricao: 'Carro', sugestao: 'Transporte' },
  'Digital services': { descricao: 'Serviço digital', sugestao: 'Contas e assinaturas' },
  'Video streaming': { descricao: 'Streaming', sugestao: 'Contas e assinaturas' },
  Telecommunications: { descricao: 'Telefone e internet', sugestao: 'Contas e assinaturas' },
  Healthcare: { descricao: 'Saúde', sugestao: 'Saúde' },
  Pharmacy: { descricao: 'Farmácia', sugestao: 'Saúde' },
  Optometry: { descricao: 'Ótica', sugestao: 'Saúde' },
  Clothing: { descricao: 'Roupas', sugestao: 'Compras' },
  Shopping: { descricao: 'Compras', sugestao: 'Compras' },
  'Online shopping': { descricao: 'Compras online', sugestao: 'Compras' },
  Electronics: { descricao: 'Eletrônicos', sugestao: 'Compras' },
  Tickets: { descricao: 'Ingressos', sugestao: 'Lazer' },
  Housing: { descricao: 'Moradia', sugestao: 'Moradia' },
  Services: { descricao: 'Serviços', sugestao: null },
  'Interests charged': { descricao: 'Juros', sugestao: 'Juros e tarifas' },
  'Late payment and overdraft costs': { descricao: 'Atraso e cheque especial', sugestao: 'Juros e tarifas' },
  'Tax on financial operations': { descricao: 'IOF', sugestao: 'Juros e tarifas' },
};

export function lerCategoriaDoBanco(categoriaPluggy: string | null): Leitura | null {
  if (!categoriaPluggy) return null;
  return LEITURAS[categoriaPluggy] ?? { descricao: categoriaPluggy, sugestao: null };
}
