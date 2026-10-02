import {
  ICO_INSTRUCTIONS_PART_SCHEMA,
  ICO_INSTRUCTIONS_PART_TYPEID,
} from './ico-instructions-part';

describe('IcoInstructionsPart model', () => {
  const instrSchema = ICO_INSTRUCTIONS_PART_SCHEMA.properties.instructions
    .items as any;

  it('should define the part type ID', () => {
    expect(ICO_INSTRUCTIONS_PART_TYPEID).toBe(
      'it.vedph.iconography.instructions',
    );
  });

  it('should build schema ID from type ID', () => {
    expect(ICO_INSTRUCTIONS_PART_SCHEMA.$id).toBe(
      'www.vedph.it/cadmus/parts/iconography/' +
        ICO_INSTRUCTIONS_PART_TYPEID +
        '.json',
    );
    expect(ICO_INSTRUCTIONS_PART_SCHEMA.required).toEqual(['instructions']);
  });

  it('should require the same instruction fields as the model', () => {
    expect(instrSchema.required).toEqual([
      'types',
      'script',
      'location',
      'position',
    ]);
  });

  it('should define all instruction properties of the model', () => {
    expect(Object.keys(instrSchema.properties).sort()).toEqual(
      [
        'eid',
        'types',
        'subject',
        'script',
        'text',
        'sequences',
        'repertoire',
        'location',
        'position',
        'positionNote',
        'targetLocation',
        'implementation',
        'differences',
        'note',
        'description',
        'features',
        'languages',
        'tools',
        'colors',
        'colorReuses',
        'links',
        'date',
        'assertion',
      ].sort(),
    );
  });

  it('should define required fields of nested objects', () => {
    const p = instrSchema.properties;
    expect(p.types.items.required).toEqual(['value']);
    expect(p.differences.items.required).toEqual(['type']);
    expect(p.colorReuses.items.required).toEqual(['color', 'location']);
    expect(p.links.items.required).toEqual(['target']);
    expect(p.date.required).toEqual(['a']);
    expect(p.assertion.required).toEqual(['rank']);
  });
});
