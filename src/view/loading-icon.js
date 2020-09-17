import React from 'react';
import PropTypes from 'prop-types';
import styled, { keyframes } from 'styled-components';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
`;

const ldsEllipsis1 = keyframes`
  0% { transform: scale(0); }
  100% { transform: scale(1); }
`;
const ldsEllipsis3 = keyframes`
  0% { transform: scale(1); }
  100% { transform: scale(0); }
`;
const ldsEllipsis2 = keyframes`
  0% { transform: translate(0, 0); }
  100% { transform: translate(24px, 0); }
`;

const BKGD_WIDTH = 114;
const BKGD_HEIGHT = 64;
const IconBackground = styled.div`
  position: absolute;
  width: ${BKGD_WIDTH}px;
  height: ${BKGD_HEIGHT}px;
  left: calc(50% - ${BKGD_WIDTH / 2}px);
  top: calc(50% - ${BKGD_HEIGHT / 2}px);
  border-radius: 12px;
  background-color: rgba(0, 0, 0, 0.125);
`;

const IconContainer = styled.div`
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;

  div {
    position: absolute;
    top: 33px;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #fff;
    animation-timing-function: cubic-bezier(0, 1, 1, 0);

    &:nth-child(1) {
      left: 8px;
      animation: ${ldsEllipsis1} 0.6s infinite;
    }
    &:nth-child(2) {
      left: 8px;
      animation: ${ldsEllipsis2} 0.6s infinite;
    }
    &:nth-child(3) {
      left: 32px;
      animation: ${ldsEllipsis2} 0.6s infinite;
    }
    &:nth-child(4) {
      left: 56px;
      animation: ${ldsEllipsis3} 0.6s infinite;
    }
  }
`;

/**
 * CC0-licensed loading indicator
 * from https://loading.io/css/
 */
export default function LoadingIcon({ withBackground }) {
  return (
    <Container>
      {withBackground && <IconBackground />}
      <IconContainer>
        <div />
        <div />
        <div />
        <div />
      </IconContainer>
    </Container>
  );
}

LoadingIcon.propTypes = {
  withBackground: PropTypes.bool,
};
