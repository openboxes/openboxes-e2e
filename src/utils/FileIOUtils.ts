import fs from 'node:fs';

const readFile = (path: string) => {
  const rawdata = fs.readFileSync(path, 'utf8');
  return JSON.parse(rawdata);
};

const writeToFile = (path: string, data: unknown) => {
  const parsedData = JSON.stringify(data, null, 2);
  fs.writeFileSync(path, parsedData, 'utf8');
};

export { readFile, writeToFile };
