// src/components/common/SuspenseWrapper.js
import React, { Suspense } from 'react';

// Dynamically import TemplateCard
const TemplateCard = React.lazy(() => import('./TemplateCard'));

const SuspenseWrapper = ({ children }) => {
  return (
    <Suspense fallback={<div>Loading Template...</div>}>
      {children}
    </Suspense>
  );
};

export { TemplateCard, SuspenseWrapper };
