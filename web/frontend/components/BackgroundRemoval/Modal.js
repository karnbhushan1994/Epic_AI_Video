import { Modal } from '@shopify/app-bridge/actions';
import { useAppBridge } from '@shopify/app-bridge-react';
import { useEffect, useMemo } from 'react';

const Modal = (onPrimaryAction, onSecondaryAction) => {
  const app = useAppBridge();

  const modal = useMemo(() => {
    const instance = Modal.create(app, {
      title: 'Select Image',
      message: 'Choose an image from your library or upload a new one.',
      footer: {
        primaryAction: {
          content: 'Add Selected Image',
          onAction: () => {
            onPrimaryAction();
            instance.dispatch(Modal.Action.CLOSE);
          },
        },
        secondaryActions: [
          {
            content: 'Cancel',
            onAction: () => {
              onSecondaryAction?.();
              instance.dispatch(Modal.Action.CLOSE);
            },
          },
        ],
      },
    });

    return instance;
  }, [app, onPrimaryAction, onSecondaryAction]);

  useEffect(() => {
    return () => {
      modal.unsubscribe();
    };
  }, [modal]);

  return modal;
};

export default Modal;
