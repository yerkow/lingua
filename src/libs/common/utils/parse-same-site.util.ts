/**
 * Преобразует строковое значение в значение sameSite для cookie.
 *
 * Эта функция принимает строку, представляющую значение sameSite,
 * и возвращает соответствующее значение для cookie. Поддерживаются значения:
 * "strict", "lax", "none", "true" (преобразуется в true), "false" (преобразуется в false).
 *
 * @param value - Строка, представляющая значение sameSite.
 * @returns {boolean | "strict" | "lax" | "none"} Значение sameSite для cookie.
 * @throws {Error} Если переданное значение не может быть преобразовано.
 *
 * @example
 * parseSameSite('lax');   // вернет 'lax'
 * parseSameSite('strict'); // вернет 'strict'
 * parseSameSite('none');  // вернет 'none'
 * parseSameSite('true');  // вернет true
 * parseSameSite('false'); // вернет false
 */
export function parseSameSite(
	value: string
): boolean | "strict" | "lax" | "none" {
	if (typeof value === "boolean") {
		return value;
	}

	if (typeof value === "string") {
		const lowerValue = value.trim().toLowerCase();
		if (lowerValue === "strict" || lowerValue === "lax" || lowerValue === "none") {
			return lowerValue;
		}
		if (lowerValue === "true") {
			return true;
		}
		if (lowerValue === "false") {
			return false;
		}
	}

	throw new Error(
		`Не удалось преобразовать значение "${value}" в sameSite. Ожидаются значения: "strict", "lax", "none", "true", "false".`
	);
}

