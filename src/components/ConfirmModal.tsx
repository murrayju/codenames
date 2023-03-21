import { position } from 'polished';
import React, { ReactNode } from 'react';
import { Button, Modal } from 'react-bootstrap';
import styled from 'styled-components';

const Overlay = styled.div`
  ${position('fixed', 0, 0, 0, 0)};
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
`;

interface Props {
  message: string | ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}

const ConfirmModal = ({ message, onCancel, onConfirm, title }: Props) => (
  <Overlay onClick={onCancel}>
    {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
    <div className="modal-content" onClick={(evt) => evt.stopPropagation()}>
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      {message && <Modal.Body>{message}</Modal.Body>}

      <Modal.Footer>
        <Button onClick={onCancel}>Cancel</Button>
        <Button bsStyle="primary" onClick={onConfirm}>
          Confirm
        </Button>
      </Modal.Footer>
    </div>
  </Overlay>
);

export default ConfirmModal;
