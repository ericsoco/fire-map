import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;

  font-size: 1.5rem;
`;

export default function FourOhFour() {
  return (
    <Container>
      <div>{"Hello? Is it me you're looking for?"}</div>
    </Container>
  );
}
