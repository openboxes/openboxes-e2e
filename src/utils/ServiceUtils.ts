import { APIResponse } from '@playwright/test';
import _ from 'lodash'

export async function parseRequestToJSON(response: APIResponse) {
  try {
    return await response.json();
  } catch (error) {
    throw new Error('Problem parsing JSON');
  }
}


export function unflatten(obj: object) {
  const result = {};
  _.forOwn(obj, (value, key) => {
    _.set(result, key, value);
  });

  return result;
}
