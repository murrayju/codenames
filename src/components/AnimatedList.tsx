import cn from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, useEffect, useRef, useState } from 'react';
import { styled } from 'styled-components';

import { LogMessage } from '../api/Game';

const FadingDiv = styled.div`
  -webkit-mask-image: linear-gradient(0deg, #000 30%, transparent);
`;

interface ItemProps {
  text: string;
}

const ListItem: FC<ItemProps> = ({ text }) => (
  <motion.div
    animate={{ opacity: 1, y: 0 }}
    className=""
    exit={{ opacity: 0, y: 20 }}
    initial={{ opacity: 0, y: -20 }}
  >
    {text}
  </motion.div>
);

interface Props {
  className?: string;
  messages: LogMessage[];
}

export const AnimatedList: FC<Props> = ({ className = '', messages }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);

  const handleScroll = () => {
    const container = containerRef.current;
    if (container) {
      const isAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        10;
      setUserScrolled(!isAtBottom);
    }
  };

  const scrollToBottom = () => {
    const container = containerRef.current;
    if (!userScrolled && container) {
      containerRef.current?.scrollTo({
        behavior: 'smooth',
        top: 1 + container.scrollHeight - container.clientHeight,
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <FadingDiv
      ref={containerRef}
      className={cn('relative overflow-y-auto', className)}
      onScroll={handleScroll}
    >
      <AnimatePresence>
        {messages.map(({ id, message }) => (
          <ListItem key={id} text={message} />
        ))}
      </AnimatePresence>
    </FadingDiv>
  );
};
