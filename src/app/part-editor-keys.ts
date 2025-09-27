import { PartEditorKeys } from '@myrmidon/cadmus-core';
import { METADATA_PART_TYPEID } from '@myrmidon/cadmus-part-general-ui';
import { ICO_INSTRUCTIONS_PART_TYPEID } from '@myrmidon/cadmus-part-iconography-instructions';

const GENERAL = 'general';
const ICONOGRAPHY = 'iconography';

/**
 * The parts and fragments editor keys for this UI.
 * Each property is a part type ID, mapped to a value of type PartGroupKey,
 * having a part property with the part's editor key, and a fragments property
 * with the mappings between fragment type IDs and their editor keys.
 */
export const PART_EDITOR_KEYS: PartEditorKeys = {
  [METADATA_PART_TYPEID]: {
    part: GENERAL,
  },
  [ICO_INSTRUCTIONS_PART_TYPEID]: {
    part: ICONOGRAPHY,
  },
};
