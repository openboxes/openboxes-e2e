import AuthService from '@/api/AuthService';
import AppConfig from '@/config/AppConfig';
import { test } from '@/fixtures/fixtures';

test('authenticate main user to cycle count location', async ({
  request,
}) => {
  const user = AppConfig.instance.users['main'];
  const ccDepotId = AppConfig.instance.locations['ccDepot'].readId();

  const authService = new AuthService(request);
  await authService.login({
    username: user.username,
    password: user.password,
    location: ccDepotId,
  });

  await request.storageState({ path: user.ccStoragePath });
});
