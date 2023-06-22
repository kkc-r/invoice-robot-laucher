import { Button, Paper, styled } from '@mui/material';

type Props = {
  onClick: () => void;
  disabled: boolean;
  status: string;
  label: string;
};

export const ActionButton = (props: Props) => {
  const { onClick, disabled, status, label } = props;

  return (
    <>
      <PaperItem>
        <ExecButton variant="contained" onClick={onClick} disabled={disabled}>
          {label}
        </ExecButton>
        <div>{status}</div>
      </PaperItem>
    </>
  );
};

const PaperItem = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

const ExecButton = styled(Button)(() => ({
  width: '100%',
  marginBottom: '10px',
  textTransform: 'none',
}));
