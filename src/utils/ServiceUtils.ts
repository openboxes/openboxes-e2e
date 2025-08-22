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

export function jsonToCsv(data: Record<string, string>[]): string {
  if (!Array.isArray(data) || !data.length) {
    throw new Error('Input JSON array is empty');
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(header =>
      JSON.stringify(row[header] ?? '')).join(',')
    ),
  ];

  return csvRows.join('\n');
}
