import { mergeTests } from "@playwright/test";

import { test as navigationTest } from "@/fixtures/navigation";

export const test = mergeTests(navigationTest);
