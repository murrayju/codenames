import { Dialog, Transition } from '@headlessui/react';
import React, { FC, Fragment, ReactNode, useCallback, useState } from 'react';

import Icon from './Icon';

interface Props {
  body: string | ReactNode;
  onClose: () => void;
}

export const Modal: FC<Props> = ({ body, onClose }) => {
  const [open, setOpen] = useState(true);

  const handleClose = useCallback(() => {
    setOpen(false);
    onClose();
  }, [onClose]);

  return (
    <Transition.Root as={Fragment} show={open}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all m-4">
                {body}
                <button
                  className="flex items-center justify-center absolute top-2 right-4"
                  onClick={handleClose}
                  type="button"
                >
                  <Icon name="xmark" size={24} />
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
