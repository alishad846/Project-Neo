import { StorageService, type S3ClientLike } from './storage.service';

describe('StorageService.uploadImage', () => {
  it('uploads the decoded buffer under a sellerId-prefixed key and returns a URL', async () => {
    const sent: Array<{ input: any }> = [];
    const fakeClient: S3ClientLike = {
      send: async (command: any) => {
        sent.push({ input: command.input });
        return {};
      },
    };

    const svc = new StorageService(fakeClient);
    const url = await svc.uploadImage('data:image/jpeg;base64,QUJD', 'seller_1', 'photo.jpg');

    expect(sent).toHaveLength(1);
    expect(sent[0].input.Bucket).toBe('neo-products');
    expect(sent[0].input.Key).toMatch(/^seller_1\/\d+-photo\.jpg$/);
    expect(Buffer.isBuffer(sent[0].input.Body)).toBe(true);
    expect(sent[0].input.Body.toString('utf-8')).toBe('ABC');
    expect(url).toContain('/neo-products/seller_1/');
  });

  it('strips unsafe characters from the filename', async () => {
    const sent: Array<{ input: any }> = [];
    const fakeClient: S3ClientLike = {
      send: async (command: any) => {
        sent.push({ input: command.input });
        return {};
      },
    };

    const svc = new StorageService(fakeClient);
    await svc.uploadImage('QUJD', 'seller_2', 'my photo (1).jpg');

    expect(sent[0].input.Key).toMatch(/^seller_2\/\d+-my_photo__1_\.jpg$/);
  });

  it('ensureBucket creates the bucket only when HeadBucket fails', async () => {
    const calls: string[] = [];
    const fakeClient: S3ClientLike = {
      send: async (command: any) => {
        calls.push(command.constructor.name);
        if (command.constructor.name === 'HeadBucketCommand') throw new Error('not found');
        return {};
      },
    };

    const svc = new StorageService(fakeClient);
    await svc.ensureBucket();

    expect(calls).toEqual(['HeadBucketCommand', 'CreateBucketCommand']);
  });
});
