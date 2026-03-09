import { ModuleMetadata } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

type AnyFunction = (...args: any[]) => any;
type MethodKeys<T> = {
  [K in keyof T]-?: T[K] extends AnyFunction ? K : never;
}[keyof T];
type MockedMethods<T extends object> = Partial<{
  [K in MethodKeys<T>]: jest.MockedFunction<Extract<T[K], AnyFunction>>;
}>;

export const createUnitTestingModule = async (
  metadata: ModuleMetadata,
): Promise<TestingModule> => {
  return await Test.createTestingModule(metadata).compile();
};

export const mockFn = <T extends AnyFunction>(): jest.MockedFunction<T> => {
  return jest.fn() as unknown as jest.MockedFunction<T>;
};

export const createMock = <T extends object>(
  methods: MockedMethods<T>,
): jest.Mocked<T> => {
  return methods as jest.Mocked<T>;
};
