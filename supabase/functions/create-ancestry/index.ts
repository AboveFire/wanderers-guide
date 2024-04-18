// @ts-ignore
import { serve } from 'std/server';
import {
  connect,
  fetchData,
  handleAssociatedTrait,
  upsertData,
  upsertResponseWrapper,
} from '../_shared/helpers.ts';
import type { Ancestry, Trait } from '../_shared/content';

serve(async (req: Request) => {
  return await connect(req, async (client, body) => {
    let { id, name, rarity, description, operations, artwork_url, content_source_id, version } =
      body as Ancestry;

    const trait_id = await handleAssociatedTrait(client, id, 'ancestry', name, content_source_id);
    if (!trait_id) {
      return {
        status: 'error',
        message: 'Trait could not be created.',
      };
    }

    const { procedure, result } = await upsertData<Ancestry>(client, 'ancestry', {
      id,
      name,
      rarity,
      description,
      operations,
      trait_id,
      artwork_url,
      content_source_id,
      version,
    });

    return upsertResponseWrapper(procedure, result);
  });
});
