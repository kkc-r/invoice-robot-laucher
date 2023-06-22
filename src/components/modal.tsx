import { Box, Button, Modal, Paper, styled } from '@mui/material';
import { useEffect, useState } from 'react';
import { messages } from '../util/messages';

export type Props = {
  message: string;
  secondMessage?: string;
  isConfirm: boolean;
  onClose?: (isOk: boolean) => void;
};

export const ModalDialog = (props: Props) => {
  const { message, secondMessage, isConfirm, onClose } = props;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    handleOpen();
  }, []);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = (value: boolean) => {
    if (onClose) {
      onClose(value);
    }
    setOpen(false);
  };

  const Buttons = () => {
    return isConfirm ? (
      <>
        <ExecButton variant="contained" onClick={() => handleClose(true)}>
          {messages.advanced.ok}
        </ExecButton>
        <ExecButton variant="outlined" onClick={() => handleClose(false)}>
          {messages.advanced.cancel}
        </ExecButton>
      </>
    ) : (
      <ExecButton variant="contained" onClick={() => setOpen(false)}>
        {messages.main.ok}
      </ExecButton>
    );
  };

  return (
    <>
      <Modal open={open}>
        <BoxContentModal>
          <ModalItem>{message}</ModalItem>
          <ModalItem sx={secondMessage == null ? { display: 'none' } : {}}>{secondMessage}</ModalItem>
          <Buttons />
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

const BoxContentModal = styled(Box)(() => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  borderRadius: 10,
  backgroundColor: 'white',
}));
