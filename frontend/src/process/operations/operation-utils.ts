import {
  fetchArchetypeByDedicationFeat,
  fetchContentAll,
  fetchContentById,
  fetchTraitByName,
} from '@content/content-store';
import { GenericData } from '@drawers/types/GenericDrawer';
import { AbilityBlock, ContentType, Item, Language, Spell, Trait } from '@typing/content';
import {
  Operation,
  OperationAddBonusToValue,
  OperationAdjValue,
  OperationConditional,
  OperationCreateValue,
  OperationDefineCastingSource,
  OperationGiveAbilityBlock,
  OperationGiveItem,
  OperationGiveLanguage,
  OperationGiveSpell,
  OperationGiveSpellSlot,
  OperationGiveTrait,
  OperationRemoveAbilityBlock,
  OperationRemoveLanguage,
  OperationRemoveSpell,
  OperationSelect,
  OperationSelectFilters,
  OperationSelectFiltersAbilityBlock,
  OperationSelectFiltersAdjValue,
  OperationSelectFiltersLanguage,
  OperationSelectFiltersSpell,
  OperationSelectFiltersTrait,
  OperationSelectOption,
  OperationSelectOptionAbilityBlock,
  OperationSelectOptionAdjValue,
  OperationSelectOptionCustom,
  OperationSelectOptionLanguage,
  OperationSelectOptionSpell,
  OperationSelectOptionType,
  OperationSetValue,
  OperationType,
} from '@typing/operations';
import { ProficiencyValue, StoreID, Variable, VariableListStr, VariableProf, VariableValue } from '@typing/variables';
import { hasTraitType } from '@utils/traits';
import {
  addVariable,
  getAllAncestryTraitVariables,
  getAllArchetypeTraitVariables,
  getAllArmorGroupVariables,
  getAllAttributeVariables,
  getAllClassTraitVariables,
  getAllSkillVariables,
  getAllWeaponGroupVariables,
  getVariable,
} from '@variables/variable-manager';
import { isProficiencyTypeGreaterOrEqual, labelToVariable, variableToLabel } from '@variables/variable-utils';
import * as _ from 'lodash-es';

export function createDefaultOperation<T = Operation>(type: OperationType): T {
  if (type === 'giveAbilityBlock') {
    return {
      id: crypto.randomUUID(),
      type: type,
      data: {
        type: 'feat',
        abilityBlockId: -1,
      },
    } satisfies OperationGiveAbilityBlock as T;
  } else if (type === 'adjValue') {
    return {
      id: crypto.randomUUID(),
      type: type,
      data: {
        variable: '',
        value: 0,
      },
    } satisfies OperationAdjValue as T;
  } else if (type === 'addBonusToValue') {
    return {
      id: crypto.randomUUID(),
      type: type,
      data: {
        variable: '',
        value: undefined,
        type: undefined,
        text: '',
      },
    } satisfies OperationAddBonusToValue as T;
  } else if (type === 'setValue') {
    return {
      id: crypto.randomUUID(),
      type: type,
      data: {
        variable: '',
        value: false,
      },
    } satisfies OperationSetValue as T;
  } else if (type === 'createValue') {
    return {
      id: crypto.randomUUID(),
      type: type,
      data: {
        variable: '',
        value: '',
        type: 'str',
      },
    } satisfies OperationCreateValue as T;
  } else if (type === 'conditional') {
    return {
      id: crypto.randomUUID(),
      type: type,
      data: {
        conditions: [],
        trueOperations: undefined,
        falseOperations: undefined,
      },
    } satisfies OperationConditional as T;
  } else if (type === 'select') {
    return {
      id: crypto.randomUUID(),
      type: type,
      data: {
        title: '',
        description: '',
        modeType: 'PREDEFINED',
        optionType: 'ABILITY_BLOCK',
        optionsPredefined: [],
        optionsFilters: undefined,
        // {
        //   id: crypto.randomUUID(),
        //   type: 'ABILITY_BLOCK',
        //   level: {
        //     min: undefined,
        //     max: undefined,
        //   },
        //   traits: undefined,
        // },
      },
    } satisfies OperationSelect as T;
  } else if (type === 'giveSpell') {
    return {
      id: crypto.randomUUID(),
      type: type,
      data: {
        spellId: -1,
        type: 'NORMAL',
      },
    } satisfies OperationGiveSpell as T;
  } else if (type === 'giveSpellSlot') {
    return {
      id: crypto.randomUUID(),
      type: type,
      data: {
        castingSource: '',
        slots: [],
      },
    } satisfies OperationGiveSpellSlot as T;
  } else if (type === 'defineCastingSource') {
    return {
      id: crypto.randomUUID(),
      type: type,
      data: {
        variable: 'CASTING_SOURCES',
        value: ':::-:::ARCANE:::ATTRIBUTE_STR',
      },
    } satisfies OperationDefineCastingSource as T;
  } else if (type === 'removeAbilityBlock') {
    return {
      id: crypto.randomUUID(),
      type: type,
      data: {
        type: 'feat',
        abilityBlockId: -1,
      },
    } satisfies OperationRemoveAbilityBlock as T;
  } else if (type === 'removeSpell') {
    return {
      id: crypto.randomUUID(),
      type: type,
      data: {
        spellId: -1,
      },
    } satisfies OperationRemoveSpell as T;
  } else if (type === 'giveLanguage') {
    return {
      id: crypto.randomUUID(),
      type: type,
      data: {
        languageId: -1,
      },
    } satisfies OperationGiveLanguage as T;
  } else if (type === 'removeLanguage') {
    return {
      id: crypto.randomUUID(),
      type: type,
      data: {
        languageId: -1,
      },
    } satisfies OperationRemoveLanguage as T;
  } else if (type === 'giveItem') {
    return {
      id: crypto.randomUUID(),
      type: type,
      data: {
        itemId: -1,
      },
    } satisfies OperationGiveItem as T;
  } else if (type === 'giveTrait') {
    return {
      id: crypto.randomUUID(),
      type: type,
      data: {
        traitId: -1,
      },
    } satisfies OperationGiveTrait as T;
  } else {
    throw new Error(`Unknown operation type: ${type}`);
  }
}

export interface ObjectWithUUID {
  [key: string]: any;
  _select_uuid: string;
  _content_type: ContentType;
  _meta_data?: Record<string, any>;
}

export async function determineFilteredSelectionList(
  id: StoreID,
  operationUUID: string,
  filters: OperationSelectFilters
): Promise<ObjectWithUUID[]> {
  if (filters.type === 'ABILITY_BLOCK') {
    return await getAbilityBlockList(id, operationUUID, filters);
  } else if (filters.type === 'SPELL') {
    return await getSpellList(operationUUID, filters);
  } else if (filters.type === 'LANGUAGE') {
    return await getLanguageList(id, operationUUID, filters);
  } else if (filters.type === 'TRAIT') {
    return await getTraitList(id, operationUUID, filters);
  } else if (filters.type === 'ADJ_VALUE') {
    return await getAdjValueList(id, operationUUID, filters);
  }
  return [];
}

async function getAbilityBlockList(id: StoreID, operationUUID: string, filters: OperationSelectFiltersAbilityBlock) {
  let abilityBlocks = await fetchContentAll<AbilityBlock>('ability-block');

  abilityBlocks = abilityBlocks.filter((ab) => ab.meta_data?.unselectable !== true);

  if (filters.abilityBlockType !== undefined) {
    abilityBlocks = abilityBlocks.filter((ab) => ab.type === filters.abilityBlockType);
  }

  if (filters.level.min !== undefined) {
    abilityBlocks = abilityBlocks.filter((ab) => ab.level !== undefined && ab.level >= filters.level.min!);
  }
  if (filters.level.max !== undefined) {
    abilityBlocks = abilityBlocks.filter((ab) => ab.level !== undefined && ab.level <= filters.level.max!);
  }

  if (filters.isFromAncestry) {
    const traitIds = getAllAncestryTraitVariables(id).map((v) => v.value) ?? [];
    abilityBlocks = abilityBlocks.filter((ab) => {
      if (!ab.traits) {
        return false;
      }
      return _.intersection(ab.traits, traitIds).length > 0;
    });
  }
  if (filters.isFromClass) {
    const traitIds = getAllClassTraitVariables(id).map((v) => v.value) ?? [];
    abilityBlocks = abilityBlocks.filter((ab) => {
      if (!ab.traits) {
        return false;
      }
      return _.intersection(ab.traits, traitIds).length > 0;
    });
  }
  if (filters.isFromArchetype) {
    const traitIds = getAllArchetypeTraitVariables(id).map((v) => v.value) ?? [];
    abilityBlocks = abilityBlocks.filter((ab) => {
      if (!ab.traits) {
        return false;
      }
      return _.intersection(ab.traits, traitIds).length > 0;
    });
  }

  if (filters.traits !== undefined) {
    const tDatas = await Promise.all(
      filters.traits.map((t) =>
        // If it's a number, it's a trait id, otherwise it's a trait name
        _.isNumber(t) ? t : fetchTraitByName(t)
      )
    );
    const traitIds = tDatas.map((t) => (_.isNumber(t) ? t : t?.id)).filter((t) => t) as number[];

    // Filter out ability blocks that don't have all the traits
    abilityBlocks = abilityBlocks.filter((ab) => {
      if (!ab.traits && traitIds.length > 0) {
        return false;
      }
      if ((!ab.traits && traitIds.length === 0) || (ab.traits && ab.traits.length === 0 && traitIds.length === 0)) {
        return true;
      }
      const intersection = _.intersection(ab.traits ?? [], traitIds);
      return intersection.length === traitIds.length;
    });
  }

  return abilityBlocks.map((ab) => {
    return {
      ...ab,
      _select_uuid: `${ab.id}`,
      _content_type: 'ability-block' as ContentType,
    };
  });
}

async function getSpellList(operationUUID: string, filters: OperationSelectFiltersSpell) {
  let spells = await fetchContentAll<Spell>('spell');

  spells = spells.filter((spell) => spell.meta_data?.unselectable !== true);

  if (filters.level.min !== undefined) {
    spells = spells.filter((spell) => spell.rank >= filters.level.min!);
  }
  if (filters.level.max !== undefined) {
    spells = spells.filter((spell) => spell.rank <= filters.level.max!);
  }
  if (filters.traits !== undefined) {
    const traits = await Promise.all(filters.traits.map((trait) => fetchTraitByName(trait)));
    const traitIds = traits.filter((trait) => trait).map((trait) => trait!.id);

    // Filter out spells that don't have all the traits
    spells = spells.filter((spell) => {
      if (!spell.traits && traitIds.length > 0) {
        return false;
      }
      if (
        (!spell.traits && traitIds.length === 0) ||
        (spell.traits && spell.traits.length === 0 && traitIds.length === 0)
      ) {
        return true;
      }
      const intersection = _.intersection(spell.traits ?? [], traitIds);
      return intersection.length === traitIds.length;
    });
  }
  if (filters.traditions !== undefined) {
    spells = spells.filter((spell) => {
      const intersection = _.intersection(
        spell.traditions.map((t) => t.toUpperCase()),
        (filters.traditions ?? []).map((t) => t.toUpperCase())
      );
      return intersection.length === filters.traditions!.length;
    });
  }

  return spells.map((spell) => {
    return {
      ...spell,
      _select_uuid: `${spell.id}`,
      _content_type: 'spell' as ContentType,
      _meta_data: {
        ...filters.spellData,
      },
    };
  });
}

async function getLanguageList(id: StoreID, operationUUID: string, filters: OperationSelectFiltersLanguage) {
  let languages = await fetchContentAll<Language>('language');

  if (filters.rarity) {
    languages = languages.filter((language) => language.rarity === filters.rarity);
  }
  if (filters.core) {
    // Sort by core first
    const coreLangs = (getVariable(id, 'CORE_LANGUAGES')?.value ?? []) as string[];
    languages = languages.map((language) => ({
      ...language,
      _is_core: coreLangs.includes(language.name),
    }));
  }

  return languages.map((language) => {
    return {
      ...language,
      _select_uuid: `${language.id}`,
      _content_type: 'language' as ContentType,
    };
  });
}

async function getTraitList(id: StoreID, operationUUID: string, filters: OperationSelectFiltersTrait) {
  let traits = await fetchContentAll<Trait>('trait');

  traits = traits.filter((traits) => traits.meta_data?.unselectable !== true);

  if (filters.isCreature) {
    traits = traits.filter((trait) => trait.meta_data?.creature_trait);
  }
  if (filters.isAncestry) {
    traits = traits.filter((trait) => trait.meta_data?.ancestry_trait || trait.meta_data?.versatile_heritage_trait);
  }
  if (filters.isClass) {
    traits = traits.filter((trait) => trait.meta_data?.class_trait);
  }

  return traits.map((trait) => {
    return {
      ...trait,
      _select_uuid: `${trait.id}`,
      _content_type: 'trait' as ContentType,
    };
  });
}

async function getAdjValueList(id: StoreID, operationUUID: string, filters: OperationSelectFiltersAdjValue) {
  let variables: Variable[] = [];

  if (filters.group === 'SKILL') {
    variables = getAllSkillVariables(id);
  }
  if (filters.group === 'ADD-LORE') {
    variables = getAllSkillVariables(id).filter((variable) => variable.name.startsWith('SKILL_LORE_'));
  }
  if (filters.group === 'ATTRIBUTE') {
    variables = getAllAttributeVariables(id);
  }
  if (filters.group === 'WEAPON-GROUP') {
    variables = getAllWeaponGroupVariables(id);
  }
  if (filters.group === 'ARMOR-GROUP') {
    variables = getAllArmorGroupVariables(id);
  }
  if (filters.group === 'WEAPON') {
    const items = await fetchContentAll<Item>('item');
    const weapons = items.filter((item) => item.group === 'WEAPON');
    variables = weapons.map((w) => {
      return {
        name: `WEAPON_${labelToVariable(w.name)}`,
        type: 'prof',
        value: { value: 'U' },
      } satisfies VariableProf;
    });
  }
  if (filters.group === 'ARMOR') {
    const items = await fetchContentAll<Item>('item');
    const armor = items.filter((item) => item.group === 'ARMOR');
    variables = armor.map((a) => {
      return {
        name: `ARMOR_${labelToVariable(a.name)}`,
        type: 'prof',
        value: { value: 'U' },
      } satisfies VariableProf;
    });
  }

  return variables.map((variable) => {
    return {
      _select_uuid: `${variable.name}`,
      _content_type: 'ability-block' as ContentType,
      id: `${variable.name}`,
      name: variable ? variableToLabel(variable) : 'Unknown Value',
      value: filters.value,
      variable: variable.name,
    };
  });
}

export async function determinePredefinedSelectionList(
  id: StoreID,
  type: OperationSelectOptionType,
  options: OperationSelectOption[]
): Promise<ObjectWithUUID[]> {
  if (type === 'ABILITY_BLOCK') {
    return await getAbilityBlockPredefinedList(options as OperationSelectOptionAbilityBlock[]);
  } else if (type === 'SPELL') {
    return await getSpellPredefinedList(options as OperationSelectOptionSpell[]);
  } else if (type === 'LANGUAGE') {
    return await getLanguagePredefinedList(options as OperationSelectOptionLanguage[]);
  } else if (type === 'ADJ_VALUE') {
    return await getAdjValuePredefinedList(id, options as OperationSelectOptionAdjValue[]);
  } else if (type === 'CUSTOM') {
    return await getCustomPredefinedList(options as OperationSelectOptionCustom[]);
  }
  return [];
}

async function getAbilityBlockPredefinedList(options: OperationSelectOptionAbilityBlock[]) {
  const abilityBlocks = await Promise.all(
    options.map((option) => fetchContentById<AbilityBlock>('ability-block', option.operation.data.abilityBlockId))
  );

  const result = [];
  for (const abilityBlock of abilityBlocks) {
    if (abilityBlock) {
      const option = options.find((option) => option.operation.data.abilityBlockId === abilityBlock.id);
      result.push({
        ...abilityBlock,
        _select_uuid: option!.id,
        _content_type: 'ability-block' as ContentType,
      });
    }
  }
  return result;
}

async function getSpellPredefinedList(options: OperationSelectOptionSpell[]) {
  const spells = await Promise.all(
    options.map((option) => fetchContentById<Spell>('spell', option.operation.data.spellId))
  );

  const result = [];
  for (const spell of spells) {
    if (spell) {
      const option = options.find((option) => option.operation.data.spellId === spell.id);
      const firstOption = options.length > 0 ? options[0] : undefined;
      result.push({
        ...spell,
        _select_uuid: option!.id,
        _content_type: 'spell' as ContentType,
        _meta_data: {
          ...firstOption?.operation.data,
        },
      });
    }
  }
  return result;
}

async function getLanguagePredefinedList(options: OperationSelectOptionLanguage[]) {
  const languages = await Promise.all(
    options.map((option) => fetchContentById<Language>('language', option.operation.data.languageId))
  );

  const result = [];
  for (const language of languages) {
    if (language) {
      const option = options.find((option) => option.operation.data.languageId === language.id);
      result.push({
        ...language,
        _select_uuid: option!.id,
        _content_type: 'language' as ContentType,
      });
    }
  }
  return result;
}

async function getAdjValuePredefinedList(id: StoreID, options: OperationSelectOptionAdjValue[]) {
  return options.map((option) => {
    const variable = getVariable(id, option.operation.data.variable);
    return {
      _select_uuid: option.operation.id,
      _content_type: 'ability-block' as ContentType,
      id: option.operation.id,
      name: variable ? variableToLabel(variable) : 'Unknown Value',
      value: option.operation.data.value,
      variable: option.operation.data.variable,
    };
  });
}

async function getCustomPredefinedList(options: OperationSelectOptionCustom[]) {
  return options.map((option) => {
    return {
      _select_uuid: option.id,
      _content_type: 'ability-block' as ContentType,
      _custom_select: {
        title: option.title,
        description: option.description,
        operations: option.operations,
      } satisfies GenericData,
      id: option.id,
      name: option.title,
      title: option.title,
      description: option.description,
      operations: option.operations,
    };
  });
}

export async function extendOperations(
  obj: AbilityBlock | ObjectWithUUID,
  operations: Operation[] | undefined
): Promise<Operation[]> {
  if (!obj || !obj.traits || obj.traits.length === 0 || !hasTraitType('DEDICATION', obj.traits)) {
    return operations ?? [];
  }

  const archetype = await fetchArchetypeByDedicationFeat(obj.id);
  if (!archetype) {
    return operations ?? [];
  }

  return [
    ...(operations ?? []),
    {
      ...createDefaultOperation<OperationGiveTrait>('giveTrait'),
      data: {
        traitId: archetype.trait_id,
      },
    } satisfies OperationGiveTrait,
  ];
}

export function isSkillAlreadyTrained(varId: StoreID, variableName: string, value: VariableValue): boolean {
  const variable = getAllSkillVariables(varId).find((v) => v.name === variableName);
  if (!variable) {
    return false;
  }
  const profType = (value as ProficiencyValue).value;
  if (profType !== 'T') return false;
  return isProficiencyTypeGreaterOrEqual(variable.value.value, profType);
}
