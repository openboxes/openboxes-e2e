import { APIResponse } from '@playwright/test';

export async function parseRequestToJSON(response: APIResponse) {
  try {
    return await response.json();
  } catch (error) {
    throw new Error('Problem parsing JSON');
  }
}
