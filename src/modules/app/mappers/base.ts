export interface Mapper<O, M> {
  mapToDomain(entity: O): M;
  mapToDTO?(domain: M): O;

  toDomain(entity: O): M;
  toDomain(array: O[]): M[];
  toDomain(entityOrArray: O | O[]): M | M[];

  toDTO(domain: M): O;
  toDTO(array: M[]): O[];
  toDTO(domainOrArray: M | M[]): O | O[];
}

export abstract class BaseMapper<O, M> implements Mapper<O, M> {
  abstract mapToDomain(entity: O): M;
  mapToDTO?(domain: M): O;

  toDomain(entity: O): M;
  toDomain(array: O[]): M[];
  toDomain(entityOrArray: O | O[]): M | M[] {
    return Array.isArray(entityOrArray)
      ? entityOrArray.map((e) => this.mapToDomain(e))
      : this.mapToDomain(entityOrArray);
  }

  toDTO(domain: M): O;
  toDTO(array: M[]): O[];
  toDTO(domainOrArray: M | M[]): O | O[] {
    if (!this.mapToDTO) {
      throw new Error(`${this.constructor.name} does not implement toDTO`);
    }
    return Array.isArray(domainOrArray)
      ? domainOrArray.map((e) => this.mapToDTO!(e))
      : this.mapToDTO!(domainOrArray);
  }
}
