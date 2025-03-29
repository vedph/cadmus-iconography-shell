import { Part } from '@myrmidon/cadmus-core';
import { AssertedCompositeId } from '@myrmidon/cadmus-refs-asserted-ids';
import { Assertion } from '@myrmidon/cadmus-refs-assertion';
import { HistoricalDate } from '@myrmidon/cadmus-refs-historical-date';

/**
 * An implementation difference in an illuminator instruction.
 */
export interface IcoInstructionDiff {
  type: string;
  target?: string;
  note?: string;
}

/**
 * A color reuse in an illuminator instruction.
 */
export interface IcoColorReuse {
  color: string;
  location: string;
  note?: string;
}

/**
 * An illuminator instruction.
 */
export interface IcoInstruction {
  eid?: string;
  types: string[];
  prevTypes?: string[];
  nextTypes?: string[];
  subject?: string;
  script: string;
  text?: string;
  sequences?: string[];
  repertoire?: string;
  location: string;
  position: string;
  positionNote?: string;
  targetLocation?: string;
  implementation?: string;
  differences?: IcoInstructionDiff[];
  note?: string;
  description?: string;
  features?: string[];
  languages?: string[];
  tools?: string[];
  colors?: string[];
  colorReuses?: IcoColorReuse[];
  links?: AssertedCompositeId[];
  date?: HistoricalDate;
  assertion?: Assertion;
}

/**
 * The illuminator instructions part model.
 */
export interface IcoInstructionsPart extends Part {
  instructions: IcoInstruction[];
}

/**
 * The type ID used to identify the IcoInstructionsPart type.
 */
export const ICO_INSTRUCTIONS_PART_TYPEID = 'it.vedph.iconography.instructions';

/**
 * JSON schema for IcoInstructionsPart.
 * You can use the JSON schema tool at https://jsonschema.net/.
 */
export const ICO_INSTRUCTIONS_PART_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id:
    'www.vedph.it/cadmus/parts/iconography/' +
    ICO_INSTRUCTIONS_PART_TYPEID +
    '.json',
  type: 'object',
  title: 'IcoInstructionsPart',
  required: ['instructions'],
  properties: {
    instructions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['types', 'script', 'location', 'position'],
        properties: {
          eid: {
            type: 'string',
          },
          types: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          prevTypes: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          nextTypes: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          subject: {
            type: 'string',
          },
          script: {
            type: 'string',
          },
          text: {
            type: 'string',
          },
          sequences: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          repertoire: {
            type: 'string',
          },
          location: {
            type: 'string',
          },
          position: {
            type: 'string',
          },
          positionNote: {
            type: 'string',
          },
          targetLocation: {
            type: 'string',
          },
          implementation: {
            type: 'string',
          },
          differences: {
            type: 'array',
            items: {
              type: 'object',
              required: ['type'],
              properties: {
                type: {
                  type: 'string',
                },
                target: {
                  type: 'string',
                },
                note: {
                  type: 'string',
                },
              },
            },
          },
          note: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          features: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          languages: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          tools: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          colors: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          colorReuses: {
            type: 'array',
            items: {
              type: 'object',
              required: ['color', 'location'],
              properties: {
                color: {
                  type: 'string',
                },
                location: {
                  type: 'string',
                },
                note: {
                  type: 'string',
                },
              },
            },
          },
          links: {
            type: 'array',
            items: {
              type: 'object',
              required: ['target'],
              properties: {
                target: {
                  type: 'object',
                  required: ['gid', 'label'],
                  properties: {
                    gid: {
                      type: 'string',
                    },
                    label: {
                      type: 'string',
                    },
                    itemId: {
                      type: 'string',
                    },
                    partId: {
                      type: 'string',
                    },
                    partTypeId: {
                      type: 'string',
                    },
                    roleId: {
                      type: 'string',
                    },
                    name: {
                      type: 'string',
                    },
                    value: {
                      type: 'string',
                    },
                  },
                },
                assertion: {
                  type: 'object',
                  required: ['rank'],
                  properties: {
                    tag: {
                      type: 'string',
                    },
                    rank: {
                      type: 'integer',
                    },
                    note: {
                      type: 'string',
                    },
                    references: {
                      type: 'array',
                      items: {
                        anyOf: [
                          {
                            type: 'object',
                            required: ['citation'],
                            properties: {
                              type: {
                                type: 'string',
                              },
                              tag: {
                                type: 'string',
                              },
                              citation: {
                                type: 'string',
                              },
                              note: {
                                type: 'string',
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
          date: {
            type: 'object',
            required: ['a'],
            properties: {
              tag: {
                type: 'string',
              },
              a: {
                type: 'object',
                required: ['value'],
                properties: {
                  value: {
                    type: 'integer',
                  },
                  isCentury: {
                    type: 'boolean',
                  },
                  isSpan: {
                    type: 'boolean',
                  },
                  isApproximate: {
                    type: 'boolean',
                  },
                  isDubious: {
                    type: 'boolean',
                  },
                  day: {
                    type: 'integer',
                  },
                  month: {
                    type: 'integer',
                  },
                  hint: {
                    type: ['string', 'null'],
                  },
                },
              },
              b: {
                type: 'object',
                required: ['value'],
                properties: {
                  value: {
                    type: 'integer',
                  },
                  isCentury: {
                    type: 'boolean',
                  },
                  isSpan: {
                    type: 'boolean',
                  },
                  isApproximate: {
                    type: 'boolean',
                  },
                  isDubious: {
                    type: 'boolean',
                  },
                  day: {
                    type: 'integer',
                  },
                  month: {
                    type: 'integer',
                  },
                  hint: {
                    type: ['string', 'null'],
                  },
                },
              },
            },
          },
          assertion: {
            type: 'object',
            required: ['rank'],
            properties: {
              tag: {
                type: 'string',
              },
              rank: {
                type: 'integer',
              },
              note: {
                type: 'string',
              },
              references: {
                type: 'array',
                items: {
                  anyOf: [
                    {
                      type: 'object',
                      required: ['citation'],
                      properties: {
                        type: {
                          type: 'string',
                        },
                        tag: {
                          type: 'string',
                        },
                        citation: {
                          type: 'string',
                        },
                        note: {
                          type: 'string',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
  },
};
