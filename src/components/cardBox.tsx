import { Box, Card, styled } from '@mui/material';

type Props = {
  children: React.ReactNode;
};

export const CardBox = (props: Props) => {
  return (
    <>
      <BoxCard>
        <BoxContent>{props.children}</BoxContent>
      </BoxCard>
    </>
  );
};

const BoxCard = styled(Card)(() => ({
  marginBottom: 20,
  marginLeft: 20,
  marginRight: 20,
}));

const BoxContent = styled(Box)(() => ({
  flexGrow: 1,
  margin: '20px 20px',
}));
