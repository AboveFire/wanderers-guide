import { CharacterInfo } from '@common/CharacterInfo';
import {
  Accordion,
  Badge,
  Box,
  Button,
  Group,
  Indicator,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  UnstyledButton,
  useMantineTheme,
} from '@mantine/core';
import {
  Ancestry,
  Background,
  Character,
  Class,
  ContentPackage,
  ContentSource,
} from '@typing/content';
import classes from '@css/FaqSimple.module.css';
import { useElementSize, useHover, useInterval } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { selectContent } from '@common/select/SelectContent';
import { characterState } from '@atoms/characterAtoms';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useQuery } from '@tanstack/react-query';
import { getContentPackage } from '@content/content-controller';
import D20Loader from '@assets/images/D20Loader';

export default function CharBuilderCreation(props: { books: ContentSource[]; pageHeight: number }) {
  const theme = useMantineTheme();
  const character = useRecoilValue(characterState);

  const { data: content, isFetching } = useQuery({
    queryKey: [`find-content-${character?.id}`],
    queryFn: async () => {
      const content = await getContentPackage(props.books.map((book) => book.id));
      interval.stop();
      return content;
    },
    refetchOnWindowFocus: false,
  });

  // Just load progress manually
  const [percentage, setPercentage] = useState(0);
  const interval = useInterval(() => setPercentage((p) => p + 2), 20);
  useEffect(() => {
    interval.start();
    return interval.stop;
  }, []);

  if (isFetching || !content) {
    return (
      <Box
        style={{
          width: '100%',
          height: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <D20Loader size={100} color={theme.colors[theme.primaryColor][5]} percentage={percentage} />
      </Box>
    );
  } else {
    return (
      <CharBuilderCreationInner
        books={props.books}
        content={content}
        pageHeight={props.pageHeight}
      />
    );
  }
}

export function CharBuilderCreationInner(props: {
  books: ContentSource[];
  content: ContentPackage;
  pageHeight: number;
}) {
  const { ref, height } = useElementSize();

  const [character, setCharacter] = useRecoilState(characterState);

  const [levelItemValue, setLevelItemValue] = useState<string | null>(null);

  const levelItems = Array.from({ length: (character?.level ?? 0) + 1 }, (_, i) => i).map(
    (level) => {
      return (
        <LevelSection
          key={level}
          level={level}
          opened={levelItemValue === `${level}`}
          content={props.content}
        />
      );
    }
  );

  return (
    <Group gap={0}>
      <Box style={{ flexBasis: '35%' }}>
        <Stack gap={5}>
          <Box pb={5}>
            <CharacterInfo
              ref={ref}
              character={character}
              onClickAncestry={() => {
                selectContent<Ancestry>(
                  'ancestry',
                  (option) => {
                    setCharacter((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        details: {
                          ...prev.details,
                          ancestry: option,
                        },
                      };
                    });
                  },
                  {
                    groupBySource: true,
                    selectedId: character?.details?.ancestry?.id,
                  }
                );
              }}
              onClickBackground={() => {
                selectContent<Background>(
                  'background',
                  (option) => {
                    setCharacter((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        details: {
                          ...prev.details,
                          background: option,
                        },
                      };
                    });
                  },
                  {
                    groupBySource: true,
                    selectedId: character?.details?.background?.id,
                  }
                );
              }}
              onClickClass={() => {
                selectContent<Class>(
                  'class',
                  (option) => {
                    setCharacter((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        details: {
                          ...prev.details,
                          class: option,
                        },
                      };
                    });
                  },
                  {
                    groupBySource: true,
                    selectedId: character?.details?.class?.id,
                  }
                );
              }}
            />
          </Box>
          <ScrollArea h={props.pageHeight - height - 20} pr={12}>
            <Stack gap={5}>
              <Box>
                <Button variant='default' size='lg' fullWidth>
                  <Group>
                    <AttributeModPart attribute='Str' value={-1} marked={false} />
                    <AttributeModPart attribute='Dex' value={0} marked={false} />
                    <AttributeModPart attribute='Con' value={3} marked={false} />
                    <AttributeModPart attribute='Int' value={4} marked={true} />
                    <AttributeModPart attribute='Wis' value={3} marked={false} />
                    <AttributeModPart attribute='Cha' value={3} marked={false} />
                  </Group>
                </Button>
              </Box>
              <StatButton>
                <Box>
                  <Text c='gray.0' fz='sm'>
                    Hit Points
                  </Text>
                </Box>
                <Box>
                  <Text c='gray.0'>67</Text>
                </Box>
              </StatButton>
              <StatButton>
                <Box>
                  <Text c='gray.0' fz='sm'>
                    Class DC
                  </Text>
                </Box>
                <Group>
                  <Text c='gray.0'>14</Text>
                  <Badge variant='default'>U</Badge>
                </Group>
              </StatButton>
              <StatButton>
                <Box>
                  <Text c='gray.0' fz='sm'>
                    Perception
                  </Text>
                </Box>
                <Group>
                  <Text c='gray.0'>+4</Text>
                  <Badge variant='default'>E</Badge>
                </Group>
              </StatButton>
              <Accordion
                variant='separated'
                styles={{
                  label: {
                    paddingTop: 5,
                    paddingBottom: 5,
                  },
                  control: {
                    paddingLeft: 13,
                    paddingRight: 13,
                  },
                  item: {
                    marginTop: 0,
                    marginBottom: 5,
                  },
                }}
              >
                <Accordion.Item className={classes.item} value={'skills'}>
                  <Accordion.Control>
                    <Text c='white' fz='sm'>
                      Skills
                    </Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap={5}>
                      <StatButton>
                        <Box>
                          <Text fz='sm'>Acrobatics</Text>
                        </Box>
                        <Group>
                          <Text>+4</Text>
                          <Badge variant='default'>E</Badge>
                        </Group>
                      </StatButton>
                      <StatButton>
                        <Box>
                          <Text fz='sm'>Arcana</Text>
                        </Box>
                        <Group>
                          <Text>+4</Text>
                          <Badge variant='default'>E</Badge>
                        </Group>
                      </StatButton>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item className={classes.item} value={'saves'}>
                  <Accordion.Control>
                    <Text c='white' fz='sm'>
                      Saves
                    </Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap={5}>
                      <StatButton>
                        <Box>
                          <Text fz='sm'>Fortitude</Text>
                        </Box>
                        <Group>
                          <Text>+4</Text>
                          <Badge variant='default'>E</Badge>
                        </Group>
                      </StatButton>
                      <StatButton>
                        <Box>
                          <Text fz='sm'>Reflex</Text>
                        </Box>
                        <Group>
                          <Text>+4</Text>
                          <Badge variant='default'>E</Badge>
                        </Group>
                      </StatButton>
                      <StatButton>
                        <Box>
                          <Text fz='sm'>Will</Text>
                        </Box>
                        <Group>
                          <Text>+4</Text>
                          <Badge variant='default'>E</Badge>
                        </Group>
                      </StatButton>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item className={classes.item} value={'attacks'}>
                  <Accordion.Control>
                    <Text c='white' fz='sm'>
                      Attacks
                    </Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap={5}>
                      <StatButton>
                        <Box>
                          <Text fz='sm'>Fortitude</Text>
                        </Box>
                        <Group>
                          <Text>+4</Text>
                          <Badge variant='default'>E</Badge>
                        </Group>
                      </StatButton>
                      <StatButton>
                        <Box>
                          <Text fz='sm'>Reflex</Text>
                        </Box>
                        <Group>
                          <Text>+4</Text>
                          <Badge variant='default'>E</Badge>
                        </Group>
                      </StatButton>
                      <StatButton>
                        <Box>
                          <Text fz='sm'>Will</Text>
                        </Box>
                        <Group>
                          <Text>+4</Text>
                          <Badge variant='default'>E</Badge>
                        </Group>
                      </StatButton>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item className={classes.item} value={'saving-throws'}>
                  <Accordion.Control>
                    <Text c='white' fz='sm'>
                      Saving Throws
                    </Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap={5}>
                      <StatButton>
                        <Box>
                          <Text fz='sm'>Fortitude</Text>
                        </Box>
                        <Group>
                          <Text>+4</Text>
                          <Badge variant='default'>E</Badge>
                        </Group>
                      </StatButton>
                      <StatButton>
                        <Box>
                          <Text fz='sm'>Reflex</Text>
                        </Box>
                        <Group>
                          <Text>+4</Text>
                          <Badge variant='default'>E</Badge>
                        </Group>
                      </StatButton>
                      <StatButton>
                        <Box>
                          <Text fz='sm'>Will</Text>
                        </Box>
                        <Group>
                          <Text>+4</Text>
                          <Badge variant='default'>E</Badge>
                        </Group>
                      </StatButton>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item className={classes.item} value={'spellcasting'}>
                  <Accordion.Control>
                    <Text c='white' fz='sm'>
                      Spellcasting
                    </Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap={5}>
                      <StatButton>
                        <Box>
                          <Text fz='sm'>Fortitude</Text>
                        </Box>
                        <Group>
                          <Text>+4</Text>
                          <Badge variant='default'>E</Badge>
                        </Group>
                      </StatButton>
                      <StatButton>
                        <Box>
                          <Text fz='sm'>Reflex</Text>
                        </Box>
                        <Group>
                          <Text>+4</Text>
                          <Badge variant='default'>E</Badge>
                        </Group>
                      </StatButton>
                      <StatButton>
                        <Box>
                          <Text fz='sm'>Will</Text>
                        </Box>
                        <Group>
                          <Text>+4</Text>
                          <Badge variant='default'>E</Badge>
                        </Group>
                      </StatButton>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item className={classes.item} value={'languages'}>
                  <Accordion.Control>
                    <Text c='white' fz='sm'>
                      Languages
                    </Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap={5}>
                      <StatButton>
                        <Box>
                          <Text fz='sm'>Fortitude</Text>
                        </Box>
                        <Group>
                          <Text>+4</Text>
                          <Badge variant='default'>E</Badge>
                        </Group>
                      </StatButton>
                      <StatButton>
                        <Box>
                          <Text fz='sm'>Reflex</Text>
                        </Box>
                        <Group>
                          <Text>+4</Text>
                          <Badge variant='default'>E</Badge>
                        </Group>
                      </StatButton>
                      <StatButton>
                        <Box>
                          <Text fz='sm'>Will</Text>
                        </Box>
                        <Group>
                          <Text>+4</Text>
                          <Badge variant='default'>E</Badge>
                        </Group>
                      </StatButton>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item className={classes.item} value={'resist-weaks'}>
                  <Accordion.Control>
                    <Text c='white' fz='sm'>
                      Resist & Weaks
                    </Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap={5}>
                      <StatButton>
                        <Box>
                          <Text fz='sm'>Fortitude</Text>
                        </Box>
                        <Group>
                          <Text>+4</Text>
                          <Badge variant='default'>E</Badge>
                        </Group>
                      </StatButton>
                      <StatButton>
                        <Box>
                          <Text fz='sm'>Reflex</Text>
                        </Box>
                        <Group>
                          <Text>+4</Text>
                          <Badge variant='default'>E</Badge>
                        </Group>
                      </StatButton>
                      <StatButton>
                        <Box>
                          <Text fz='sm'>Will</Text>
                        </Box>
                        <Group>
                          <Text>+4</Text>
                          <Badge variant='default'>E</Badge>
                        </Group>
                      </StatButton>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </Stack>
          </ScrollArea>
        </Stack>
      </Box>
      <Box style={{ flexBasis: '65%' }}>
        <ScrollArea h={props.pageHeight} pr={12}>
          <Accordion
            value={levelItemValue}
            onChange={setLevelItemValue}
            variant='filled'
            styles={{
              label: {
                paddingTop: 5,
                paddingBottom: 5,
              },
              control: {
                paddingLeft: 13,
                paddingRight: 13,
              },
              item: {
                marginTop: 0,
                marginBottom: 5,
              },
            }}
          >
            {levelItems}
          </Accordion>
        </ScrollArea>
      </Box>
    </Group>
  );
}

function AttributeModPart(props: { attribute: string; value: number; marked: boolean }) {
  return (
    <Box>
      <Text c='gray.0' ta='center' fz={11}>
        {props.attribute}
      </Text>
      <Text c='gray.0' ta='center'>
        <Text c='gray.0' span>
          {props.value < 0 ? '-' : '+'}
        </Text>

        <Text c='gray.0' td={props.marked ? 'underline' : undefined} span>
          {Math.abs(props.value)}
        </Text>
      </Text>
    </Box>
  );
}

function StatButton(props: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <Box>
      <Button
        variant='default'
        size='compact-lg'
        styles={{
          inner: {
            width: '100%',
          },
          label: {
            width: '100%',
          },
        }}
        fullWidth
        onClick={props.onClick}
      >
        <Group w='100%' justify='space-between'>
          {props.children}
        </Group>
      </Button>
    </Box>
  );
}

function LevelSection(props: { level: number; opened: boolean; content: ContentPackage }) {
  const { hovered, ref } = useHover();

  const selectionsToDo = 3;
  const selectionsTotal = 6;

  return (
    <Accordion.Item
      ref={ref}
      value={`${props.level}`}
      style={{
        backgroundColor: hovered && !props.opened ? 'rgba(0, 0, 0, 0.1)' : undefined,
      }}
    >
      <Accordion.Control>
        <Group wrap='nowrap' justify='space-between' gap={0}>
          <Text c='gray.5' fw={700} fz='sm'>
            {props.level === 0 ? (
              <>
                Initial Stats{' '}
                <Text fs='italic' c='dimmed' fz='sm' span>
                  (Level 1)
                </Text>
              </>
            ) : (
              `Level ${props.level}`
            )}
          </Text>
          <Badge mr='sm' variant='outline' color='gray.5' size='xs'>
            <Text fz='sm' c='gray.5' span>
              {selectionsToDo}
            </Text>
            <Text fz='sm' c='gray.5' span>
              /{selectionsTotal}
            </Text>
          </Badge>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>Content</Accordion.Panel>
    </Accordion.Item>
  );
}
