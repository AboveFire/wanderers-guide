import { useEffect, useState } from 'react';
import { defineEnabledContentSources, getContent } from '@content/content-controller';
import { selectContent } from '@common/select/SelectContent';
import { Button, TextInput, Title } from '@mantine/core';
import { AbilityBlock } from '@typing/content';
import { OperationSection } from '@common/operations/Operations';
import { setPageTitle } from '@utils/document-change';
import { modals, openContextModal } from '@mantine/modals';
import { CreateAbilityBlockModal } from '@modals/CreateAbilityBlockModal';

export default function DashboardPage() {
  setPageTitle(`Dashboard`);

  useEffect(() => {
    // makeRequest("get-sheet-content", {
    //   character_id: 1,
    // }).then((data) => {
    //   console.log(data);
    // });
    // defineEnabledContentSources([PLAYER_CORE_SOURCE_ID]);

    // console.log('got here')

    // for (let i = 3343; i < 3343+100; i++) {
    //   getContent('ability-block', i).then((data) => {
    //     console.log(data);
    //   });
    // }
    defineEnabledContentSources([1, 2, 3, 4, 5]);
  }, []);

  const [opened, setOpened] = useState(false);

  return (
    <div>
      <h1>Dashboard Page</h1>
      <Button
        onClick={() => {
          selectContent<AbilityBlock>(
            'ability-block',
            (option) => {
              console.log(option);
            },
            {
              abilityBlockType: 'feat',
              groupBySource: true,
            }
          );
        }}
      >
        Select Feat
      </Button>

      <Button onClick={() => setOpened(true)}>Create Feat</Button>
      <CreateAbilityBlockModal
        opened={opened}
        type='feat'
        onComplete={(feat) => {
          console.log(feat);
          setOpened(false);
        }}
        onCancel={() => setOpened(false)}
      />

      <OperationSection
        title={'Title TODO'}
        onChange={(operations) => {
          console.log(operations);
        }}
      />
    </div>
  );
}
