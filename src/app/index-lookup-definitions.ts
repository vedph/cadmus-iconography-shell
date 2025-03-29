import { IndexLookupDefinitions } from '@myrmidon/cadmus-core';

import { METADATA_PART_TYPEID } from '@myrmidon/cadmus-part-general-ui';

export const INDEX_LOOKUP_DEFINITIONS: IndexLookupDefinitions = {
  // item's metadata
  meta_eid: {
    typeId: METADATA_PART_TYPEID,
    name: 'eid',
  },
};
