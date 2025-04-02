import { MapperFactory } from './factory';

export function AutoRegisterMapper(name: string) {
  return function (target: any) {
    const instance = new target();
    MapperFactory.getInstance().register(name, instance);
    return target;
  };
}
