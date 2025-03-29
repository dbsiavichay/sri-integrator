import 'reflect-metadata';

export class MapperFactory {
  private static instance: MapperFactory;
  private mappers: Map<string, any>;

  private constructor() {
    this.mappers = new Map();
  }

  static getInstance(): MapperFactory {
    if (!MapperFactory.instance) {
      MapperFactory.instance = new MapperFactory();
    }
    return MapperFactory.instance;
  }

  register(name: string, mapper: any) {
    this.mappers.set(name, mapper);
  }

  get<T>(name: string): T {
    const mapper = this.mappers.get(name);
    if (!mapper) {
      throw new Error(`Mapper ${name} not found`);
    }
    return mapper as T;
  }
}
