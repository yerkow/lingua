import { Type } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

/**
 * Утилита для фильтрации объектов на основе DTO с декораторами @Expose() и @Exclude()
 * @param dtoClass - Класс DTO с декораторами валидации
 * @param data - Объект или массив объектов для фильтрации
 * @returns Отфильтрованный объект или массив объектов
 */
export function filterByDto<T extends object>(
  dtoClass: Type<T>,
  data: T | T[],
): T | T[] {
  if (Array.isArray(data)) {
    return data.map((item) => filterByDto(dtoClass, item)) as T[];
  }

  // Используем plainToInstance для применения декораторов @Expose() и @Exclude()
  const filtered = plainToInstance(dtoClass, data, {
    excludeExtraneousValues: true, // Исключает поля без @Expose()
    enableImplicitConversion: true, // Включает автоматическое преобразование типов
  });

  return filtered;
}

/**
 * Утилита для фильтрации объекта с дополнительными опциями
 * @param dtoClass - Класс DTO с декораторами валидации
 * @param data - Объект или массив объектов для фильтрации
 * @param options - Дополнительные опции фильтрации
 * @returns Отфильтрованный объект или массив объектов
 */
export function filterByDtoWithOptions<T extends object>(
  dtoClass: Type<T>,
  data: T | T[],
  options: {
    excludeExtraneousValues?: boolean;
    enableImplicitConversion?: boolean;
    excludePrefixes?: string[];
    excludeSuffixes?: string[];
  } = {},
): T | T[] {
  const {
    excludeExtraneousValues = true,
    enableImplicitConversion = true,
    excludePrefixes = [],
    excludeSuffixes = [],
  } = options;

  if (Array.isArray(data)) {
    return data.map((item) =>
      filterByDtoWithOptions(dtoClass, item, options),
    ) as T[];
  }

  // Применяем базовую фильтрацию по DTO
  let filtered = plainToInstance(dtoClass, data, {
    excludeExtraneousValues,
    enableImplicitConversion,
  });

  // Дополнительная фильтрация по префиксам и суффиксам
  if (excludePrefixes.length > 0 || excludeSuffixes.length > 0) {
    filtered = Object.fromEntries(
      Object.entries(filtered).filter(([key]) => {
        const shouldExcludeByPrefix = excludePrefixes.some((prefix) =>
          key.startsWith(prefix),
        );
        const shouldExcludeBySuffix = excludeSuffixes.some((suffix) =>
          key.endsWith(suffix),
        );

        return !shouldExcludeByPrefix && !shouldExcludeBySuffix;
      }),
    ) as T;
  }

  return filtered;
}

/**
 * Утилита для получения списка разрешенных полей из DTO
 * @param dtoClass - Класс DTO
 * @returns Массив имен разрешенных полей
 */
export function getDtoFields<T extends object>(dtoClass: Type<T>): string[] {
  const instance = new dtoClass();
  return Object.keys(instance);
}
