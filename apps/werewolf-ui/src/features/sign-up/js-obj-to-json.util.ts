/* eslint-disable prefer-const */
export function jsObjToJson(data: string): string | null {
  let result = {} as object;

  try {
    // TODO
    eval(`result = Object(${data});`);
  } catch (error) {
    return null;
  }

  return JSON.stringify(result, null, 8);
};

