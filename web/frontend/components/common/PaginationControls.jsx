import React from 'react';
import { Box, Pagination } from '@shopify/polaris';

const PaginationControls = ({ currentPage, totalPages, onPrevious, onNext }) => {
  return (
    <Box padding="400" className="bottom-pagination">
      <Pagination
        hasPrevious={currentPage > 1}
        onPrevious={onPrevious}
        hasNext={currentPage < totalPages}
        onNext={onNext}
        label={`Page ${currentPage} of ${totalPages}`}
      />
    </Box>
  );
};

export default PaginationControls;
