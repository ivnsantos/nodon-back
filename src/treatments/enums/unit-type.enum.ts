export enum UnitType {
  // Unidades de Peso
  GRAMA = 'Grama',
  QUILOGRAMA = 'Quilograma',
  MILIGRAMA = 'Miligrama',

  // Unidades de Volume
  LITRO = 'Litro',
  MILILITRO = 'Mililitro',

  // Unidades de Comprimento
  CENTIMETRO = 'Centímetro',
  MILIMETRO = 'Milímetro',

  // Unidade Individual
  UNITARIO = 'Unitário',
}

export const VALID_UNIT_TYPES = Object.values(UnitType);

export const UNIT_TYPE_GROUPS = {
  PESO: [UnitType.GRAMA, UnitType.QUILOGRAMA, UnitType.MILIGRAMA],
  VOLUME: [UnitType.LITRO, UnitType.MILILITRO],
  COMPRIMENTO: [UnitType.CENTIMETRO, UnitType.MILIMETRO],
  INDIVIDUAL: [UnitType.UNITARIO],
};
