import fs from 'node:fs';

const readFile = (path: string) => {
  try {
    const rawdata = fs.readFileSync(path, 'utf8');
    return JSON.parse(rawdata);
  } catch (error) {
    if (
      error instanceof Error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return null;
    }
    throw error;
  }
};

const writeToFile = (path: string, data: unknown) => {
  const parsedData = JSON.stringify(data, null, 2);
  fs.writeFileSync(path, parsedData, 'utf8');
};

const deleteFile = (path: string) => {
  if (fs.existsSync(path)) {
    fs.unlink(path, (err) => {
        if (err) {
            console.log(err);
        }
    })
  }
}

export { deleteFile, readFile, writeToFile };
