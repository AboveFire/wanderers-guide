import {
  Title,
  Image,
  Text,
  Button,
  Container,
  Group,
  rem,
  useMantineTheme,
  Box,
  Center,
  Avatar,
  Card,
  Loader,
  Divider,
  Badge,
  MantineColor,
  ColorInput,
  ColorSwatch,
  Popover,
  ColorPicker,
  ActionIcon,
  FileButton,
  LoadingOverlay,
  TextInput,
  FocusTrap,
} from '@mantine/core';
import { setPageTitle } from '@utils/document-change';
import { useNavigate } from 'react-router-dom';
import BlurBox from '@common/BlurBox';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPublicUser, hasPatronPermission } from '@auth/user-manager';
import { getDefaultBackgroundImage } from '@utils/background-images';
import { toLabel } from '@utils/strings';
import { GUIDE_BLUE } from '@constants/data';
import { IconAdjustments, IconBrandPatreon, IconReload, IconUpload } from '@tabler/icons-react';
import { Character, PublicUser } from '@typing/content';
import { useEffect, useState } from 'react';
import { getHotkeyHandler, useDebouncedValue, useDidUpdate, useHover } from '@mantine/hooks';
import { makeRequest } from '@requests/request-manager';
import { JSendResponse } from '@typing/requests';
import { uploadImage } from '@upload/image-upload';
import { displayPatronOnly } from '@utils/notifications';

export function Component() {
  setPageTitle(`Account`);

  const { data } = useQuery({
    queryKey: [`find-account-self`],
    queryFn: async () => {
      const user = await getPublicUser();
      return user;
    },
  });

  if (!data)
    return (
      <Loader
        size='lg'
        type='bars'
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    );

  return <ProfileSection user={data} />;
}

function ProfileSection(props: { user: PublicUser }) {
  const theme = useMantineTheme();
  //const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<PublicUser>(props.user);

  const { hovered: hoveredPfp, ref: refPfp } = useHover();
  const { hovered: hoveredBck, ref: refBck } = useHover();

  const [editingName, setEditingName] = useState(false);

  // Get character count
  const { data: characters } = useQuery({
    queryKey: [`find-character`],
    queryFn: async () => {
      return await makeRequest<Character[]>('find-character', {});
    },
  });

  const patronTier = toLabel(user.patreon_tier) || 'Non-Patron';
  let patronColor: MantineColor = 'gray';
  if (patronTier === 'Non-Patron') patronColor = 'gray';
  if (patronTier === 'Advocate') patronColor = 'teal';
  if (patronTier === 'Wanderer') patronColor = 'blue';
  if (patronTier === 'Legend') patronColor = 'grape';
  if (patronTier === 'Game Master') patronColor = 'orange';

  const { mutate: mutateUser } = useMutation(
    async (data: Record<string, any>) => {
      const response = await makeRequest<JSendResponse>('update-user', {
        ...data,
      });
      return response ? response.status === 'success' : false;
    },
    {
      onSuccess: () => {
        //queryClient.invalidateQueries([`find-account-self`]);
      },
    }
  );

  // Update user in db when state changed
  const [debouncedUser] = useDebouncedValue(user, 500);
  useDidUpdate(() => {
    if (!debouncedUser) return;
    mutateUser({
      display_name: debouncedUser.display_name,
      summary: debouncedUser.summary,
      image_url: debouncedUser.image_url,
      background_image_url: debouncedUser.background_image_url,
      site_theme: debouncedUser.site_theme,
    });
  }, [debouncedUser]);

  return (
    <Center>
      <Box maw={400} w='100%'>
        <BlurBox w={'100%'}>
          <LoadingOverlay visible={loading} />
          <Card pt={0} pb={'md'} radius='md' style={{ backgroundColor: 'transparent' }}>
            <FileButton
              onChange={async (file) => {
                if (!hasPatronPermission(user)) {
                  displayPatronOnly();
                  return;
                }

                // Upload file to server
                let path = '';
                if (file) {
                  setLoading(true);
                  path = await uploadImage(file, 'backgrounds');
                }
                setUser((prev) => {
                  if (!prev) return prev;
                  return { ...prev, background_image_url: path };
                });

                setLoading(false);
              }}
              accept='image/png,image/jpeg,image/jpg,image/webp'
            >
              {(subProps) => (
                <Box {...subProps}>
                  <Card.Section
                    h={140}
                    ref={refBck}
                    style={{
                      backgroundImage: `url(${user.background_image_url ?? getDefaultBackgroundImage().url})`,
                      backgroundSize: 'cover',
                      cursor: 'pointer',
                    }}
                  />
                  <ActionIcon
                    variant='transparent'
                    color='gray.1'
                    aria-label='Upload Background Image'
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,

                      visibility: hoveredBck ? 'visible' : 'hidden',
                    }}
                    size={40}
                  >
                    <IconUpload size='1.2rem' stroke={1.5} />
                  </ActionIcon>
                </Box>
              )}
            </FileButton>

            {/* <Box
              style={{
                position: 'absolute',
                top: 142,
                left: 2,
              }}
            >
              <ActionIcon
                size='xs'
                color='gray.5'
                variant='transparent'
                aria-label='Reload Webpage'
                onClick={() => {
                  window.location.reload();
                }}
              >
                <IconReload size='1rem' stroke={1.5} />
              </ActionIcon>
            </Box> */}

            <Box
              style={{
                position: 'absolute',
                top: 145,
                right: 5,
              }}
            >
              <Popover position='bottom' withArrow shadow='md'>
                <Popover.Target>
                  <ColorSwatch style={{ cursor: 'pointer' }} color={user.site_theme?.color || GUIDE_BLUE} size={15} />
                </Popover.Target>
                <Popover.Dropdown p={5}>
                  <ColorPicker
                    format='hex'
                    value={user.site_theme?.color || GUIDE_BLUE}
                    onChange={(value) => {
                      if (!hasPatronPermission(user)) {
                        displayPatronOnly();
                        return;
                      }

                      setUser((prev) => {
                        if (!prev) return prev;
                        return { ...prev, site_theme: { ...prev.site_theme, color: value } };
                      });
                    }}
                    swatches={[
                      '#25262b',
                      '#868e96',
                      '#fa5252',
                      '#e64980',
                      '#be4bdb',
                      '#8d69f5',
                      '#577deb',
                      GUIDE_BLUE,
                      '#15aabf',
                      '#12b886',
                      '#40c057',
                      '#82c91e',
                      '#fab005',
                      '#fd7e14',
                    ]}
                    swatchesPerRow={7}
                  />
                </Popover.Dropdown>
              </Popover>
            </Box>

            <Center>
              <FileButton
                onChange={async (file) => {
                  if (!hasPatronPermission(user)) {
                    displayPatronOnly();
                    return;
                  }

                  // Upload file to server
                  let path = '';
                  if (file) {
                    setLoading(true);
                    path = await uploadImage(file, 'portraits');
                  }
                  setUser((prev) => {
                    if (!prev) return prev;
                    return { ...prev, image_url: path };
                  });

                  setLoading(false);
                }}
                accept='image/png,image/jpeg,image/jpg,image/webp'
              >
                {(subProps) => (
                  <Box {...subProps} style={{ position: 'relative' }}>
                    <Avatar
                      ref={refPfp}
                      src={user.image_url}
                      size={80}
                      radius={80}
                      mt={-30}
                      style={{
                        backgroundColor: theme.colors.dark[7],
                        border: `2px solid ${theme.colors.dark[7] + 'D3'}`,
                        cursor: 'pointer',
                      }}
                    />

                    <ActionIcon
                      variant='transparent'
                      color='gray.1'
                      aria-label='Upload Profile Picture'
                      style={{
                        position: 'absolute',
                        top: '25%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',

                        visibility: hoveredPfp ? 'visible' : 'hidden',
                      }}
                      size={40}
                    >
                      <IconUpload size='2.2rem' stroke={1.5} />
                    </ActionIcon>
                  </Box>
                )}
              </FileButton>
            </Center>

            <Box mt={5}>
              {editingName ? (
                <Center>
                  <FocusTrap active={true}>
                    <TextInput
                      size='sm'
                      w={160}
                      styles={{
                        input: {
                          textAlign: 'center',
                        },
                      }}
                      spellCheck={false}
                      placeholder='Display Name'
                      value={user.display_name}
                      onChange={(e) => {
                        setUser((prev) => {
                          if (!prev) return prev;
                          return { ...prev, display_name: e.target.value };
                        });
                      }}
                      onKeyDown={getHotkeyHandler([
                        ['mod+Enter', () => setEditingName(false)],
                        ['Enter', () => setEditingName(false)],
                      ])}
                      onBlur={() => {
                        setEditingName(false);
                      }}
                    />
                  </FocusTrap>
                </Center>
              ) : (
                <Text
                  ta='center'
                  fz='lg'
                  fw={500}
                  onClick={() => {
                    setEditingName(true);
                  }}
                  style={{
                    cursor: 'pointer',
                  }}
                >
                  {user.display_name}
                </Text>
              )}
            </Box>

            <Text ta='center' fz='xs' c='dimmed' fs='italic'>
              {user.summary}
            </Text>
            <Group mt='md' justify='center' gap={30}>
              <Box>
                <Text ta='center' fz='lg' fw={500}>
                  {characters ? characters.length : '...'}
                </Text>
                <Text ta='center' fz='sm' c='dimmed' lh={1}>
                  Characters
                </Text>
              </Box>
              <Box>
                <Text ta='center' fz='lg' fw={500}>
                  0
                </Text>
                <Text ta='center' fz='sm' c='dimmed' lh={1}>
                  Bundles
                </Text>
              </Box>
              <Box>
                <Text ta='center' fz='lg' fw={500}>
                  0
                </Text>
                <Text ta='center' fz='sm' c='dimmed' lh={1}>
                  Campaigns
                </Text>
              </Box>
            </Group>
            <Divider mt='md' />
            <Group align='center' justify='center' p='xs'>
              {user.deactivated && (
                <Badge
                  variant='light'
                  size='md'
                  color='red'
                  styles={{
                    root: {
                      textTransform: 'initial',
                    },
                  }}
                >
                  Deactivated
                </Badge>
              )}
              {user.is_admin && (
                <Badge
                  variant='light'
                  size='md'
                  color='cyan'
                  styles={{
                    root: {
                      textTransform: 'initial',
                    },
                  }}
                >
                  Admin
                </Badge>
              )}
              {user.is_mod && (
                <Badge
                  variant='light'
                  size='md'
                  color='green'
                  styles={{
                    root: {
                      textTransform: 'initial',
                    },
                  }}
                >
                  Mod
                </Badge>
              )}

              <Badge
                variant='light'
                size='md'
                color={patronColor}
                styles={{
                  root: {
                    textTransform: 'initial',
                  },
                }}
              >
                {patronTier}
              </Badge>

              <Badge
                variant='light'
                size='md'
                color='yellow'
                styles={{
                  root: {
                    textTransform: 'initial',
                  },
                }}
              >
                New User
              </Badge>
            </Group>

            <Divider />

            <Group align='center' justify='center' pt={10}>
              <Button size='sm' variant='light' leftSection={<IconBrandPatreon size={18} />} fullWidth>
                Connect to Patreon
              </Button>
            </Group>
          </Card>
        </BlurBox>
      </Box>
    </Center>
  );
}