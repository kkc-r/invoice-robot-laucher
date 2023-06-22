import { Box, Button, Checkbox, FormControlLabel, Modal, Paper, styled } from '@mui/material';
import { useEffect, useState } from 'react';
import { messages } from '../util/messages';

export type Props = {
  folderList: Array<{ name: string; selected: boolean }>;
  onClose: (isOk: boolean, folderList: Array<{ name: string; selected: boolean }>) => void;
};

export const SelectDeadline = (props: Props) => {
  const { folderList, onClose } = props;
  const [open, setOpen] = useState(false);
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    handleOpen();
  }, []);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = (value: boolean) => {
    if (onClose) {
      onClose(value, folderList);
    }
    setOpen(false);
  };

  return (
    <>
      <Modal open={open}>
        <BoxContentModal>
          <ModalItem>
            {messages.selectDeadlineFolder}
            <CheckBoxArea sx={{ overflowY: 'auto', maxHeight: '500px' }}>
              {folderList.map((value: { name: string; selected: boolean }) => {
                return (
                  <FormControlLabel
                    control={
                      <Checkbox
                        onChange={() => {
                          value.selected = !value.selected;
                          setDisabled(folderList.filter((value) => value.selected).length < 1);
                        }}
                      />
                    }
                    label={value.name}
                  />
                );
              })}
            </CheckBoxArea>
          </ModalItem>
          <ExecButton variant="contained" disabled={disabled} onClick={() => handleClose(true)}>
            {messages.exec}
          </ExecButton>
          <ExecButton variant="outlined" onClick={() => handleClose(false)}>
            {messages.cancel}
          </ExecButton>
        </BoxContentModal>
      </Modal>
    </>
  );
};

const ExecButton = styled(Button)(() => ({
  marginBottom: '10px',
  textTransform: 'none',
  margin: 10,
  width: 'calc(100% - 20px)',
}));

const ModalItem = styled(Paper)(() => ({
  display: 'flex',
  flexDirection: 'column',
  boxShadow: 'none',
  margin: 10,
}));

const CheckBoxArea = styled(Paper)(() => ({
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  boxShadow: 'none',
  margin: 10,
}));

const BoxContentModal = styled(Box)(() => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  borderRadius: 10,
  backgroundColor: 'white',
}));
