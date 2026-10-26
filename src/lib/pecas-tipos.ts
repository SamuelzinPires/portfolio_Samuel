// Tipos dos dados de cada peça-assinatura, tirados do schema da collection (src/content.config.ts).
import type { Peca } from '../content.config';

export type Dados<T extends Peca['tipo']> = Extract<Peca, { tipo: T }>['dados'];
